// session.js: signed JWTs and signed one-off values. A forged or expired token must
// verify NOTHING, the same fail-closed discipline as auth.js.
import { describe, it, expect } from 'vitest';
import { signJwt, verifyJwt, signValue, verifyValue } from '../src/session.js';

const KEY = 'a-32-byte-secret-key-for-testing!';

describe('session JWT', () => {
  it('round-trips a payload with iat and exp', () => {
    const t = signJwt({ sub: 'u1', role: 'sysop' }, KEY, { now: 1000, expiresIn: 60 });
    const p = verifyJwt(t, KEY, { now: 1030 });
    expect(p.sub).toBe('u1');
    expect(p.role).toBe('sysop');
    expect(p.iat).toBe(1000);
    expect(p.exp).toBe(1060);
  });

  it('rejects a wrong key', () => {
    const t = signJwt({ sub: 'u1' }, KEY);
    expect(verifyJwt(t, 'a-different-secret-key-of-length!!')).toBeNull();
  });

  it('rejects a tampered payload', () => {
    const t = signJwt({ sub: 'u1', role: 'member' }, KEY);
    const [h, , s] = t.split('.');
    const forged = `${h}.${Buffer.from(JSON.stringify({ sub: 'u1', role: 'webmaster' })).toString('base64url')}.${s}`;
    expect(verifyJwt(forged, KEY)).toBeNull(); // signature no longer matches the swapped body
  });

  it('rejects an expired token', () => {
    const t = signJwt({ sub: 'u1' }, KEY, { now: 1000, expiresIn: 60 });
    expect(verifyJwt(t, KEY, { now: 1000 + 61 })).toBeNull();
  });

  it('rejects garbage without throwing', () => {
    for (const junk of ['', 'a.b', 'a.b.c', 'not-a-token', null, undefined]) {
      expect(verifyJwt(junk, KEY)).toBeNull();
    }
  });
});

describe('signed one-off values (min-time token, quiz-state)', () => {
  it('round-trips a value', () => {
    const t = signValue({ q: 3, started: 1000 }, KEY, { now: 1000 });
    expect(verifyValue(t, KEY, { now: 1005 })).toEqual({ q: 3, started: 1000 });
  });

  it('rejects tamper, wrong key, and expiry', () => {
    const t = signValue({ q: 3 }, KEY, { now: 1000, expiresIn: 10 });
    expect(verifyValue(`${t}x`, KEY)).toBeNull();               // tampered signature
    expect(verifyValue(t, 'another-secret-key-of-length-32!')).toBeNull(); // wrong key
    expect(verifyValue(t, KEY, { now: 1011 })).toBeNull();      // expired
  });
});
