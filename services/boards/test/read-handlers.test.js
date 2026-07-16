// The public read path over the in-memory store: what a browser gets, and that untrusted
// fields are escaped while an already-sanitised post body is not.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { indexPage, boardPage, threadPage, encCursor, decCursor } from '../src/read-handlers.js';
import { softDeletePost } from '../src/moderation.js';

let db;
beforeEach(async () => {
  db = boardsStore(memOps());
  await db.putBoard({ id: 'b1', slug: 'talk', name: 'The Talk', description: 'General chatter', position: 0 });
  await db.createUser({ id: 'u1', displayName: 'Alice', email: 'a@x.example', role: 'member', postCount: 15, createdAt: '2001-01-01T00:00:00Z', sessionsValidAfter: 0 });
  // a title and body carrying HTML metacharacters, to prove escaping vs raw
  await db.createThread(
    { id: 't1', boardId: 'b1', title: 'Hello <world> & "friends"', authorId: 'u1', createdAt: '2001-02-01T10:00:00Z', lastPostAt: '2001-02-01T10:00:00Z' },
    { authorId: 'u1', bodyHtml: '<b>already safe</b>', createdAt: '2001-02-01T10:00:00Z' },
  );
});

describe('index + board pages', () => {
  it('the index lists the boards', async () => {
    const r = await indexPage(db);
    expect(r.status).toBe(200);
    expect(r.html).toContain('The Talk');
    expect(r.html).toContain('General chatter');
  });

  it('the index shows a flash notice when one rides in', async () => {
    const r = await indexPage(db, { notice: 'Report closed. Thanks for keeping watch.' });
    expect(r.html).toContain('Report closed.');
    expect((await indexPage(db)).html).not.toContain('rs-alert');
  });

  it('a board lists its threads with the title escaped', async () => {
    const r = await boardPage(db, { slug: 'talk' });
    expect(r.status).toBe(200);
    expect(r.html).toContain('/threads/t1');
    expect(r.html).toContain('Hello &lt;world&gt; &amp; &quot;friends&quot;'); // escaped, not raw
    expect(r.html).not.toContain('<world>');
  });

  it('an unknown board is a 404', async () => {
    expect((await boardPage(db, { slug: 'nope' })).status).toBe(404);
  });

  it('emits SEO metadata: description, canonical, and OG tags', async () => {
    const b = await boardPage(db, { slug: 'talk' });
    expect(b.html).toContain('<meta name="description" content="General chatter">');
    expect(b.html).toContain('<link rel="canonical" href="https://boards.retrostrap.dev/boards/talk">');
    expect(b.html).toContain('<meta property="og:image"');
    const t = await threadPage(db, { threadId: 't1' });
    expect(t.html).toContain('<link rel="canonical" href="https://boards.retrostrap.dev/threads/t1">');
  });
});

describe('thread page', () => {
  it('renders the opening post: raw body, escaped title, live author rank', async () => {
    const r = await threadPage(db, { threadId: 't1' });
    expect(r.status).toBe(200);
    expect(r.html).toContain('<b>already safe</b>');          // bbcode output is raw
    expect(r.html).toContain('Hello &lt;world&gt;');           // title escaped
    expect(r.html).toContain('Alice');
    expect(r.html).toContain('Member');                        // rankFor(15) = Member
  });

  it('a reply appears after the opening post', async () => {
    await db.addPost('t1', { authorId: 'u1', bodyHtml: 'second post', createdAt: '2001-02-01T11:00:00Z' });
    const r = await threadPage(db, { threadId: 't1' });
    expect(r.html).toContain('second post');
    expect(r.html.indexOf('already safe')).toBeLessThan(r.html.indexOf('second post')); // in order
  });

  it('a soft-deleted post shows a tombstone, not its body', async () => {
    const tomb = softDeletePost(await db.getPost('t1', 1), { reason: 'off-topic', by: 'mod', role: 'sysop', at: '2001-02-02T00:00:00Z' });
    await db.tombstonePost('t1', 1, { deletedAt: tomb.deletedAt, deletedBy: tomb.deletedBy, deleteReason: tomb.deleteReason });
    const r = await threadPage(db, { threadId: 't1' });
    expect(r.html).toContain('removed by a moderator: off-topic');
    expect(r.html).not.toContain('already safe'); // body hidden
  });

  it('an unknown thread is a 404', async () => {
    expect((await threadPage(db, { threadId: 'nope' })).status).toBe(404);
  });

  describe('a post awaiting approval', () => {
    beforeEach(async () => {
      await db.addPost('t1', { authorId: 'u2', bodyHtml: 'HELD-BODY', createdAt: '2001-02-01T12:00:00Z', isApproved: false });
    });
    it('is hidden from a stranger', async () => {
      expect((await threadPage(db, { threadId: 't1' })).html).not.toContain('HELD-BODY');
    });
    it('shows to its author, flagged as pending', async () => {
      const r = await threadPage(db, { threadId: 't1', user: { id: 'u2', role: 'member' } });
      expect(r.html).toContain('HELD-BODY');
      expect(r.html).toMatch(/Awaiting/i);
    });
    it('shows to a moderator with an approve control', async () => {
      const r = await threadPage(db, { threadId: 't1', user: { id: 'mod', role: 'sysop' }, csrf: 'tok' });
      expect(r.html).toContain('HELD-BODY');
      expect(r.html).toContain('/approve');
    });
  });
});

