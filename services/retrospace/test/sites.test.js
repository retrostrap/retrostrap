// The store ties verify + classify + moderation together, the DB-free heart the
// frontend seeds and a deployment backs it with DynamoDB (infra/README.md).
import { describe, it, expect } from 'vitest';
import { createStore } from '../src/sites.js';

describe('sites store', () => {
  it('submits with normalized taxonomy and a fresh status', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://x.example', title: 'X', blurb: 'a site', categories: ['art', 'crypto'], languages: ['de', 'zz'] });
    expect(s.status).toBe('submitted');
    expect(s.categories).toEqual(['art']);
    expect(s.languages).toEqual(['de']);
    expect(store.list({ status: 'listed' })).toHaveLength(0); // nothing lists on submit
  });

  it('ignores moderation state a submission tries to set for itself', () => {
    const store = createStore();
    // a hostile submission trying to list itself as approved
    const s = store.submit({
      url: 'https://evil.example', title: 'Evil',
      id: 'hacked', status: 'listed', approvedBy: 'stg', approvedAt: '2020-01-01',
      check: { score: 100, verdict: 'pass' }, submittedBy: 'victim',
    });
    expect(s.status).toBe('submitted');   // not 'listed'
    expect(s.approvedBy).toBeNull();
    expect(s.check).toBeNull();
    expect(s.id).toBe('s1');               // id is minted fresh, not the caller's 'hacked'
    expect(s.submittedBy).toBeNull();      // ownership can't be forged through the input bag
    expect(store.list({ status: 'listed' })).toHaveLength(0); // never reaches the wall
  });

  it('takes the submitter identity from the trusted actor, not the input', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://mine.example', title: 'Mine', submittedBy: 'forged' }, { actor: 'alice' });
    expect(s.submittedBy).toBe('alice');
  });

  it('rejects a non-http(s) submission url', () => {
    const store = createStore();
    expect(() => store.submit({ url: 'javascript:alert(1)', title: 'x' })).toThrow(/http/);
  });

  it('matches a homepage to a listing for the profile badge, listed only', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://mysite.example', title: 'Mine' });
    expect(store.listedByUrl('https://mysite.example')).toBeNull(); // not listed yet
    store.moderate(s.id, 'approve', { role: 'admin', by: 'stg', at: '2024-01-01T00:00:00.000Z' });
    // now listed, matches across www, trailing slash, case, and scheme
    expect(store.listedByUrl('http://WWW.MySite.example/')).toMatchObject({ id: s.id });
    expect(store.listedByUrl('https://other.example')).toBeNull();
    expect(store.listedByUrl('not a url')).toBeNull();
  });

  it('moves a submission to listed only through a reviewer approval', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://y.example', title: 'Y', categories: ['games'], languages: ['en'] });
    expect(() => store.moderate(s.id, 'approve', { role: 'member' })).toThrow();
    const listed = store.moderate(s.id, 'approve', { role: 'admin', by: 'stg', at: '2024-01-01T00:00:00.000Z' });
    expect(listed.status).toBe('listed');
    expect(listed.approvedBy).toBe('stg');
    expect(store.list({ status: 'listed' }).map((x) => x.id)).toContain(s.id);
  });

  it('seeds, filters, searches, and reports due reviews', () => {
    const store = createStore([
      { id: 'p', title: 'Pixel Pals', blurb: 'a club', status: 'listed', categories: ['community'], languages: ['en'], nextReviewAt: '2024-01-01T00:00:00.000Z' },
      { id: 'q', title: 'Kachelwelt', blurb: 'kacheln', status: 'listed', categories: ['art'], languages: ['de'], nextReviewAt: '2099-01-01T00:00:00.000Z' },
    ]);
    expect(store.list({ status: 'listed', language: 'de' }).map((s) => s.id)).toEqual(['q']);
    expect(store.search('pixel').map((s) => s.id)).toEqual(['p']);
    expect(store.due('2025-01-01T00:00:00.000Z').map((s) => s.id)).toEqual(['p']);
  });

  it('never reuses an id, even when seeded ids are non-contiguous', () => {
    const store = createStore([{ id: 's2', status: 'listed', title: 'Seed', url: 'https://seed.example' }]);
    const s = store.submit({ url: 'https://new.example', title: 'New' });
    expect(s.id).not.toBe('s2');
    expect(store.get('s2').title).toBe('Seed');
  });

  it('rejects a duplicate URL (the schema declares it unique)', () => {
    const store = createStore();
    store.submit({ url: 'https://dup.example', title: 'A' });
    expect(() => store.submit({ url: 'https://dup.example', title: 'B' })).toThrow(/already/);
  });

  it('hands back deep copies, not live references', () => {
    const store = createStore();
    const s = store.submit({ url: 'https://z.example', title: 'Z', categories: ['art'] });
    s.title = 'mutated'; s.categories.push('games');
    expect(store.get(s.id).title).toBe('Z');
    expect(store.get(s.id).categories).toEqual(['art']); // nested array not leaked
  });
});
