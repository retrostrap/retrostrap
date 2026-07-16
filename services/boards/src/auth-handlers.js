// auth-handlers.js, register / verify / login / logout / reset as pure orchestration over the
// store, the email transport, and the tested primitives (quiz, auth, session). No hono, no clock:
// the caller injects `nowS` (unix seconds, for signing), `nowIso` (records + ban compares), `key`
// (the HMAC secret), `newId`, and the requester's `ip`. Each returns a descriptor the request
// layer maps; a login/reset success carries `setSession` (a JWT) for the cookie.
import { checkAnswer, pickQuestion, QUESTIONS } from './quiz.js';
import { hashPassword, verifyPassword, newSessionToken, hashToken } from './auth.js';
import { signValue, verifyValue, signJwt } from './session.js';
import { emailer } from './email.js';
import { activeBan } from './moderation.js';
import { ConflictError } from './boards-store.js';

const MIN_FILL_SECONDS = 8;                              // docs/11 §6: faster than 8s is a bot
// 3-24 chars, starts with a letter/number, then letters/numbers/space/-/_ . Unicode letters are
// allowed so "Müller" works on Der Stammtisch; \p{L}\p{N} excludes zero-width, RTL-override, and
// control chars (they are \p{Cf}/\p{Cc}), which limits homoglyph/impersonation abuse. Names are
// NFC-normalized before this runs so the same visible name has one encoding.
const NAME_RE = /^[\p{L}\p{N}][\p{L}\p{N} _-]{2,23}$/u;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CHALLENGE_TTL = 1800;                              // the register form is good for 30 min
const VERIFY_TTL = 24 * 3600;                            // the confirmation link lasts a day
const RESET_TTL = 3600;                                  // a reset link lasts an hour

const err = (status, error, extra = {}) => ({ status, error, ...extra });
const redirect = (to, extra = {}) => ({ status: 303, redirect: to, ...extra });
const hourWindow = (nowS) => Math.floor(nowS / 3600);
const quarterHour = (nowS) => Math.floor(nowS / 900);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// The default hasher is scrypt (auth.js, zero-dep, tested here). handler.js injects an argon2id
// hasher in production; the interface (async hash(pw) -> string, verify(pw, stored) -> bool) is
// identical, so these handlers don't care which one runs.
const SCRYPT = { hash: (pw) => hashPassword(pw), verify: (pw, stored) => verifyPassword(pw, stored) };

// One hash for logins that miss, so a nonexistent email costs the same as a wrong password (no
// user-enumeration by timing). Lazily built, in whatever scheme the injected hasher uses.
let DUMMY_HASH = null;
const dummyHash = async (hasher) => (DUMMY_HASH ??= await hasher.hash('placeholder-for-constant-time-login'));

/** Mint the signed challenge (quiz question, issue-time, and a single-use nonce) for a fresh
    register form. Re-mint on every render and on a failed answer. */
export function newChallenge({ key, nowS, seed = 0, avoid = -1 }) {
  const q = pickQuestion(seed, avoid);
  const token = signValue({ q, t: nowS, n: newSessionToken() }, key, { expiresIn: CHALLENGE_TTL, now: nowS });
  return { index: q, question: QUESTIONS[q].q, hint: QUESTIONS[q].hint, token };
}

/** Handle a registration POST. Silent to bots (honeypot + min-time + single-use challenge); a
    real human gets a verification email; the account exists but stays unverified until confirmed.
    A duplicate gets the SAME response as success (no name/email enumeration), and the existing
    address is quietly told it already has an account. */
