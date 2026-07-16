// The moderation moves over the store: permission gates, the soft-delete tombstone, the report
// queue, the ban ladder, and two seams that once bit us: pin/unpin keeps the gsi order, and
// same-instant mod-log entries get distinct keys instead of clobbering.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { flagThread, moveThread, deletePost, approvePost, reportPost, resolveReport, banUser, liftBan } from '../src/mod-handlers.js';
import { banIsActive } from '../src/moderation.js';

const T = 1_700_000_000;                     // -> 2023-11..., so the mod-log lands in modlog#202311
const iso = (s) => new Date(s * 1000).toISOString();
const sysop = { id: 'mod1', role: 'sysop', displayName: 'Mod' };
const member = { id: 'm1', role: 'member', displayName: 'Mia' };
const web = { id: 'web1', role: 'webmaster', displayName: 'Web' };

let ops, db, ids;
const newId = () => `log${++ids}`;
const as = (user, extra = {}) => ({ user, now: iso(T), nowS: T, newId, ...extra });

beforeEach(async () => {
  ops = memOps(); db = boardsStore(ops); ids = 0;
  await db.putBoard({ id: 'b1', slug: 'talk', name: 'Talk', description: '', position: 0 });
  await db.putBoard({ id: 'b2', slug: 'off', name: 'Off Topic', description: '', position: 1 });
  await db.createUser({ id: 'm1', displayName: 'Mia', email: 'm@x.example', passwordHash: 'x', role: 'member', postCount: 3, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: iso(T) });
  await db.createThread({ id: 't1', boardId: 'b1', title: 'Hi', authorId: 'm1', createdAt: iso(T), lastPostAt: iso(T) }, { authorId: 'm1', bodyHtml: 'hello', createdAt: iso(T) });
});

describe('thread flags', () => {
  it('a sysop locks a thread; a member cannot', async () => {
    expect((await flagThread(db, { threadId: 't1', action: 'lock', ...as(sysop) })).status).toBe(303);
    expect((await db.getThread('t1')).isLocked).toBe(true);
    expect((await flagThread(db, { threadId: 't1', action: 'unlock', ...as(member) })).status).toBe(403);
  });

  it('pinning keeps the board ordered (the gsi sort key stays whole)', async () => {
    await db.createThread({ id: 't2', boardId: 'b1', title: 'Newer', authorId: 'm1', createdAt: iso(T + 100), lastPostAt: iso(T + 100) }, { authorId: 'm1', bodyHtml: 'x', createdAt: iso(T + 100) });
    expect((await db.listThreads('b1')).items[0].id).toBe('t2'); // newer floats up while both unpinned
    await flagThread(db, { threadId: 't1', action: 'pin', ...as(sysop) });
    expect((await db.listThreads('b1')).items[0].id).toBe('t1'); // pinned jumps above the newer one
    await flagThread(db, { threadId: 't2', action: 'pin', ...as(sysop) });
    expect((await db.listThreads('b1')).items.map((t) => t.id)).toEqual(['t2', 't1']); // both pinned, newest-bumped first
  });
});

describe('move', () => {
  it('moves a thread to another board and out of the old one', async () => {
    expect((await moveThread(db, { threadId: 't1', toSlug: 'off', ...as(sysop) })).status).toBe(303);
    expect((await db.getThread('t1')).boardId).toBe('b2');
    expect((await db.listThreads('b2')).items.map((t) => t.id)).toContain('t1');
    expect((await db.listThreads('b1')).items).toHaveLength(0);
  });
  it('a missing target board is a 404', async () => {
    expect((await moveThread(db, { threadId: 't1', toSlug: 'nope', ...as(sysop) })).status).toBe(404);
  });
});

describe('soft delete', () => {
  it('leaves a tombstone with a reason, keeping the body', async () => {
    expect((await deletePost(db, { threadId: 't1', seq: 1, reason: 'spam', ...as(sysop) })).status).toBe(303);
    const p = await db.getPost('t1', 1);
    expect(p.deletedAt).toBe(iso(T));
    expect(p.deleteReason).toBe('spam');
    expect(p.bodyHtml).toBe('hello'); // retained; the renderer hides it
  });
  it('needs a reason and needs the power', async () => {
    expect((await deletePost(db, { threadId: 't1', seq: 1, reason: '  ', ...as(sysop) })).status).toBe(400);
    expect((await deletePost(db, { threadId: 't1', seq: 1, reason: 'x', ...as(member) })).status).toBe(403);
  });
});

describe('reports', () => {
  it('a member reports a post and a sysop resolves it off the queue', async () => {
    await reportPost(db, { threadId: 't1', seq: 1, user: member, reason: 'rude', now: iso(T) });
    expect((await db.openReports()).items).toHaveLength(1);
    await resolveReport(db, { postRef: 't1.1', action: 'resolve', ...as(sysop) });
    // resolving deletes the item (the mod-log keeps the who/why/when; the
    // privacy page says reports live only until handled)
    expect((await db.openReports()).items).toHaveLength(0);
    // and a fresh report on the same post opens a new case, not a dedup no-op
    await reportPost(db, { threadId: 't1', seq: 1, user: member, reason: 'still rude', now: iso(T + 60) });
    expect((await db.openReports()).items).toHaveLength(1);
  });

  it('refuses a report for a post that does not exist (no junk in the queue)', async () => {
    expect((await reportPost(db, { threadId: 't1', seq: 999, user: member, reason: 'x', now: iso(T) })).status).toBe(404);
    expect((await db.openReports()).items).toHaveLength(0);
  });
});

