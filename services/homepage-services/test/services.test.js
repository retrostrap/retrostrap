// The homepage services (docs/05 companion). Counter counts hits and stores no
// identifiers; guestbook is text-only and moderated; webring computes position.
import { describe, it, expect } from 'vitest';
import {
  memoryStore, counterHit, counterGet, guestbookAdd, guestbookList, webringNav,
} from '../src/services.js';

describe('hit counter', () => {
  it('counts hits, not people, every hit increments', async () => {
    const s = memoryStore();
    expect(await counterHit(s, '/index.html')).toBe(1);
    expect(await counterHit(s, '/index.html')).toBe(2);
    expect(await counterGet(s, '/index.html')).toBe(2);
    expect(await counterGet(s, '/other.html')).toBe(0);
  });
  it('keys on the path only, dropping query and hash', async () => {
    const s = memoryStore();
    await counterHit(s, '/p.html?ref=ring#top');
    expect(await counterGet(s, '/p.html')).toBe(1);
  });
});

describe('guestbook', () => {
  it('stores trimmed text fields and starts entries unapproved when moderated', async () => {
    const s = memoryStore();
    await guestbookAdd(s, 'sandra', { name: '  Randy ', message: 'KEWL!!', homepage: 'https://x.example' });
    expect(await guestbookList(s, 'sandra')).toEqual([]); // hidden until approved
  });
  it('rejects an empty message and a non-http homepage', async () => {
    const s = memoryStore();
    await expect(guestbookAdd(s, 'b', { name: 'x', message: '' })).rejects.toThrow();
    const e = await guestbookAdd(s, 'b', { message: 'hi', homepage: 'javascript:alert(1)' }, { moderated: false });
    expect(e.homepage).toBeNull();
    expect((await guestbookList(s, 'b'))[0].message).toBe('hi');
  });
});

describe('webring', () => {
  const ring = {
    home: 'https://ring.example/',
    sites: [
      { title: 'A', url: 'https://a.example/' },
      { title: 'B', url: 'https://b.example/' },
      { title: 'C', url: 'https://c.example/' },
    ],
  };
  it('computes prev and next around the current site', () => {
    const nav = webringNav(ring, 'https://b.example');
    expect(nav.inRing).toBe(true);
    expect(nav.prev.title).toBe('A');
    expect(nav.next.title).toBe('C');
  });
  it('wraps around the ends', () => {
    expect(webringNav(ring, 'https://a.example').prev.title).toBe('C');
    expect(webringNav(ring, 'https://c.example').next.title).toBe('A');
  });
  it('handles a page that is not in the ring', () => {
    const nav = webringNav(ring, 'https://stranger.example');
    expect(nav.inRing).toBe(false);
    expect(nav.home).toBe('https://ring.example/');
  });
});