export async function register(store, transport, { form = {}, ip = 'unknown', nowS, nowIso, key, appName, verifyUrlBase, newId, hasher = SCRYPT } = {}) {
  if (String(form.website || '').trim() !== '') return err(400, 'Registration failed. Please try again.'); // honeypot (docs/11 §6)
  const ch = verifyValue(form.challenge, key, { now: nowS });
  if (!ch || typeof ch.q !== 'number' || typeof ch.t !== 'number') return err(400, 'The form expired. Please reload and try again.', { requiz: true });
  if (nowS - ch.t < MIN_FILL_SECONDS) return err(400, 'That was quick! Please try again.', { requiz: true });
  // hand the failed question back so the re-render can avoid repeating it
  if (!checkAnswer(ch.q, form.answer)) return err(400, 'That is not the answer we were looking for.', { requiz: true, failedQ: ch.q });
  // burn the challenge so a solved token can't be replayed for scripted mass-registration
  if (!ch.n || !(await store.useNonce(ch.n, nowS + CHALLENGE_TTL))) return err(400, 'That form was already used. Please reload and try again.', { requiz: true });

  const name = String(form.name || '').normalize('NFC').trim();
  const email = String(form.email || '').trim().toLowerCase();
  const password = String(form.password || '');
  if (!NAME_RE.test(name)) return err(400, 'A name is 3 to 24 letters, numbers, spaces, - or _.', { requiz: true });
  if (!EMAIL_RE.test(email) || email.length > 254) return err(400, 'That email address looks off.', { requiz: true });
  if (password.length < 10) return err(400, 'A password needs at least 10 characters.', { requiz: true });
  if (password.length > 1024) return err(400, 'That password is too long.', { requiz: true }); // bound the hash input
  if (password !== String(form.password2 || '')) return err(400, 'The two passwords do not match.', { requiz: true });
  if (!form.age) return err(400, 'Please confirm you are 16 or older.', { requiz: true }); // docs/11 §6, §9

  if ((await store.rateHit(`ip:${ip}`, `register:${hourWindow(nowS)}`, nowS + 3600)) > 10) {
    return err(429, 'Too many sign-ups from here. Please try again later.', { requiz: true });
  }

  const id = newId();
  const user = { id, displayName: name, email, passwordHash: await hasher.hash(password), role: 'member', postCount: 0, createdAt: nowIso, sessionsValidAfter: 0, verifiedAt: null };
  try {
    await store.createUser(user);
  } catch (e) {
    if (!(e instanceof ConflictError)) throw e;
    // enumeration-safe: reply exactly as for success; if the EMAIL is the taken one, tell it quietly.
    const existing = await store.userByEmail(email);
    if (existing) {
      // swallow: the reply is identical either way, a send error must not 500 and leak it
      await emailer(transport, { appName }).sendAccountExists({ to: email, displayName: existing.displayName, loginUrl: verifyUrlBase.replace(/\/verify$/, '/login') }).catch(() => {});
    }
    return { status: 200, notice: 'check-email', email };
  }

  const vtoken = signValue({ t: 'verify', uid: id }, key, { expiresIn: VERIFY_TTL, now: nowS });
  // a send failure here can't be allowed to 500: the account already exists, so a 500
  // both breaks the flow and (only real, fresh emails reach here) times as a signal.
  // The account stays unverified; a resend path is the fast-follow (forum-internals F2).
  await emailer(transport, { appName }).sendVerification({ to: email, displayName: name, verifyUrl: `${verifyUrlBase}?token=${encodeURIComponent(vtoken)}` }).catch(() => {});
  return { status: 200, notice: 'check-email', email };
}

/** Confirm an email from the link. It does NOT sign the member in: auto-login from a GET is a
    login-CSRF and would let a leaked link log someone into that account. Confirm, then send them
    to the login form to enter their password once more. Idempotent. */
export async function verify(store, { token, key, nowS, nowIso } = {}) {
  const v = verifyValue(token, key, { now: nowS });
  if (!v || v.t !== 'verify' || !v.uid) return err(400, 'This confirmation link is invalid or has expired.');
  const user = await store.getUser(v.uid);
  if (!user) return err(404, 'That account no longer exists.');
  if (!user.verifiedAt) await store.setUser(v.uid, { verifiedAt: nowIso });
  return redirect('/login?notice=verified');
}

/** Handle a login POST. Throttled per IP and per email, enumeration-resistant, and it refuses an
    unverified or banned account. On success it hands back a session JWT. */
