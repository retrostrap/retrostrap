// The account flow over mem-ops + a mem email transport: registration's bot gates and
// validation, the verification link, and login's throttle, enumeration-resistance, and its
// refusal of unverified or banned accounts. A fixed key and injected clock, no network.
import { describe, it, expect, beforeEach } from 'vitest';
import { boardsStore } from '../src/boards-store.js';
import { memOps } from '../src/mem-ops.js';
import { memEmail } from '../src/mem-email.js';
import { register, verify, login, logout, newChallenge, requestReset, performReset } from '../src/auth-handlers.js';
import { QUESTIONS } from '../src/quiz.js';
import { hashPassword } from '../src/auth.js';
import { signValue, verifyJwt } from '../src/session.js';
import { issueBan } from '../src/moderation.js';

const KEY = 'a-test-signing-secret';
const T = 1_700_000_000;
const iso = (s) => new Date(s * 1000).toISOString();

let db, mail, ids;
const newId = () => `u${++ids}`;
beforeEach(() => { db = boardsStore(memOps()); mail = memEmail(); ids = 0; });

// A form that would pass every gate: correct answer to its own challenge, submitted after a beat.
function goodForm(overrides = {}) {
  const ch = newChallenge({ key: KEY, nowS: T });
  return {
    form: { name: 'Ada', email: 'ada@x.example', password: 'sekrit-pw-99', password2: 'sekrit-pw-99', age: 'yes', answer: QUESTIONS[ch.index].a[0], challenge: ch.token, website: '', ...overrides },
    at: T + 10, // min fill time is 8s (docs/11 §6)
  };
}
const doRegister = ({ form, at }) => register(db, mail, { form, ip: '1.2.3.4', nowS: at, nowIso: iso(at), key: KEY, appName: 'Retrostrap Boards', verifyUrlBase: 'https://retrostrap.dev/verify', newId });

describe('register', () => {
  it('creates an unverified member and emails a verification link', async () => {
    const r = await doRegister(goodForm());
    expect(r).toMatchObject({ status: 200, notice: 'check-email', email: 'ada@x.example' });
    const u = await db.userByEmail('ada@x.example');
    expect(u.displayName).toBe('Ada');
    expect(u.verifiedAt).toBeNull();                       // not usable until confirmed
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].text).toContain('https://retrostrap.dev/verify?token=');
  });

  it('drops a bot that fills the honeypot, with no account and no email', async () => {
    const r = await doRegister(goodForm({ website: 'http://spam.example' }));
    expect(r.status).toBe(400);
    expect(await db.userByEmail('ada@x.example')).toBeNull();
    expect(mail.sent).toHaveLength(0);
  });

  it('rejects mismatched passwords and a missing age confirmation', async () => {
    expect((await doRegister(goodForm({ password2: 'different-99' }))).status).toBe(400);
    expect((await doRegister(goodForm({ age: '' }))).status).toBe(400);
  });

  it('accepts a Unicode display name but rejects zero-width/control characters', async () => {
    expect((await doRegister(goodForm({ name: 'Müller', email: 'm@x.example' }))).status).toBe(200);
    expect((await doRegister(goodForm({ name: 'Ab​cd', email: 'z@x.example' }))).status).toBe(400); // zero-width space
  });

  it('rejects a form submitted faster than a human could', async () => {
    const { form } = goodForm();
    const r = await register(db, mail, { form, ip: '1.2.3.4', nowS: T + 1, nowIso: iso(T + 1), key: KEY, verifyUrlBase: 'https://x/verify', newId });
    expect(r.status).toBe(400);
    expect(r.requiz).toBe(true);
  });

  it('rejects a wrong quiz answer, a bad name, and a short password', async () => {
    expect((await doRegister(goodForm({ answer: 'definitely wrong' }))).status).toBe(400);
    expect((await doRegister(goodForm({ name: 'a' }))).status).toBe(400);          // too short
    expect((await doRegister(goodForm({ password: 'short' }))).status).toBe(400);
  });

  it('rejects a tampered or expired challenge', async () => {
    const r = await doRegister({ form: { ...goodForm().form, challenge: 'not.a.valid.token' }, at: T + 5 });
    expect(r.status).toBe(400);
    expect(r.requiz).toBe(true);
  });

  it('rejects a replayed challenge (single-use nonce)', async () => {
    const { form } = goodForm(); // one challenge, reused below
    const args = (email) => ({ form: { ...form, email }, ip: '1.2.3.4', nowS: T + 10, nowIso: iso(T + 10), key: KEY, appName: 'X', verifyUrlBase: 'https://x/verify', newId });
    expect((await register(db, mail, args('a@x.example'))).status).toBe(200);
    const replay = await register(db, mail, args('b@x.example')); // same challenge, fresh email
    expect(replay.status).toBe(400);
    expect(replay.requiz).toBe(true);
  });

  it('answers a taken email exactly like success, but quietly emails the existing account', async () => {
    await db.createUser({ id: 'x', displayName: 'Someone', email: 'ada@x.example', passwordHash: hashPassword('whatever!!x'), role: 'member', postCount: 0, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: iso(T) });
    const r = await doRegister(goodForm());
    expect(r).toMatchObject({ status: 200, notice: 'check-email' }); // no 409, no enumeration
    expect(mail.sent).toHaveLength(1);
    expect(mail.sent[0].subject).toContain('already have');
  });
});

