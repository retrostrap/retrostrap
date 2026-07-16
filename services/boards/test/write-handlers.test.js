// The posting flow over the in-memory store: threads and replies land, BBCode is rendered
// on write, and every guard (login, real target, title bounds, empty body, locked) refuses.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { newThread, postReply } from '../src/write-handlers.js';

// a vouched member: posts flow straight through (the held-newcomer path is tested separately)
const alice = { id: 'u1', displayName: 'Alice', role: 'member', vouchedAt: '2001-01-01T00:00:00Z' };

let db;
beforeEach(async () => {
  db = boardsStore(memOps());
  await db.putBoard({ id: 'b1', slug: 'talk', name: 'The Talk', description: 'chatter', position: 0 });
  await db.createUser({ id: 'u1', displayName: 'Alice', email: 'a@x.example', role: 'member', postCount: 0, createdAt: '2001-01-01T00:00:00Z', sessionsValidAfter: 0 });
});

describe('newThread', () => {
  it('opens a thread with a rendered first post and redirects to it', async () => {
    const r = await newThread(db, { boardSlug: 'talk', user: alice, title: 'Hi there', body: '[b]hello[/b]', now: '2001-02-01T00:00:00Z', id: 't1' });
    expect(r).toEqual({ status: 303, redirect: '/threads/t1' });
    const thread = await db.getThread('t1');
    expect(thread.title).toBe('Hi there');
    expect(thread.boardId).toBe('b1');
    expect((await db.getPost('t1', 1)).bodyHtml).toBe('<strong>hello</strong>'); // rendered on write
  });

  it('needs a login, a real board, a bounded title, and a body', async () => {
    const base = { boardSlug: 'talk', user: alice, title: 'Long enough', body: 'ok', now: '2001-02-01T00:00:00Z', id: 'x' };
    expect((await newThread(db, { ...base, user: null })).status).toBe(403);
    expect((await newThread(db, { ...base, boardSlug: 'nope' })).status).toBe(404);
    expect((await newThread(db, { ...base, title: 'no' })).status).toBe(400);          // too short
    expect((await newThread(db, { ...base, title: 'x'.repeat(91) })).status).toBe(400); // too long
    expect((await newThread(db, { ...base, body: '   ' })).status).toBe(400);           // empty body
  });
});

describe('postReply', () => {
  beforeEach(async () => {
    await newThread(db, { boardSlug: 'talk', user: alice, title: 'A thread', body: 'op', now: '2001-02-01T00:00:00Z', id: 't1' });
  });

  it('appends a rendered reply, bumps the thread, and redirects to the new post', async () => {
    const r = await postReply(db, { threadId: 't1', user: alice, body: '[i]hi[/i]', now: '2001-02-01T01:00:00Z' });
    expect(r).toEqual({ status: 303, redirect: '/threads/t1?page=1#post-2' }); // seq 2, page 1
    expect((await db.getPost('t1', 2)).bodyHtml).toBe('<em>hi</em>');
    const thread = await db.getThread('t1');
    expect(thread.replyCount).toBe(1);
    expect(thread.lastPostAt).toBe('2001-02-01T01:00:00Z'); // bumped
  });

  it('refuses a stranger, a missing thread, an empty body, and a locked thread', async () => {
    expect((await postReply(db, { threadId: 't1', user: null, body: 'hi', now: 't' })).status).toBe(403);
    expect((await postReply(db, { threadId: 'nope', user: alice, body: 'hi', now: 't' })).status).toBe(404);
    expect((await postReply(db, { threadId: 't1', user: alice, body: '  ', now: 't' })).status).toBe(400);
    await db.setThread('t1', { isLocked: true });
    expect((await postReply(db, { threadId: 't1', user: alice, body: 'hi', now: 't' })).status).toBe(403);
  });
});

describe('an unvouched member\'s posts are held for approval', () => {
  const newcomer = { id: 'u1', displayName: 'Alice', role: 'member' }; // no vouchedAt yet
  let vouched;
  beforeEach(async () => {
    await db.createUser({ id: 'u2', displayName: 'Vera', email: 'v@x.example', role: 'member', postCount: 20, vouchedAt: '2001-01-01T00:00:00Z', createdAt: '2001-01-01T00:00:00Z', sessionsValidAfter: 0 });
    vouched = { id: 'u2', displayName: 'Vera', role: 'member', vouchedAt: '2001-01-01T00:00:00Z' };
  });

  it('holds an unvouched member\'s opening post and the whole thread', async () => {
    await newThread(db, { boardSlug: 'talk', user: newcomer, title: 'My first thread', body: 'hello all', now: '2001-02-01T00:00:00Z', id: 't1' });
    expect((await db.getPost('t1', 1)).isApproved).toBe(false);
    expect((await db.getThread('t1')).isApproved).toBe(false); // held whole, not just the body
    const { items } = await db.approvalQueue();
    expect(items.map((i) => `${i.threadId}.${i.seq}`)).toContain('t1.1');
  });

  it('lets a vouched member post straight through', async () => {
    await newThread(db, { boardSlug: 'talk', user: vouched, title: 'Old hand here', body: 'hi again', now: '2001-02-01T00:00:00Z', id: 't2' });
    expect((await db.getPost('t2', 1)).isApproved).toBe(true);
    expect((await db.getThread('t2')).isApproved).toBe(true);
    expect((await db.approvalQueue()).items).toHaveLength(0);
  });

  it('holds EVERY post until vouched, not just the literal first (no throwaway bypass)', async () => {
    await newThread(db, { boardSlug: 'talk', user: vouched, title: 'A thread', body: 'op', now: '2001-02-01T00:00:00Z', id: 't3' });
    await postReply(db, { threadId: 't3', user: newcomer, body: 'first words', now: '2001-02-01T01:00:00Z' });
    await postReply(db, { threadId: 't3', user: newcomer, body: 'second words', now: '2001-02-01T02:00:00Z' });
    expect((await db.getPost('t3', 2)).isApproved).toBe(false);
    expect((await db.getPost('t3', 3)).isApproved).toBe(false); // still held: one held post buys no free pass
  });

  it('a held reply is invisible, so it does not bump the board or inflate the reply count', async () => {
    await newThread(db, { boardSlug: 'talk', user: vouched, title: 'A thread', body: 'op', now: '2001-02-01T00:00:00Z', id: 't4' });
    const before = await db.getThread('t4');
    await postReply(db, { threadId: 't4', user: newcomer, body: 'held', now: '2001-02-05T00:00:00Z' });
    const after = await db.getThread('t4');
    expect(after.replyCount || 0).toBe(before.replyCount || 0); // no reply-count bump while held
    expect(after.lastPostAt).toBe(before.lastPostAt);           // no board reorder while held
  });
});

describe('posting is rate limited', () => {
  const vouched = { id: 'u1', displayName: 'Alice', role: 'member', vouchedAt: '2001-01-01T00:00:00Z' };
  it('caps a flood of new threads per member', async () => {
    const nowS = 1_700_000_000, win = String(Math.floor(nowS / 3600));
    for (let i = 0; i < 30; i++) await db.rateHit('post:u1', win, nowS + 3600); // fill the per-member bucket
    const r = await newThread(db, { boardSlug: 'talk', user: vouched, title: 'One more please', body: 'hi', now: 't', id: 'tX', nowS, ip: '1.2.3.4' });
    expect(r.status).toBe(429);
  });
});
