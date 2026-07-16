// boards-store.js over the in-memory ops: the storage invariants a forum lives on,
// uniqueness, atomic counters, bump-ordered thread lists, page-N pagination.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore, ConflictError } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { issueBan, banIsActive, softDeletePost, logEntry } from '../src/moderation.js';

const user = (id, name, email) => ({
  id, displayName: name, email, passwordHash: `scrypt$1$aa$bb`, role: 'member',
  postCount: 0, createdAt: '2001-01-01T00:00:00Z', sessionsValidAfter: 0,
});
const post = (authorId, at, body = 'hi') => ({ authorId, bodyHtml: body, createdAt: at });

let db;
beforeEach(() => { db = boardsStore(memOps()); });

describe('users + uniqueness', () => {
  it('registers a user and finds them by email and name', async () => {
    await db.createUser(user('u1', 'Alice', 'alice@x.example'));
    expect((await db.getUser('u1')).displayName).toBe('Alice');
    expect((await db.userByEmail('ALICE@x.example')).id).toBe('u1'); // case-insensitive
    expect((await db.userByName('alice')).id).toBe('u1');
  });

  it('rejects a taken name atomically (no half-created user or pointer)', async () => {
    await db.createUser(user('u1', 'Alice', 'alice@x.example'));
    await expect(db.createUser(user('u2', 'alice', 'other@x.example'))).rejects.toBeInstanceOf(ConflictError);
    expect(await db.getUser('u2')).toBeNull();               // no user item
    expect(await db.userByEmail('other@x.example')).toBeNull(); // no email pointer either
  });

  it('rejects a taken email', async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    await expect(db.createUser(user('u2', 'Bob', 'A@x.example'))).rejects.toBeInstanceOf(ConflictError);
  });

  it('revoking sessions stamps sessionsValidAfter (JWTs issued earlier stop verifying)', async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    await db.revokeSessions('u1', 1_700_000_000);
    expect((await db.getUser('u1')).sessionsValidAfter).toBe(1_700_000_000);
  });
});