describe('verify', () => {
  beforeEach(async () => {
    await db.createUser({ id: 'u1', displayName: 'Ada', email: 'ada@x.example', passwordHash: hashPassword('hunter2!!'), role: 'member', postCount: 0, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: null });
  });

  it('confirms the email and sends the member to the login form (no GET auto-login)', async () => {
    const token = signValue({ t: 'verify', uid: 'u1' }, KEY, { expiresIn: 86400, now: T });
    const r = await verify(db, { token, key: KEY, nowS: T, nowIso: iso(T) });
    expect(r).toMatchObject({ status: 303, redirect: '/login?notice=verified' });
    expect(r.setSession).toBeUndefined();               // confirmation must not mint a session
    expect((await db.getUser('u1')).verifiedAt).toBe(iso(T));
  });

  it('rejects a garbage or wrong-purpose token', async () => {
    expect((await verify(db, { token: 'nonsense', key: KEY, nowS: T, nowIso: iso(T) })).status).toBe(400);
    const wrong = signValue({ t: 'reset', uid: 'u1' }, KEY, { now: T });
    expect((await verify(db, { token: wrong, key: KEY, nowS: T, nowIso: iso(T) })).status).toBe(400);
  });
});

describe('login', () => {
  const doLogin = (form, at = T) => login(db, { form, ip: '9.9.9.9', nowS: at, nowIso: iso(at), key: KEY });
  beforeEach(async () => {
    await db.createUser({ id: 'u1', displayName: 'Ada', email: 'ada@x.example', passwordHash: hashPassword('hunter2!!'), role: 'member', postCount: 0, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: iso(T) });
  });

  it('signs in a verified member with the right password', async () => {
    const r = await doLogin({ email: 'ada@x.example', password: 'hunter2!!' });
    expect(r.status).toBe(303);
    expect(verifyJwt(r.setSession, KEY, { now: T }).sub).toBe('u1');
  });

  it('gives one generic answer to a wrong password and to an unknown email', async () => {
    expect((await doLogin({ email: 'ada@x.example', password: 'nope' })).status).toBe(401);
    expect((await doLogin({ email: 'ghost@x.example', password: 'whatever!!' })).status).toBe(401);
  });

  it('refuses an unverified account', async () => {
    await db.createUser({ id: 'u2', displayName: 'Bo', email: 'bo@x.example', passwordHash: hashPassword('hunter2!!'), role: 'member', postCount: 0, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: null });
    expect((await doLogin({ email: 'bo@x.example', password: 'hunter2!!' })).status).toBe(403);
  });

  it('refuses a banned account with its reason', async () => {
    const ban = issueBan('u1', { level: '7d', reason: 'flooding', by: 'mod', role: 'sysop', at: iso(T) });
    await db.putBan(ban, { action: 'ban', by: 'mod', target: 'u1', reason: 'flooding', at: iso(T), id: 'log1' });
    const r = await doLogin({ email: 'ada@x.example', password: 'hunter2!!' }, T + 3600);
    expect(r.status).toBe(403);
    expect(r.error).toContain('flooding');
  });

  it('throttles a burst of attempts (429 once the per-email limit trips)', async () => {
    for (let i = 0; i < 10; i++) await doLogin({ email: 'spammer@x.example', password: 'x' });
    expect((await doLogin({ email: 'spammer@x.example', password: 'x' })).status).toBe(429);
  });
});