describe('bans', () => {
  it('a 7-day ban is active and logs the member out', async () => {
    expect((await banUser(db, { targetId: 'm1', level: '7d', reason: 'flooding', ...as(sysop) })).status).toBe(303);
    expect((await db.getUser('m1')).sessionsValidAfter).toBe(T); // kicked immediately
    expect(banIsActive(await db.newestBan('m1'), iso(T + 3600))).toBe(true);
  });
  it('a note warns without logging out', async () => {
    await banUser(db, { targetId: 'm1', level: 'note', reason: 'settle down', ...as(sysop) });
    expect((await db.getUser('m1')).sessionsValidAfter).toBe(0);
  });
  it('permanent is webmaster-only', async () => {
    expect((await banUser(db, { targetId: 'm1', level: 'permanent', reason: 'malware', ...as(sysop) })).status).toBe(403);
    expect((await banUser(db, { targetId: 'm1', level: 'permanent', reason: 'malware', ...as(web) })).status).toBe(303);
    expect(banIsActive(await db.newestBan('m1'), iso(T + 1e9))).toBe(true); // never expires
  });
  it('a mod cannot ban a peer or superior, and a ban needs a reason', async () => {
    await db.setUser('m1', { role: 'sysop' });
    expect((await banUser(db, { targetId: 'm1', level: '24h', reason: 'x', ...as(sysop) })).status).toBe(403);
    await db.setUser('m1', { role: 'member' });
    expect((await banUser(db, { targetId: 'm1', level: '24h', reason: '  ', ...as(sysop) })).status).toBe(400);
  });
  it('a ban can be lifted', async () => {
    await banUser(db, { targetId: 'm1', level: '7d', reason: 'x', ...as(sysop) });
    expect(banIsActive(await db.newestBan('m1'), iso(T + 3600))).toBe(true);
    await liftBan(db, { targetId: 'm1', user: sysop, now: iso(T + 100), newId });
    expect(banIsActive(await db.newestBan('m1'), iso(T + 3600))).toBe(false);
  });

  it('a sysop cannot lift a permanent ban, but a webmaster can', async () => {
    await banUser(db, { targetId: 'm1', level: 'permanent', reason: 'malware', ...as(web) });
    expect((await liftBan(db, { targetId: 'm1', user: sysop, now: iso(T + 100), newId })).status).toBe(403);
    const r = await liftBan(db, { targetId: 'm1', user: web, now: iso(T + 100), newId });
    expect(r.status).toBe(303);
    expect(banIsActive(await db.newestBan('m1'), iso(T + 200))).toBe(false);
  });
});

