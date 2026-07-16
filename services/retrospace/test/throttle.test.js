// The write endpoints' abuse damper: submissions get 5 an hour per address and
// 50 a day for everyone; toplist counting gets 60 an hour per address. Windows
// reset by key (the table's TTL retires the old token), and the honeypot always
// short-circuits before any quota is burned.
import { describe, it, expect } from 'vitest';
import { throttle } from '../src/throttle.js';

// A fake ops over a Map, matching the DynamoDB binding's contract: rateHit ADDs
// one to the scope's token and stamps the expiry it was handed.
function fakeOps() {
  const tokens = new Map(); // scope -> { n, ttl }
  return {
    tokens,
    async rateHit(scope, expiresAt) {
      const t = tokens.get(scope) || { n: 0 };
      t.n += 1;
      t.ttl = expiresAt;
      tokens.set(scope, t);
      return t.n;
    },
  };
}

const T0 = Date.UTC(2026, 6, 14, 12, 0, 0); // a fixed noon, so windows stay put

describe('submission throttle', () => {
  it('allows five an hour per address, slows the sixth', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 5; i++) expect(await gate.submit({}, '1.2.3.4', T0)).toBe('ok');
    expect(await gate.submit({}, '1.2.3.4', T0)).toBe('slow');
  });

  it('a new hour window is a clean slate (the old token TTLs away)', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 6; i++) await gate.submit({}, '1.2.3.4', T0);
    expect(await gate.submit({}, '1.2.3.4', T0)).toBe('slow');
    expect(await gate.submit({}, '1.2.3.4', T0 + 3600e3)).toBe('ok');
  });

  it('holds the global line at 50 issues a day, rolling at midnight', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 50; i++) expect(await gate.mayOpenIssue(T0)).toBe(true);
    expect(await gate.mayOpenIssue(T0)).toBe(false);
    expect(await gate.mayOpenIssue(T0 + 24 * 3600e3)).toBe(true);
  });

  it('does not charge the global budget from submit (junk POSTs stay cheap)', async () => {
    const ops = fakeOps();
    const gate = throttle(ops);
    for (let i = 0; i < 3; i++) await gate.submit({}, '1.2.3.4', T0);
    expect(ops.tokens.has('submit#all#20260714')).toBe(false); // only mayOpenIssue touches it
  });

  it('the honeypot short-circuits before any quota is burned', async () => {
    const ops = fakeOps();
    const gate = throttle(ops);
    expect(await gate.submit({ website: 'http://bot.example' }, '1.2.3.4', T0)).toBe('drop');
    expect(ops.tokens.size).toBe(0); // no rl# token was touched
    for (let i = 0; i < 5; i++) expect(await gate.submit({}, '1.2.3.4', T0)).toBe('ok');
  });

  it('the per-address submit cap keeps one noisy address to five tries an hour', async () => {
    const ops = fakeOps();
    const gate = throttle(ops);
    let ok = 0;
    for (let i = 0; i < 20; i++) if ((await gate.submit({}, 'noisy', T0)) === 'ok') ok++;
    expect(ok).toBe(5);
  });

  it('stamps each window expiry as the token TTL', async () => {
    const ops = fakeOps();
    const gate = throttle(ops);
    await gate.submit({}, '1.2.3.4', T0);
    await gate.mayOpenIssue(T0);
    const nowS = Math.floor(T0 / 1000);
    expect(ops.tokens.get(`submit#1.2.3.4#${Math.floor(T0 / 3600e3)}`).ttl).toBe(nowS + 3600);
    expect(ops.tokens.get('submit#all#20260714').ttl).toBe(nowS + 86400);
  });

  it('fails open when the table is having a day', async () => {
    const gate = throttle({ rateHit: async () => { throw new Error('throttled'); } });
    expect(await gate.submit({}, '1.2.3.4', T0)).toBe('ok');
    expect(await gate.mayOpenIssue(T0)).toBe(true);
    expect(await gate.mayCount('1.2.3.4', T0)).toBe(true);
  });
});

describe('toplist counting damper', () => {
  it('counts 60 clicks an hour per address, then quietly stops', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 60; i++) expect(await gate.mayCount('1.2.3.4', T0)).toBe(true);
    expect(await gate.mayCount('1.2.3.4', T0)).toBe(false);
  });

  it('resets with the hour window', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 61; i++) await gate.mayCount('1.2.3.4', T0);
    expect(await gate.mayCount('1.2.3.4', T0)).toBe(false);
    expect(await gate.mayCount('1.2.3.4', T0 + 3600e3)).toBe(true);
  });

  it('addresses do not share a bucket', async () => {
    const gate = throttle(fakeOps());
    for (let i = 0; i < 61; i++) await gate.mayCount('1.2.3.4', T0);
    expect(await gate.mayCount('5.6.7.8', T0)).toBe(true);
  });
});
