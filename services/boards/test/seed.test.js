// The seed over mem-ops: exactly the three canonical boards, a verified Webmaster, and the
// pinned charter threads authored by them, with the Netiquette rendered from BBCode.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { seed } from '../src/seed.js';
import { seedContent } from '../src/seed-content.js';
import { verifyPassword } from '../src/auth.js';

let db, result;
beforeEach(async () => {
  db = boardsStore(memOps());
  let n = 0;
  result = await seed(db, { ...seedContent, webmaster: { displayName: 'Stefan', email: 'wm@retrostrap.dev', password: 'a-strong-password' } }, { now: '2026-07-01T00:00:00Z', newId: () => `s${++n}` });
});

describe('seed', () => {
  it('creates exactly the three canonical boards, in order', async () => {
    const boards = await db.listBoards();
    expect(boards.map((b) => b.slug)).toEqual(['talk', 'lounge', 'stammtisch']);
    expect(boards.find((b) => b.slug === 'talk').name).toBe('Retrostrap Talk');
    expect(boards.find((b) => b.slug === 'stammtisch').name).toBe('Der Stammtisch');
  });

  it('creates a verified Webmaster with a usable password', async () => {
    const wm = await db.userByEmail('wm@retrostrap.dev');
    expect(wm.role).toBe('webmaster');
    expect(wm.verifiedAt).toBe('2026-07-01T00:00:00Z');
    expect(verifyPassword('a-strong-password', wm.passwordHash)).toBe(true);
  });

  it('pins the opening threads in Retrostrap Talk, authored by the Webmaster', async () => {
    const talk = (await db.listBoards()).find((b) => b.slug === 'talk');
    const { items } = await db.listThreads(talk.id);
    expect(items.map((t) => t.title)).toContain('START HERE: The Netiquette');
    expect(items.every((t) => t.isPinned)).toBe(true);
    expect(items.every((t) => t.authorId === result.webmaster)).toBe(true);
  });

  it('renders the English Netiquette as the START HERE opening post', async () => {
    const talk = (await db.listBoards()).find((b) => b.slug === 'talk');
    const { items } = await db.listThreads(talk.id);
    const start = items.find((t) => t.title.startsWith('START HERE'));
    const op = await db.getPost(start.id, 1);
    expect(op.bodyHtml).toContain('<strong>Remember the human.</strong>');
    expect(op.bodyHtml).toContain('<br>'); // line breaks preserved
  });

  it('puts the German charter in Der Stammtisch', async () => {
    const st = (await db.listBoards()).find((b) => b.slug === 'stammtisch');
    const { items } = await db.listThreads(st.id);
    const op = await db.getPost(items[0].id, 1);
    expect(op.bodyHtml).toContain('Willkommen am Stammtisch');
    expect(op.bodyHtml).toContain('<strong>Denk an den Menschen.</strong>');
  });

  it('reports what it created (3 boards, 4 threads)', () => {
    expect(result.boards).toBe(3);
    expect(result.threads).toHaveLength(4);
  });
});


describe('seeded board fields survive the write', () => {
  it('the Stammtisch keeps its lang, so erased authors read Gast there', async () => {
    const { boardsStore } = await import('../src/boards-store.js');
    const { memOps } = await import('../src/mem-ops.js');
    const { seed } = await import('../src/seed.js');
    const { seedContent } = await import('../src/seed-content.js');
    const db = boardsStore(memOps());
    let n = 0;
    await seed(db, { ...seedContent, webmaster: { displayName: 'W', email: 'w@x.example', password: 'p'.repeat(12) } }, { now: '2001-01-01T00:00:00Z', newId: () => `id${++n}` });
    const st = (await db.listBoards()).find((b) => b.slug === 'stammtisch');
    expect(st.lang).toBe('de');
  });
});