describe('logout', () => {
  it('redirects and clears the session', () => {
    expect(logout()).toEqual({ status: 303, redirect: '/', clearSession: true });
  });
});

describe('password reset', () => {
  const resetUrlBase = 'https://retrostrap.dev/reset';
  const doRequest = (email, at = T) => requestReset(db, mail, { form: { email }, ip: '5.5.5.5', nowS: at, key: KEY, appName: 'Retrostrap Boards', resetUrlBase });
  const tokenFromEmail = () => decodeURIComponent(mail.sent[0].text.match(/token=([^\s&]+)/)[1]);
  beforeEach(async () => {
    await db.createUser({ id: 'u1', displayName: 'Ada', email: 'ada@x.example', passwordHash: hashPassword('oldpass!!'), role: 'member', postCount: 0, createdAt: iso(T), sessionsValidAfter: 0, verifiedAt: iso(T) });
  });

  it('mails a real address, stays silent on an unknown one, and answers identically', async () => {
    expect(await doRequest('ada@x.example')).toEqual({ status: 200, notice: 'reset-sent' });
    expect(mail.sent).toHaveLength(1);
    expect(await doRequest('ghost@x.example')).toEqual({ status: 200, notice: 'reset-sent' }); // same answer
    expect(mail.sent).toHaveLength(1); // but no second email: no enumeration
  });

  it('sets a new password, logs out every existing session, and the new password works', async () => {
    await doRequest('ada@x.example');
    const r = await performReset(db, { form: { token: tokenFromEmail(), password: 'brandnew!!' }, nowS: T + 60, nowIso: iso(T + 60), key: KEY });
    expect(r.status).toBe(303);
    expect(verifyJwt(r.setSession, KEY, { now: T + 60 }).sub).toBe('u1');
    expect((await db.getUser('u1')).sessionsValidAfter).toBe(T + 60); // old sessions invalidated
    const login2 = (password) => login(db, { form: { email: 'ada@x.example', password }, ip: '1.1.1.1', nowS: T + 120, nowIso: iso(T + 120), key: KEY });
    expect((await login2('brandnew!!')).status).toBe(303); // new password logs in
    expect((await login2('oldpass!!')).status).toBe(401);   // old one is dead
  });

  it('refuses a reused token (single use) and a garbage one', async () => {
    await doRequest('ada@x.example');
    const token = tokenFromEmail();
    await performReset(db, { form: { token, password: 'first-set!!' }, nowS: T + 60, nowIso: iso(T + 60), key: KEY });
    expect((await performReset(db, { form: { token, password: 'second-go!!' }, nowS: T + 90, nowIso: iso(T + 90), key: KEY })).status).toBe(400);
    expect((await performReset(db, { form: { token: 'garbage', password: 'whatever!!' }, nowS: T, nowIso: iso(T), key: KEY })).status).toBe(400);
  });

  it('rejects a short new password', async () => {
    await doRequest('ada@x.example');
    expect((await performReset(db, { form: { token: tokenFromEmail(), password: 'short' }, nowS: T + 60, nowIso: iso(T + 60), key: KEY })).status).toBe(400);
  });
});

describe('performReset on an erased account', () => {
  it('answers like any dead link instead of crashing', async () => {
    const { memOps } = await import('../src/mem-ops.js');
    const { boardsStore } = await import('../src/boards-store.js');
    const { hashToken } = await import('../src/auth.js');
    const store = boardsStore(memOps());
    // a reset token whose account has since been erased (GDPR flow is manual today)
    await store.putToken(hashToken('tok'), { uid: 'gone', purpose: 'reset', expiresAt: 9999999999 }, 9999999999);
    const r = await performReset(store, { form: { token: 'tok', password: 'longenough123' }, nowS: 1, nowIso: '2001-01-01T00:00:00Z', key: 'k' });
    expect(r.status).toBe(400);
    expect(r.error).toMatch(/invalid, already used, or expired/);
  });
});