describe('threads bump to the top on reply, pinned first', () => {
  beforeEach(async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    // three threads, oldest last_post_at first
    await db.createThread({ id: 't1', boardId: 'b1', title: 'first', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' }, post('u1', '2001-01-01T01:00:00Z'));
    await db.createThread({ id: 't2', boardId: 'b1', title: 'second', authorId: 'u1', createdAt: '2001-01-01T02:00:00Z', lastPostAt: '2001-01-01T02:00:00Z' }, post('u1', '2001-01-01T02:00:00Z'));
    await db.createThread({ id: 't3', boardId: 'b1', title: 'pinned', authorId: 'u1', isPinned: true, createdAt: '2001-01-01T00:30:00Z', lastPostAt: '2001-01-01T00:30:00Z' }, post('u1', '2001-01-01T00:30:00Z'));
  });

  it('lists pinned first, then most-recently-bumped', async () => {
    const { items } = await db.listThreads('b1');
    expect(items.map((t) => t.id)).toEqual(['t3', 't2', 't1']); // pinned, then t2 (newer) then t1
  });

  it('a reply bumps its thread above newer ones and bumps counters', async () => {
    await db.addPost('t1', post('u1', '2001-01-01T03:00:00Z', 'reply'));
    const { items } = await db.listThreads('b1');
    expect(items.map((t) => t.id)).toEqual(['t3', 't1', 't2']); // t1 now newest of the unpinned
    const t1 = await db.getThread('t1');
    expect(t1.replyCount).toBe(1);
    expect(t1.lastPostAt).toBe('2001-01-01T03:00:00Z');
    expect((await db.getUser('u1')).postCount).toBe(4); // three opening posts + this reply all count
  });
});

describe('posts: sequence + page-N pagination', () => {
  beforeEach(async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    await db.createThread({ id: 't1', boardId: 'b1', title: 'long', authorId: 'u1', createdAt: '2001-01-01T00:00:00Z', lastPostAt: '2001-01-01T00:00:00Z' }, post('u1', '2001-01-01T00:00:00Z', 'op'));
    for (let i = 1; i <= 24; i++) await db.addPost('t1', post('u1', `2001-01-02T00:${String(i).padStart(2, '0')}:00Z`, `reply ${i}`));
  });

  it('the opening post is seq 1 and replies count up from 2', async () => {
    expect((await db.getPost('t1', 1)).bodyHtml).toBe('op');
    expect((await db.getPost('t1', 2)).bodyHtml).toBe('reply 1');
  });

  it('page 1 = 20 posts, page 2 = the remaining 5 (25 total, addressable)', async () => {
    const p1 = await db.listPosts('t1', { page: 1, perPage: 20 });
    const p2 = await db.listPosts('t1', { page: 2, perPage: 20 });
    expect(p1.items).toHaveLength(20);
    expect(p2.items).toHaveLength(5);
    expect(p1.items[0].seq).toBe(1);
    expect(p2.items[0].seq).toBe(21);
  });

  it('an edit keeps the old body as a revision', async () => {
    await db.editPost('t1', 2, { body: { bodyHtml: 'edited', editedAt: '2001-01-03T00:00:00Z' }, revision: { bodyHtml: 'reply 1', editedBy: 'u1', editedAt: '2001-01-03T00:00:00Z' } });
    expect((await db.getPost('t1', 2)).bodyHtml).toBe('edited');
    expect((await db.revisions('t1', 2)).items[0].bodyHtml).toBe('reply 1');
  });

  it('soft-delete leaves a tombstone, never a hard delete', async () => {
    const tomb = softDeletePost(await db.getPost('t1', 2), { reason: 'spam', by: 'mod', role: 'sysop', at: '2001-01-04T00:00:00Z' });
    await db.tombstonePost('t1', 2, { deletedAt: tomb.deletedAt, deletedBy: tomb.deletedBy, deleteReason: tomb.deleteReason });
    const p = await db.getPost('t1', 2);
    expect(p.deletedAt).toBe('2001-01-04T00:00:00Z');
    expect(p.deleteReason).toBe('spam');
    expect(p.bodyHtml).toBe('reply 1'); // body retained; the renderer hides it
  });
});

describe('moderation persistence', () => {
  it('a ban is stored, the newest one wins, and banIsActive reads it', async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    const ban = issueBan('u1', { level: '7d', reason: 'flooding', by: 'mod', role: 'sysop', at: '2001-06-01T00:00:00Z' });
    await db.putBan(ban, logEntry({ action: 'ban', by: 'mod', target: 'u1', reason: 'flooding', at: '2001-06-01T00:00:00Z' }));
    const newest = await db.newestBan('u1');
    expect(newest.level).toBe('7d');
    expect(banIsActive(newest, '2001-06-03T00:00:00Z')).toBe(true);  // within 7 days
    expect(banIsActive(newest, '2001-06-10T00:00:00Z')).toBe(false); // expired
  });

  it('reports dedup to one open item per post and accrue reporters', async () => {
    await db.report('t1.5', { reporterId: 'u1', reason: 'rude', at: '2001-06-01T00:00:00Z' });
    await db.report('t1.5', { reporterId: 'u2', reason: 'rude', at: '2001-06-01T01:00:00Z' });
    const { items } = await db.openReports();
    expect(items).toHaveLength(1);
    expect(items[0].reporters.sort()).toEqual(['u1', 'u2']);
  });
});

describe('rate limiting + single-use tokens', () => {
  it('rateHit is an atomic counter', async () => {
    expect(await db.rateHit('ip:1.2.3.4', 'login:2001010112', 3600)).toBe(1);
    expect(await db.rateHit('ip:1.2.3.4', 'login:2001010112', 3600)).toBe(2);
  });

  it('a verify/reset token can be consumed exactly once', async () => {
    await db.putToken('deadbeef', { userId: 'u1', purpose: 'verify' }, 9999999999);
    expect((await db.consumeToken('deadbeef')).purpose).toBe('verify');
    expect(await db.consumeToken('deadbeef')).toBeNull(); // gone after first use
  });
});

