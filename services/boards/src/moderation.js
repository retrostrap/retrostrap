// moderation.js, the Boards permission model and the moderation moves (docs/11 §8).
// Ranks (ranks.js) are cosmetic; only roles confer power. Everything here is pure: it
// decides who may do what and computes the next state, so the request layer just checks,
// applies, and logs. Dates are passed in so the logic stays testable (ISO 8601 compares
// with <). A reason string is mandatory on every removal or ban, the transparency promise.

const ROLES = { member: 0, sysop: 1, webmaster: 2 };
const rank = (role) => ROLES[role] ?? 0; // unknown role → member, i.e. fail closed

// action -> the minimum role that may perform it
const PERMS = {
  lock: 'sysop', unlock: 'sysop', pin: 'sysop', unpin: 'sysop', move: 'sysop',
  softDelete: 'sysop', approve: 'sysop',    // approve = release a first post from the queue
  report: 'member',                          // anyone can report
  resolveReport: 'sysop', dismissReport: 'sysop',
  ban: 'sysop', liftBan: 'sysop',            // but a permanent ban is webmaster-only (canBan)
};

/** Can `role` perform `action`? (Ban level is gated separately by canBan.) */
export function can(role, action) {
  // Object.hasOwn, so a crafted action like "__proto__"/"constructor" is "unknown", not a hit
  const need = Object.hasOwn(PERMS, action) ? PERMS[action] : null;
  return need !== null && rank(role) >= rank(need);
}

/** Does `actorRole` sit strictly above `targetRole`? A mod may only act on someone below them,
    so a sysop can't ban a fellow sysop or the webmaster (and no one bans a peer). */
export function outranks(actorRole, targetRole) {
  return rank(actorRole) > rank(targetRole);
}

export const BAN_LADDER = ['note', '24h', '7d', 'permanent'];
const BAN_MS = { '24h': 24 * 3600e3, '7d': 7 * 24 * 3600e3 }; // note/permanent have no expiry

/** The next rung up for a user at `current` level (spam skips the ladder, that's the caller's call). */
export function nextBanLevel(current) {
  const i = BAN_LADDER.indexOf(current);
  return i < 0 ? 'note' : BAN_LADDER[Math.min(i + 1, BAN_LADDER.length - 1)];
}

/** Who may issue a ban at `level`? Permanent is webmaster-only (docs/11 §8). */
export function canBan(role, level) {
  if (!can(role, 'ban') || !BAN_LADDER.includes(level)) return false;
  return level === 'permanent' ? rank(role) >= rank('webmaster') : true;
}

/** Build a ban record (pure). Throws if the actor may not issue this level or the reason is empty. */
export function issueBan(userId, { level, reason, by, role, at } = {}) {
  if (!canBan(role, level)) throw new Error(`${role} cannot issue a ${level} ban`);
  const why = String(reason || '').trim();
  if (!why) throw new Error('a ban needs a reason');
  const now = at || new Date().toISOString();
  const ms = BAN_MS[level];
  const expiresAt = ms ? new Date(new Date(now).getTime() + ms).toISOString() : null;
  return { userId, level, reason: why, issuedBy: by ?? null, createdAt: now, expiresAt, liftedAt: null };
}

/** Is a ban blocking as of nowISO? A note is a warning and never blocks; lifted/expired don't. */
export function banIsActive(ban, nowISO) {
  if (!ban || ban.liftedAt || ban.level === 'note') return false;
  if (ban.level === 'permanent') return true;
  return !!ban.expiresAt && ban.expiresAt > nowISO;
}

/** The strongest ban blocking a user as of nowISO, or null. Enforcement must weigh EVERY ban, not
    just the newest one: a note or a 24h added on top of a permanent ban would otherwise be "newest"
    and silently shadow it. Permanent outranks any timed ban; among timed bans the latest expiry wins
    (that's whose reason we show). */
export function activeBan(bans, nowISO) {
  const blocking = (bans || []).filter((b) => banIsActive(b, nowISO));
  if (!blocking.length) return null;
  const weight = (b) => (b.level === 'permanent' ? Infinity : Date.parse(b.expiresAt) || 0);
  return blocking.reduce((strongest, b) => (weight(b) > weight(strongest) ? b : strongest));
}

/** Soft-delete a post: a public tombstone, never a hard delete (the renderer hides the body). */
export function softDeletePost(post, { reason, by, role, at } = {}) {
  if (!can(role, 'softDelete')) throw new Error('softDelete needs a sysop');
  const why = String(reason || '').trim();
  if (!why) throw new Error('a removal needs a reason');
  return { ...post, deletedAt: at || new Date().toISOString(), deletedBy: by ?? null, deleteReason: why };
}

const FLAGS = { lock: { isLocked: true }, unlock: { isLocked: false }, pin: { isPinned: true }, unpin: { isPinned: false } };
/** Apply a thread flag move (lock/unlock/pin/unpin). Pure. */
export function setThreadFlag(thread, action, { role } = {}) {
  const f = Object.hasOwn(FLAGS, action) ? FLAGS[action] : null;
  if (!f) throw new Error(`not a thread flag: ${action}`);
  if (!can(role, action)) throw new Error(`${action} needs a sysop`);
  return { ...thread, ...f };
}

/** A private mod-log entry (who/what/why/when) for any action (docs/11 §8). */
export function logEntry({ action, by, target, reason, at } = {}) {
  return { action, by: by ?? null, target: target ?? null, reason: reason ? String(reason).trim() : null, at: at || new Date().toISOString() };
}

/** Open reports oldest-first for the /mod/queue (pure query). */
export const openReports = (reports) =>
  (reports || []).filter((r) => r && r.status === 'open').sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
