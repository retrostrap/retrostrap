// auth-argon2.js, the production password hasher: argon2id at the OWASP baseline (docs/11 §6:
// 19 MiB, t=2, p=1). It imports the native @node-rs/argon2, so it is wired in ONLY at the Lambda
// entry (handler.js), never at the repo root, keeping the tested core + CI free of a native dep.
// `verify` dispatches on the stored hash's scheme, so accounts created under the old scrypt hash
// still log in (and get re-hashed to argon2 on their next password change). The interface matches
// auth.js's scrypt hasher exactly (async hash(pw) -> string, verify(pw, stored) -> bool), so the
// request handlers are hasher-agnostic and are tested against scrypt.
import { hash as argon2Hash, verify as argon2Verify, Algorithm } from '@node-rs/argon2';
import { verifyPassword as scryptVerify } from './auth.js';

const OPTS = { memoryCost: 19456, timeCost: 2, parallelism: 1, algorithm: Algorithm.Argon2id };

export const argon2Hasher = {
  hash: (password) => argon2Hash(String(password), OPTS),
  async verify(password, stored) {
    if (typeof stored !== 'string') return false;
    if (stored.startsWith('$argon2')) {
      try { return await argon2Verify(stored, String(password)); } catch { return false; }
    }
    return scryptVerify(password, stored); // legacy scrypt hash: fail-closed, constant-time (auth.js)
  },
};