export async function login(store, { form = {}, ip = 'unknown', nowS, nowIso, key, hasher = SCRYPT } = {}) {
  const email = String(form.email || '').trim().toLowerCase().slice(0, 254); // bound the rate-limit key (DynamoDB pk cap)
  const password = String(form.password || '');
  const tooMany = (await store.rateHit(`ip:${ip}`, `login:${quarterHour(nowS)}`, nowS + 900)) > 20
    || (await store.rateHit(`email:${email}`, `login:${quarterHour(nowS)}`, nowS + 900)) > 10;
  if (tooMany) return err(429, 'Too many attempts. Please wait a few minutes and try again.');
  if (password.length > 1024) return err(401, "That didn't match. Caps Lock is the usual suspect."); // reject before the hash, same generic answer

  const user = await store.userByEmail(email);
  const ok = user ? await hasher.verify(password, user.passwordHash) : await hasher.verify(password, await dummyHash(hasher));
  if (!user || !ok) return err(401, "That didn't match. Caps Lock is the usual suspect.");
  if (!user.verifiedAt) return err(403, 'Please confirm your email first. The link is in your inbox.');
  const ban = activeBan(await store.bans(user.id), nowIso);
  if (ban) return err(403, `Your account is suspended: ${ban.reason}`);

  const jwt = signJwt({ sub: user.id, role: user.role }, key, { now: nowS });
  return redirect('/', { setSession: jwt, notice: 'welcome' });
}

/** Clear the session cookie. (Revoking every session everywhere is a separate account action.) */
export function logout() {
  return redirect('/', { clearSession: true });
}

/** Ask for a password reset. Always answers the same so nobody learns which emails exist; only a
    real, under-quota address is mailed. `floorMs` pads the response to a constant floor so the
    SMTP send (which happens only for real accounts) can't be timed into an existence oracle. */
export async function requestReset(store, transport, { form = {}, ip = 'unknown', nowS, key, appName, resetUrlBase, floorMs = 0 } = {}) {
  const email = String(form.email || '').trim().toLowerCase().slice(0, 254); // bound the rate-limit key (DynamoDB pk cap)
  const work = (async () => {
    const ipHits = await store.rateHit(`ip:${ip}`, `reset:${hourWindow(nowS)}`, nowS + 3600);
    const emailHits = await store.rateHit(`email:${email}`, `reset:${hourWindow(nowS)}`, nowS + 3600);
    const user = EMAIL_RE.test(email) ? await store.userByEmail(email) : null;
    if (user && ipHits <= 15 && emailHits <= 5) {
      const raw = newSessionToken();
      await store.putToken(hashToken(raw), { uid: user.id, purpose: 'reset', expiresAt: nowS + RESET_TTL }, nowS + RESET_TTL);
      // swallow a send failure: a 500 here (only real accounts send) would turn a
      // transient SMTP error into the very existence oracle the constant reply closes.
      await emailer(transport, { appName }).sendPasswordReset({ to: email, displayName: user.displayName, resetUrl: `${resetUrlBase}?token=${encodeURIComponent(raw)}` }).catch(() => {});
    }
  })();
  await Promise.all([work, sleep(floorMs)]);
  return { status: 200, notice: 'reset-sent' };
}

/** Complete a reset: consume the single-use token, set the new password, drop every existing
    session (a reset logs the account out everywhere), and sign in fresh unless the account is
    banned (then the password changes but no session is minted). */
export async function performReset(store, { form = {}, nowS, nowIso, key, hasher = SCRYPT } = {}) {
  const token = String(form.token || '');
  const password = String(form.password || '');
  if (password.length < 10) return err(400, 'A password needs at least 10 characters.');
  if (password.length > 1024) return err(400, 'That password is too long.'); // bound the hash input
  const data = token ? await store.consumeToken(hashToken(token)) : null;
  if (!data || data.purpose !== 'reset' || (typeof data.expiresAt === 'number' && nowS >= data.expiresAt)) {
    return err(400, 'This reset link is invalid, already used, or expired. Please request a new one.');
  }
  const user = await store.getUser(data.uid);
  // the account can be gone by now (a GDPR erasure between request and click);
  // the token is spent either way, so answer like any dead link
  if (!user) return err(400, 'This reset link is invalid, already used, or expired. Please request a new one.');
  // completing a reset proves control of the email, same as clicking verify;
  // stamp it (first proof only), or an unverified account resets its way into
  // a session it can never log back into
  await store.setUser(data.uid, {
    passwordHash: await hasher.hash(password),
    ...(user.verifiedAt ? {} : { verifiedAt: nowIso }),
  });
  await store.revokeSessions(data.uid, nowS);
  if (activeBan(await store.bans(user.id), nowIso)) return redirect('/login'); // password changed, but a ban blocks sign-in
  const jwt = signJwt({ sub: user.id, role: user.role }, key, { now: nowS });
  return redirect('/', { setSession: jwt, notice: 'password-changed' });
}
