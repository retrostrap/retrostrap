import { describe, it, expect } from 'vitest';
import { rankSites } from '../src/toplist.js';
import { createStore } from '../src/sites.js';

describe('toplist ranking', () => {
  const sites = [
    { id: 'a', title: 'Alpha', url: 'https://a.example', status: 'listed', inHits: 5, outHits: 2 },
    { id: 'b', title: 'Bravo', url: 'https://b.example', status: 'listed', inHits: 9, outHits: 1 },
    { id: 'c', title: 'Charlie', url: 'https://c.example', status: 'listed', inHits: 5, outHits: 9 },
    { id: 'd', title: 'Delta', url: 'https://d.example', status: 'submitted', inHits: 99, outHits: 99 },
  ];

  it('ranks listed sites by inbound clicks, ties by outbound then title', () => {
    const top = rankSites(sites);
    expect(top.map((s) => s.id)).toEqual(['b', 'c', 'a']); // b(9), then c/a tie at 5 -> c has more out
    expect(top[0].rank).toBe(1);
    expect(top[2].rank).toBe(3);
  });

  it('excludes anything not listed (a submission can not rank itself)', () => {
    expect(rankSites(sites).some((s) => s.id === 'd')).toBe(false);
  });

  it('honors the limit', () => {
    expect(rankSites(sites, { limit: 1 })).toHaveLength(1);
    expect(rankSites(sites, { limit: 0 })).toHaveLength(0);
  });
});

describe('store toplist counters', () => {
  const listed = () => {
    const store = createStore();
    const s = store.submit({ url: 'https://x.example', title: 'X', categories: ['art'], languages: ['en'] });
    store.moderate(s.id, 'approve', { role: 'admin', by: 'stg', at: '2024-01-01T00:00:00.000Z' });
    return { store, id: s.id };
  };

  it('counts in/out only for listed sites', () => {
    const { store, id } = listed();
    expect(store.hitIn(id)).toBe(1);
    expect(store.hitIn(id)).toBe(2);
    expect(store.hitOut(id)).toBe(1);
    expect(store.toplist()[0]).toMatchObject({ id, rank: 1, inHits: 2, outHits: 1 });
  });

  it('does not count a site that is not listed', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://y.example', title: 'Y' }); // still 'submitted'
    expect(store.hitIn(s.id)).toBeNull();
    expect(store.toplist()).toHaveLength(0);
  });

  it('a submission cannot preset its own hit counts', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://z.example', title: 'Z', inHits: 9999, outHits: 9999 });
    expect(s.inHits).toBe(0);
    expect(s.outHits).toBe(0);
  });

  it('treats Infinity or a huge limit as "all", not zero', () => {
    const pool = [
      { id: 'a', title: 'A', url: 'https://a.example', status: 'listed', inHits: 3 },
      { id: 'b', title: 'B', url: 'https://b.example', status: 'listed', inHits: 1 },
    ];
    expect(rankSites(pool, { limit: Infinity })).toHaveLength(2);
    expect(rankSites(pool, { limit: 3e9 })).toHaveLength(2); // | 0 wrapped this to 0 before
    expect(rankSites(pool, { limit: 1 })).toHaveLength(1);
  });
});