describe('a whole thread held for approval (opening post pending)', () => {
  beforeEach(async () => {
    await db.createThread(
      { id: 't9', boardId: 'b1', title: 'HELD-TITLE', authorId: 'u2', createdAt: '2001-03-01T00:00:00Z', lastPostAt: '2001-03-01T00:00:00Z' },
      { authorId: 'u2', bodyHtml: 'held op', createdAt: '2001-03-01T00:00:00Z', isApproved: false },
    );
  });

  it('404s the direct URL for a stranger, title and all', async () => {
    const r = await threadPage(db, { threadId: 't9' });
    expect(r.status).toBe(404);
    expect(r.html).not.toContain('HELD-TITLE');
  });

  it('shows to its author and to a moderator', async () => {
    expect((await threadPage(db, { threadId: 't9', user: { id: 'u2', role: 'member' } })).html).toContain('HELD-TITLE');
    expect((await threadPage(db, { threadId: 't9', user: { id: 'm', role: 'sysop' } })).html).toContain('HELD-TITLE');
  });

  it('stays off the board list for a stranger but lists for a mod', async () => {
    expect((await boardPage(db, { slug: 'talk', key: 'k' })).html).not.toContain('HELD-TITLE');
    expect((await boardPage(db, { slug: 'talk', user: { id: 'm', role: 'sysop' }, key: 'k' })).html).toContain('HELD-TITLE');
  });
});

describe('cursor round-trips', () => {
  it('signs and verifies an opaque pagination cursor; tampering fails closed', () => {
    const K = 'cursor-key';
    const c = { pk: 'board#b1', sk: 'thread#t9' };
    expect(decCursor(encCursor(c, K), K)).toEqual(c);
    expect(decCursor(encCursor('some-sk', K), K)).toBe('some-sk');
    expect(decCursor(undefined, K)).toBeUndefined();
    expect(decCursor('tampered.token', K)).toBeUndefined();           // bad signature -> nothing
    expect(decCursor(encCursor(c, K), 'wrong-key')).toBeUndefined();  // wrong key -> nothing
  });
});


describe('erased authors at the German table', () => {
  it('fall back to Gast on a lang de board, Guest elsewhere', async () => {
    const { boardsStore } = await import('../src/boards-store.js');
    const { memOps } = await import('../src/mem-ops.js');
    const { threadPage } = await import('../src/read-handlers.js');
    const db = boardsStore(memOps());
    await db.putBoard({ id: 'b1', slug: 'talk', name: 'Talk', description: '', position: 0 });
    await db.putBoard({ id: 'b2', slug: 'stammtisch', name: 'Der Stammtisch', description: '', position: 1, lang: 'de' });
    const post = { authorId: 'gone', bodyHtml: '<p>servus</p>', createdAt: '2001-01-01T00:00:00Z' };
    await db.createThread({ id: 't1', boardId: 'b1', title: 'en', authorId: 'gone', createdAt: post.createdAt, lastPostAt: post.createdAt }, post);
    await db.createThread({ id: 't2', boardId: 'b2', title: 'de', authorId: 'gone', createdAt: post.createdAt, lastPostAt: post.createdAt }, post);
    expect((await threadPage(db, { threadId: 't1' })).html).toContain('Guest');
    expect((await threadPage(db, { threadId: 't2' })).html).toContain('Gast');
  });
});
