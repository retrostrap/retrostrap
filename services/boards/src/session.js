// session.js, signed sessions for a stateless forum (docs/11 §6, infra/README.md). No session
// table: a login mints an HS256 JWT (HMAC-SHA256 via node:crypto, zero deps), and every
// authenticated request verifies the signature. Revocation is a `sessionsValidAfter`
// timestamp on the user item, not stored here: the request layer GetItems the user and
// checks `payload.iat >= user.sessionsValidAfter` (and re-reads `role`, never trusts the
// token's). `now` is injectable so the tests don't chase the clock.
import { createHmac, timingSafeEqual } from 'node:crypto';

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const b64uJson = (obj) => b64u(JSON.stringify(obj));
const unb64uJson = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
const mac = (data, key) => createHmac('sha256', key).update(data).digest();
const eq = (a, b) => a.length === b.length && timingSafeEqual(a, b);
const nowS = () => Math.floor(Date.now() / 1000);

/** Sign a session JWT. The payload gets `iat` + `exp` stamped. */
export function signJwt(payload, key, { expiresIn = 30 * 24 * 3600, now = nowS() } = {}) {
  const head = b64uJson({ alg: 'HS256', typ: 'JWT' });
  const body = b64uJson({ ...payload, iat: now, exp: now + expiresIn });
  const data = `${head}.${body}`;
  return `${data}.${b64u(mac(data, key))}`;
}

/** Verify + decode a JWT. Returns the payload, or null on any tamper, bad format, or expiry. */
export function verifyJwt(token, key, { now = nowS() } = {}) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const data = `${parts[0]}.${parts[1]}`;
  let got;
  try { got = Buffer.from(parts[2], 'base64url'); } catch { return null; }
  if (!eq(got, mac(data, key))) return null;
  let payload;
  try { payload = unb64uJson(parts[1]); } catch { return null; }
  if (typeof payload.exp === 'number' && now >= payload.exp) return null;
  return payload;
}

/** Sign a short-lived opaque value so the stateless Lambda can trust what it handed the
    client and got back: the registration minimum-time token and the "which quiz question
    did we ask" state (docs/11 §6: a stateless server must not trust either from the form). */
export function signValue(value, key, { expiresIn = 3600, now = nowS() } = {}) {
  const body = b64uJson({ v: value, exp: now + expiresIn });
  return `${body}.${b64u(mac(body, key))}`;
}
export function verifyValue(token, key, { now = nowS() } = {}) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  let got;
  try { got = Buffer.from(sig, 'base64url'); } catch { return null; }
  if (!eq(got, mac(body, key))) return null;
  let parsed;
  try { parsed = unb64uJson(body); } catch { return null; }
  if (typeof parsed.exp === 'number' && now >= parsed.exp) return null;
  return parsed.v;
}
