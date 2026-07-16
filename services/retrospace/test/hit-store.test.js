import { describe, it, expect } from 'vitest';
import { hitStore } from '../src/hit-store.js';

// A fake ops over a Map, matching the DynamoDB binding's contract: add() only
// counts a seeded id (never creates one); seedAndRead() upserts with a floor.
function fakeOps() {
  const table = new Map(); // id -> { inHits, outHits }
  return {
    table,
    async add(id, field) {
      const row = table.get(id);
      if (!row) return false; // unseeded → not counted, never created (the orphan guard)
      row[field] = (row[field] || 0) + 1;
      return true;
    },
    async seedAndRead(id, init = {}) {
      if (!table.has(id)) table.set(id, { inHits: init.inHits || 0, outHits: init.outHits || 0 });
      return { ...table.get(id) };
    },
  };
}

describe('toplist hit-store', () => {
  it('never counts or creates an unseeded id', async () => {
    const ops = fakeOps();
    const store = hitStore(ops);
    expect(await store.count('ghost', 'out')).toBe(false);
    expect(ops.table.has('ghost')).toBe(false);
  });

  it('counts in and out for a seeded site, mapping dir to fields', async () => {
    const ops = fakeOps();
    const store = hitStore(ops);
    await store.sync([{ id: 's1' }]); // seed
    expect(await store.count('s1', 'in')).toBe(true);
    await store.count('s1', 'in');
    await store.count('s1', 'out');
    expect((await store.sync([{ id: 's1' }])).s1).toEqual({ inHits: 2, outHits: 1 });
  });

  it('seeds the floor from the source counts, then never resets it', async () => {
    const ops = fakeOps();
    const store = hitStore(ops);
    let hits = await store.sync([{ id: 's1', inHits: 5, outHits: 2 }]);
    expect(hits.s1).toEqual({ inHits: 5, outHits: 2 }); // seeded from the curated source
    await store.count('s1', 'in'); // a live click adds on top
    hits = await store.sync([{ id: 's1', inHits: 999, outHits: 999 }]); // re-sync must not reset
    expect(hits.s1).toEqual({ inHits: 6, outHits: 2 });
  });

  it('sync seeds every listed site and reads back zeros by default', async () => {
    const ops = fakeOps();
    const hits = await hitStore(ops).sync([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(Object.keys(hits)).toEqual(['a', 'b', 'c']);
    expect(hits.a).toEqual({ inHits: 0, outHits: 0 });
    expect(ops.table.size).toBe(3);
  });

  it('one failing seed does not abort the rest of the export', async () => {
    const ops = fakeOps();
    ops.seedAndRead = async (id, init = {}) => {
      if (id === 'b') throw new Error('throttled');
      ops.table.set(id, { inHits: init.inHits || 0, outHits: init.outHits || 0 });
      return { ...ops.table.get(id) };
    };
    const hits = await hitStore(ops).sync([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
    expect(Object.keys(hits)).toEqual(['a', 'c']); // b skipped, a and c survive
  });

  it('an unknown direction falls back to out', async () => {
    const ops = fakeOps();
    const store = hitStore(ops);
    await store.sync([{ id: 's1' }]);
    await store.count('s1', 'sideways');
    expect((await store.sync([{ id: 's1' }])).s1).toEqual({ inHits: 0, outHits: 1 });
  });
});