describe('approvePost', () => {
  beforeEach(async () => {
    // a newcomer's held reply sits at seq 2, mirrored into the approval queue
    await db.addPost('t1', { authorId: 'm1', bodyHtml: 'pending', createdAt: iso(T + 5), isApproved: false });
    await db.queueFirstPost('t1.2', { threadId: 't1', seq: 2, authorId: 'm1', at: iso(T + 5) });
  });

  it('a sysop approves: post public, queue cleared, author vouched, action logged', async () => {
    const r = await approvePost(db, { threadId: 't1', seq: '2', ...as(sysop) });
    expect(r.status).toBe(303);
    expect((await db.getPost('t1', 2)).isApproved).toBe(true);
    expect((await db.approvalQueue()).items).toHaveLength(0);
    expect((await db.getUser('m1')).vouchedAt).toBeTruthy(); // vouched: their later posts flow
    expect((await ops.query('modlog#202311')).items.some((i) => i.action === 'approve')).toBe(true);
  });

  it('approving a held opening post releases the whole thread', async () => {
    await db.createThread({ id: 't5', boardId: 'b1', title: 'Held', authorId: 'm1', createdAt: iso(T), lastPostAt: iso(T) }, { authorId: 'm1', bodyHtml: 'op', createdAt: iso(T), isApproved: false });
    await db.queueFirstPost('t5.1', { threadId: 't5', seq: 1, authorId: 'm1', at: iso(T) });
    expect((await db.getThread('t5')).isApproved).toBe(false);
    await approvePost(db, { threadId: 't5', seq: '1', ...as(sysop) });
    expect((await db.getThread('t5')).isApproved).toBe(true); // surfaced to the board on release
    expect((await db.getPost('t5', 1)).isApproved).toBe(true);
  });

  it('a plain member cannot approve', async () => {
    expect((await approvePost(db, { threadId: 't1', seq: '2', ...as(member) })).status).toBe(403);
    expect((await db.getPost('t1', 2)).isApproved).toBe(false); // untouched
  });

  it('404s on a post that does not exist', async () => {
    expect((await approvePost(db, { threadId: 't1', seq: '99', ...as(sysop) })).status).toBe(404);
  });

  it('releasing a held reply then applies its deferred bump and counts', async () => {
    const { seq } = await db.addPost('t1', { authorId: 'm1', bodyHtml: 'held reply', createdAt: iso(T + 20), isApproved: false }, false, true); // held: no bump yet
    await db.queueFirstPost(`t1.${seq}`, { threadId: 't1', seq, authorId: 'm1', at: iso(T + 20) });
    const before = await db.getThread('t1');
    const beforeCount = (await db.getUser('m1')).postCount || 0;
    await approvePost(db, { threadId: 't1', seq: String(seq), ...as(sysop) });
    const after = await db.getThread('t1');
    expect(after.replyCount).toBe((before.replyCount || 0) + 1);   // bump lands on release
    expect(after.lastPostAt).toBe(iso(T + 20));
    expect((await db.getUser('m1')).postCount).toBe(beforeCount + 1);
  });

  it('deleting a held post kills its approve action (no republish, no vouch)', async () => {
    const { seq } = await db.addPost('t1', { authorId: 'm1', bodyHtml: 'spam', createdAt: iso(T + 30), isApproved: false }, false, true);
    await db.queueFirstPost(`t1.${seq}`, { threadId: 't1', seq, authorId: 'm1', at: iso(T + 30) });
    await deletePost(db, { threadId: 't1', seq, ...as(sysop, { reason: 'spam' }) });
    const r = await approvePost(db, { threadId: 't1', seq: String(seq), ...as(sysop) }); // now a no-op
    expect(r.status).toBe(303);
    expect((await db.getUser('m1')).vouchedAt).toBeFalsy(); // approving a removed post must not vouch its author
  });

  it('approve is idempotent: a double-submit logs once', async () => {
    const { seq } = await db.addPost('t1', { authorId: 'm1', bodyHtml: 'ok', createdAt: iso(T + 40), isApproved: false }, false, true);
    await db.queueFirstPost(`t1.${seq}`, { threadId: 't1', seq, authorId: 'm1', at: iso(T + 40) });
    await approvePost(db, { threadId: 't1', seq: String(seq), ...as(sysop) });
    const once = (await ops.query('modlog#202311')).items.filter((i) => i.action === 'approve').length;
    await approvePost(db, { threadId: 't1', seq: String(seq), ...as(sysop) }); // second time
    const twice = (await ops.query('modlog#202311')).items.filter((i) => i.action === 'approve').length;
    expect(twice).toBe(once); // no duplicate approve entry
  });

  it('approving a held reply before its held OP keeps the thread hidden', async () => {
    // a fully held thread: OP (seq 1) held, plus a held reply (seq 2), same author
    await db.createThread({ id: 't6', boardId: 'b1', title: 'Held whole', authorId: 'm1', createdAt: iso(T), lastPostAt: iso(T) }, { authorId: 'm1', bodyHtml: 'op', createdAt: iso(T), isApproved: false });
    await db.queueFirstPost('t6.1', { threadId: 't6', seq: 1, authorId: 'm1', at: iso(T) });
    const { seq } = await db.addPost('t6', { authorId: 'm1', bodyHtml: 'reply', createdAt: iso(T + 5), isApproved: false }, false, true);
    await db.queueFirstPost(`t6.${seq}`, { threadId: 't6', seq, authorId: 'm1', at: iso(T + 5) });
    await approvePost(db, { threadId: 't6', seq: String(seq), ...as(sysop) }); // approve the REPLY first
    expect((await db.getThread('t6')).isApproved).toBe(false); // thread stays hidden: OP still held
    await approvePost(db, { threadId: 't6', seq: '1', ...as(sysop) }); // now the OP
    expect((await db.getThread('t6')).isApproved).toBe(true); // released only by its OP
  });
});

describe('mod-log keys', () => {
  it('gives same-instant actions distinct keys (no clobber)', async () => {
    await flagThread(db, { threadId: 't1', action: 'lock', ...as(sysop) });
    await flagThread(db, { threadId: 't1', action: 'unlock', ...as(sysop) });
    const log = await ops.query('modlog#202311');
    expect(log.items).toHaveLength(2);                          // both survive the same `at`
    expect(new Set(log.items.map((i) => i.id)).size).toBe(2);   // because the ids differ
  });
});

describe('flash notices', () => {
  it('every notice key a handler redirects with has copy in NOTICES', async () => {
    const { readFile } = await import('node:fs/promises');
    const { NOTICES } = await import('../src/views.js');
    const src = (await readFile(new URL('../src/mod-handlers.js', import.meta.url), 'utf8'))
      + (await readFile(new URL('../src/auth-handlers.js', import.meta.url), 'utf8'));
    const emitted = [...src.matchAll(/redirect\([^)]*notice: '([\w-]+)'/g)].map((m) => m[1]);
    expect(emitted.length).toBeGreaterThan(5);
    expect(emitted.filter((k) => !NOTICES[k])).toEqual([]);
  });
});
