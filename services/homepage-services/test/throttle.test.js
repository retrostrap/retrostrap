// The guestbook write throttle (ten an hour per address, an rl# token that the
// table's TTL retires) and the storage backstop TTLs from infra/README.md.
import { describe, it, expect } from 'vitest';
import { dynamoStore, withTtl, COUNTER_TTL_S, ENTRY_TTL_S } from '../src/dynamo-store.js';
import { memoryStore, guestbookThrottled, counterThrottled } from '../src/services.js';

// Records every add() so the tests can see keys and TTL options go through.
function fakeOps() {
  const rows = new Map();
  const calls = [];
  return {
    calls,
    async add(key, field, n, opts = {}) {
      calls.push({ key, field, n, opts });
      const k = `${key.pk} ${key.sk}`;
      const item = rows.get(k) || {};
      item[field] = (item[field] || 0) + n;
      rows.set(k, item);
      return item[field];
    },
  };
}

const NOW_S = Math.floor(Date.UTC(2026, 6, 14, 12, 0, 0) / 1000); // a fixed noon, the hour window stays put

describe('guestbook write throttle', () => {
  it('lets ten an hour through, trips on the eleventh', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 10; i++) expect(await guestbookThrottled(store, '1.2.3.4', NOW_S)).toBe(false);
    expect(await guestbookThrottled(store, '1.2.3.4', NOW_S)).toBe(true);
  });

  it('a new hour window is a clean slate (the old token TTLs away)', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 11; i++) await guestbookThrottled(store, '1.2.3.4', NOW_S);
    expect(await guestbookThrottled(store, '1.2.3.4', NOW_S)).toBe(true);
    expect(await guestbookThrottled(store, '1.2.3.4', NOW_S + 3600)).toBe(false);
  });

  it('addresses do not share a bucket', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 11; i++) await guestbookThrottled(store, '1.2.3.4', NOW_S);
    expect(await guestbookThrottled(store, '5.6.7.8', NOW_S)).toBe(false);
  });

  it('hands the window expiry to the table as the rl# item TTL', async () => {
    const ops = fakeOps();
    await guestbookThrottled(dynamoStore(ops), '1.2.3.4', NOW_S);
    expect(ops.calls.at(-1)).toMatchObject({
      key: { pk: `rl#ip:1.2.3.4#sign:${Math.floor(NOW_S / 3600)}`, sk: '-' },
      field: 'n',
      n: 1,
      opts: { ttl: NOW_S + 3600 },
    });
  });

  it('works over memoryStore too (the self-host path)', async () => {
    const store = memoryStore();
    const nowS = Math.floor(Date.now() / 1000); // real now: the memory store expires lazily on the clock
    for (let i = 0; i < 10; i++) expect(await guestbookThrottled(store, '1.2.3.4', nowS)).toBe(false);
    expect(await guestbookThrottled(store, '1.2.3.4', nowS)).toBe(true);
  });
});

describe('counter damper', () => {
  it('counts sixty an hour per address per page, then quietly stops', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 60; i++) expect(await counterThrottled(store, '1.2.3.4', '/', NOW_S)).toBe(false);
    expect(await counterThrottled(store, '1.2.3.4', '/', NOW_S)).toBe(true);
  });

  it('a different page is a separate bucket (browsing counts, refreshing one page is damped)', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 61; i++) await counterThrottled(store, '1.2.3.4', '/', NOW_S);
    expect(await counterThrottled(store, '1.2.3.4', '/about', NOW_S)).toBe(false);
  });

  it('addresses do not share a bucket', async () => {
    const store = dynamoStore(fakeOps());
    for (let i = 0; i < 61; i++) await counterThrottled(store, '1.2.3.4', '/', NOW_S);
    expect(await counterThrottled(store, '5.6.7.8', '/', NOW_S)).toBe(false);
  });

  it('works over memoryStore too (the self-host path)', async () => {
    const store = memoryStore();
    const nowS = Math.floor(Date.now() / 1000);
    for (let i = 0; i < 60; i++) expect(await counterThrottled(store, '1.2.3.4', '/', nowS)).toBe(false);
    expect(await counterThrottled(store, '1.2.3.4', '/', nowS)).toBe(true);
  });
});

describe('storage backstop TTLs', () => {
  it('withTtl stamps an absolute epoch expiry, never a duration', () => {
    expect(withTtl({ a: 1 }, ENTRY_TTL_S, 1000)).toEqual({ a: 1, ttl: 1000 + ENTRY_TTL_S });
  });

  it('guestbook entries get 180 days, counters two years', () => {
    expect(ENTRY_TTL_S).toBe(180 * 24 * 3600);
    expect(COUNTER_TTL_S).toBe(2 * 365 * 24 * 3600);
  });
});
