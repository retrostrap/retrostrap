// The request layer's plumbing: cookie round-trips (incl. a malformed one), the double-submit
// CSRF check, session loading with role/revocation/ban read from the record, and descriptor mapping.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { signJwt } from '../src/session.js';
import { issueBan } from '../src/moderation.js';
import { parseCookies, sessionCookie, clearSession, csrfCookie, checkCsrf, loadUser, toResponse, clientIp } from '../src/http.js';

const iso = (s) => new Date(s * 1000).toISOString();

describe('cookies', () => {
  it('parses a Cookie header and survives a malformed escape', () => {
    expect(parseCookies('__Host-sid=abc; __Host-csrf=xy%20z')).toEqual({ '__Host-sid': 'abc', '__Host-csrf': 'xy z' });
    expect(parseCookies('')).toEqual({});
    expect(parseCookies('junk')).toEqual({});
    expect(parseCookies('x=%')).toEqual({ x: '%' }); // bad %-escape must not throw
  });

  it('serializes host-only, secure, httponly session and csrf cookies', () => {
    const s = sessionCookie('jwt-value');
    expect(s).toMatch(/^__Host-sid=jwt-value;/);
    expect(s).toContain('HttpOnly');
    expect(s).toContain('Secure');
    expect(s).toContain('SameSite=Lax');
    expect(s).toContain('Max-Age=');
    expect(clearSession()).toContain('Max-Age=0');
    expect(csrfCookie('t')).toMatch(/^__Host-csrf=t;/);
  });
});

describe('csrf double-submit', () => {
  it('accepts a match and rejects everything else', () => {
    expect(checkCsrf('abc123', 'abc123')).toBe(true);
    expect(checkCsrf('abc123', 'abc124')).toBe(false);
    expect(checkCsrf('', 'abc')).toBe(false);
    expect(checkCsrf('abc', '')).toBe(false);
    expect(checkCsrf('abc', 'abcd')).toBe(false);    // different length, no throw
    expect(checkCsrf('€', 'a')).toBe(false);          // multibyte vs ascii, no RangeError
  });
});

describe('loadUser', () => {
  const KEY = 'a-key';
  const T = 1_700_000_000;
  let db;
  beforeEach(async () => {
    db = boardsStore(memOps());
    await db.createUser({ id: 'u1', displayName: 'Ada', email: 'a@x.example', passwordHash: 'x', role: 'member', postCount: 0, createdAt: 'now', sessionsValidAfter: 0, verifiedAt: 'now' });
  });

  it('returns the user for a valid session cookie', async () => {
    const jwt = signJwt({ sub: 'u1', role: 'member' }, KEY, { now: T });
    const user = await loadUser(db, { '__Host-sid': jwt }, KEY, T + 5, iso(T + 5));
    expect(user.id).toBe('u1');
  });

  it('returns null with no cookie, a bad token, or an unknown user', async () => {
    expect(await loadUser(db, {}, KEY, T, iso(T))).toBeNull();
    expect(await loadUser(db, { '__Host-sid': 'not.a.jwt' }, KEY, T, iso(T))).toBeNull();
    const ghost = signJwt({ sub: 'nope' }, KEY, { now: T });
    expect(await loadUser(db, { '__Host-sid': ghost }, KEY, T + 5, iso(T + 5))).toBeNull();
  });

  it('rejects a token issued before the account revoked its sessions', async () => {
    const jwt = signJwt({ sub: 'u1', role: 'member' }, KEY, { now: T });
    await db.revokeSessions('u1', T + 10);                 // e.g. a password reset
    expect(await loadUser(db, { '__Host-sid': jwt }, KEY, T + 20, iso(T + 20))).toBeNull();
  });

  it('treats an actively-banned account as logged-out (no writing around a ban)', async () => {
    const jwt = signJwt({ sub: 'u1', role: 'member' }, KEY, { now: T });
    const ban = issueBan('u1', { level: '7d', reason: 'spam', by: 'mod', role: 'sysop', at: iso(T) });
    await db.putBan(ban, { action: 'ban', by: 'mod', target: 'u1', reason: 'spam', at: iso(T), id: 'l1' });
    expect(await loadUser(db, { '__Host-sid': jwt }, KEY, T + 3600, iso(T + 3600))).toBeNull();
  });

  it('does not trust the token role claim; the record wins', async () => {
    const jwt = signJwt({ sub: 'u1', role: 'webmaster' }, KEY, { now: T }); // forged elevation
    const user = await loadUser(db, { '__Host-sid': jwt }, KEY, T + 5, iso(T + 5));
    expect(user.role).toBe('member'); // re-read from the record
  });
});

describe('toResponse', () => {
  it('maps an html descriptor to a 200 page with security headers', () => {
    const r = toResponse({ status: 200, html: '<p>hi</p>' });
    expect(r.status).toBe(200);
    expect(r.headers['Content-Type']).toContain('text/html');
    expect(r.headers['Content-Security-Policy']).toContain("script-src 'self'");
    expect(r.headers['X-Content-Type-Options']).toBe('nosniff');
    expect(r.body).toBe('<p>hi</p>');
  });

  it('maps a redirect and attaches the session cookie', () => {
    const r = toResponse({ status: 303, redirect: '/', setSession: 'jwt' });
    expect(r.status).toBe(303);
    expect(r.headers.Location).toBe('/');
    expect(r.cookies.some((c) => c.startsWith('__Host-sid=jwt;'))).toBe(true);
  });

  it('clears the session on logout', () => {
    const r = toResponse({ status: 303, redirect: '/', clearSession: true });
    expect(r.cookies.some((c) => c.includes('Max-Age=0'))).toBe(true);
  });

  it('rides a flash notice on the redirect, whatever the query situation', () => {
    expect(toResponse({ redirect: '/', notice: 'moved' }).headers.Location).toBe('/?notice=moved');
    expect(toResponse({ redirect: '/threads/t1?page=2', notice: 'ban-lifted' }).headers.Location).toBe('/threads/t1?page=2&notice=ban-lifted');
    expect(toResponse({ redirect: '/login' }).headers.Location).toBe('/login');
  });
});


describe('clientIp trusts only edge signals and keeps IPv6 whole', () => {
  const ctx = (headers, sourceIp) => ({
    req: { header: (n) => headers[n] },
    env: sourceIp ? { event: { requestContext: { http: { sourceIp } } } } : undefined,
  });

  it('strips the port from CloudFront-Viewer-Address, IPv4 and IPv6', () => {
    expect(clientIp(ctx({ 'cloudfront-viewer-address': '203.0.113.9:44321' }))).toBe('203.0.113.9');
    expect(clientIp(ctx({ 'cloudfront-viewer-address': '2001:db8::7334:44321' }))).toBe('2001:db8::7334');
  });

  it('takes the stamped x-viewer-address untouched (bare IP, no port to strip)', () => {
    expect(clientIp(ctx({ 'x-viewer-address': '2001:db8::7334' }))).toBe('2001:db8::7334');
    expect(clientIp(ctx({ 'x-viewer-address': '203.0.113.9' }))).toBe('203.0.113.9');
  });

  it('prefers the stamped header; a smuggled CloudFront-Viewer-Address loses', () => {
    const both = { 'x-viewer-address': '203.0.113.9', 'cloudfront-viewer-address': '198.51.100.66:443' };
    expect(clientIp(ctx(both))).toBe('203.0.113.9');
  });

  it('falls back to the event source IP, then to unknown', () => {
    expect(clientIp(ctx({}, '198.51.100.7'))).toBe('198.51.100.7');
    expect(clientIp(ctx({}))).toBe('unknown');
  });
});