describe('board stats: the index columns', () => {
  const board = (id, slug, position) => ({ id, slug, name: slug, description: '', position });
  beforeEach(async () => {
    await db.createUser(user('u1', 'Alice', 'a@x.example'));
    await db.putBoard(board('b1', 'talk', 0));
    await db.putBoard(board('b2', 'lounge', 1));
  });

  it('a fresh board reads zero threads, zero posts, no last post', async () => {
    const [talk] = await db.listBoards({ withStats: true });
    expect(talk.threadCount).toBe(0);
    expect(talk.postCount).toBe(0);
    expect(talk.lastPostAt).toBeUndefined();
  });

  it('a new thread bumps its board: one thread, one post, last post stamped', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'hello', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      post('u1', '2001-01-01T01:00:00Z'),
      { postedBy: 'Alice' },
    );
    const [talk, lounge] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([1, 1]);
    expect(talk.lastPostAt).toBe('2001-01-01T01:00:00Z');
    expect(talk.lastPostBy).toBe('Alice');
    expect([lounge.threadCount, lounge.postCount]).toEqual([0, 0]); // the neighbour is untouched
  });

  it('a reply bumps the post count and the last-post line, not the thread count', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'hello', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      post('u1', '2001-01-01T01:00:00Z'),
      { postedBy: 'Alice' },
    );
    await db.addPost('t1', post('u1', '2001-01-01T02:00:00Z', 'reply'), false, false, { boardId: 'b1', postedBy: 'Alice' });
    const [talk] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([1, 2]);
    expect(talk.lastPostAt).toBe('2001-01-01T02:00:00Z');
  });

  it('a moved thread takes its counts along; the neighbour gives them up', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'hello', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      post('u1', '2001-01-01T01:00:00Z'),
      { postedBy: 'Alice' },
    );
    await db.addPost('t1', post('u1', '2001-01-01T02:00:00Z', 'reply'), false, false, { boardId: 'b1', postedBy: 'Alice' });
    await db.moveThread('t1', 'b2', { fromBoardId: 'b1', replyCount: 1, counted: true });
    const [talk, lounge] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([0, 0]);
    expect([lounge.threadCount, lounge.postCount]).toEqual([1, 2]);
  });

  it('moving a held (never counted) thread moves no counts', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'held', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      { ...post('u1', '2001-01-01T01:00:00Z'), isApproved: false },
      { postedBy: 'Alice' },
    );
    await db.moveThread('t1', 'b2', { fromBoardId: 'b1', replyCount: 0, counted: false });
    const [talk, lounge] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([0, 0]);
    expect([lounge.threadCount, lounge.postCount]).toEqual([0, 0]);
  });

  it('the stats item never shadows the board row keys', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'hello', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      post('u1', '2001-01-01T01:00:00Z'),
    );
    const [talk] = await db.listBoards({ withStats: true });
    expect(talk.pk).toBe('board');
    expect(talk.slug).toBe('talk');
  });

  it('a held post counts for nothing until a mod releases it', async () => {
    await db.createThread(
      { id: 't1', boardId: 'b1', title: 'held', authorId: 'u1', createdAt: '2001-01-01T01:00:00Z', lastPostAt: '2001-01-01T01:00:00Z' },
      { ...post('u1', '2001-01-01T01:00:00Z'), isApproved: false },
      { postedBy: 'Alice' },
    );
    let [talk] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([0, 0]);
    await db.releaseHeldPost('t1', 1, { at: '2001-01-01T01:00:00Z', authorId: 'u1', boardId: 'b1', postedBy: 'Alice' });
    [talk] = await db.listBoards({ withStats: true });
    expect([talk.threadCount, talk.postCount]).toEqual([1, 1]);
    expect(talk.lastPostBy).toBe('Alice');
  });
});
