// auth.js, password hashing and session tokens (docs/11 §6). This uses Node's
// built-in scrypt so the services package can be tested with zero dependencies.
// Production should swap `hashPassword`/`verifyPassword` for argon2id (the
// interface stays identical, a string in, a self-describing string out); the
// docs specify argon2id (OWASP baseline) and this is the drop-in seam for it.
import { randomBytes, scryptSync, timingSafeEqual, createHash } from 'node:crypto';

const N = 65536; // scrypt cost (2^16); production swaps in argon2id (docs/11)
const KEYLEN = 32;
// A ceiling for scrypt's memory: gives the cost above room to run, and stops a
// malformed stored N from demanding the moon (it throws, and we fail closed).
const MAXMEM = 128 * 1024 * 1024;

/** Hash a password into a self-describing string: scrypt$N$salt$hash. */
export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, { N, maxmem: MAXMEM });
  return `scrypt$${N}$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/** Verify a password against a stored hash, in constant time. Any malformed or
    truncated hash verifies NOTHING, it never throws and never accepts. */
export function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || typeof password !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 4 || parts[0] !== 'scrypt') return false;
  const n = Number(parts[1]);
  if (!Number.isInteger(n) || n < 2 || n > 1048576) return false; // sane cost bounds
  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[2], 'hex');
    expected = Buffer.from(parts[3], 'hex');
  } catch {
    return false;
  }
  // an empty salt or hash must never verify, otherwise any password would
  if (salt.length === 0 || expected.length === 0) return false;
  let actual;
  try {
    actual = scryptSync(password, salt, expected.length, { N: n, maxmem: MAXMEM });
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/** A fresh 256-bit session token (the value handed to the browser cookie). */
export function newSessionToken() {
  return randomBytes(32).toString('base64url');
}

/** What we actually store: the sha256 of the token, never the token itself. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** A CSRF token for the session. */
export function newCsrfToken() {
  return randomBytes(24).toString('base64url');
}
