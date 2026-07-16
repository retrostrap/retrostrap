import { describe, it, expect } from 'vitest';
import { publishDirectory } from '../src/publish.js';

const source = [
  {
    id: 's1', url: 'https://a.example', title: 'Bravo', blurb: 'b', categories: ['art'],
    languages: ['en'], tags: ['x'], status: 'listed', lastReviewedAt: '2025-08-14',
    inHits: 3, outHits: 1,
    // moderation internals that must NOT be published:
    check: { score: 100, verdict: 'pass' }, approvedBy: 'stg', submittedBy: 'alice',
    approvedAt: '2025-08-14', nextReviewAt: '2026-08-14',
  },
  { id: 's2', url: 'https://a2.example', title: 'Alpha', status: 'listed' },
  { id: 's3', url: 'https://p.example', title: 'Pending', status: 'submitted' },
];

describe('publishDirectory', () => {
  const out = publishDirectory(source, { generated: '2026-01-01T00:00:00Z' });

  it('publishes only listed sites, sorted by title', () => {
    expect(out.sites.map((s) => s.id)).toEqual(['s2', 's1']); // Alpha before Bravo; Pending excluded
  });

  it('strips moderation internals from the public file', () => {
    const s = out.sites.find((x) => x.id === 's1');
    for (const secret of ['check', 'approvedBy', 'submittedBy', 'approvedAt', 'nextReviewAt']) {
      expect(s).not.toHaveProperty(secret);
    }
    expect(s).toMatchObject({ title: 'Bravo', url: 'https://a.example', inHits: 3, outHits: 1 });
  });

  it('bakes in live hit counts when given, else falls back to the source', () => {
    const withHits = publishDirectory(source, { hits: { s1: { inHits: 999, outHits: 7 } } });
    expect(withHits.sites.find((x) => x.id === 's1')).toMatchObject({ inHits: 999, outHits: 7 });
    expect(withHits.sites.find((x) => x.id === 's2')).toMatchObject({ inHits: 0, outHits: 0 }); // no source hits
  });

  it('includes the taxonomy and the generated stamp', () => {
    expect(out.categories.length).toBeGreaterThan(0);
    expect(out.languages.length).toBeGreaterThan(0);
    expect(out.generated).toBe('2026-01-01T00:00:00Z');
  });
});
