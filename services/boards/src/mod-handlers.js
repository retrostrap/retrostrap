// mod-handlers.js, the moderation moves as pure orchestration over the store and the pure
// permission model (moderation.js). Moderation is in the MVP: a forum without it is a spam
// trough. Every state change is checked, applied, and written to the mod-log with a mandatory
// reason on any removal or ban (the transparency promise, docs/11 §8). The actor `user` is a
// per-request re-read of the user item (role from the record, never from the token). `now` is
// an ISO stamp, `nowS` unix seconds (for session revocation), `newId` mints the mod-log key.
import { can, canBan, outranks, issueBan, softDeletePost, logEntry, activeBan } from './moderation.js';

const err = (status, error) => ({ status, error });
const redirect = (to, extra = {}) => ({ status: 303, redirect: to, ...extra });

const FLAG_PATCH = { lock: { isLocked: true }, unlock: { isLocked: false }, pin: { isPinned: true }, unpin: { isPinned: false } };

// The store keys the mod-log by `${at}#${id}`; logEntry() has no id, so the handler owns it.
const logItem = (fields, newId) => ({ ...logEntry(fields), id: newId() });

/** Lock / unlock / pin / unpin a thread. */
export async function flagThread(store, { threadId, action, user, now, newId } = {}) {
  if (!user || !Object.hasOwn(FLAG_PATCH, action) || !can(user.role, action)) return err(403, 'You cannot do that.');
  const thread = await store.getThread(threadId);
  if (!thread) return err(404, 'No such thread.');
  const patch = { ...FLAG_PATCH[action] };
  if (action === 'pin' || action === 'unpin') patch.lastPostAt = thread.lastPostAt; // both feed the gsi key
  await store.setThread(threadId, patch);
  await store.log(logItem({ action, by: user.id, target: threadId, reason: `${action} thread`, at: now }, newId));
  return redirect(`/threads/${threadId}`);
}

/** Move a thread to another board (one gsi re-pointer, since threads are keyed by their own id). */
export async function moveThread(store, { threadId, toSlug, user, now, newId } = {}) {
  if (!user || !can(user.role, 'move')) return err(403, 'You cannot do that.');
  const thread = await store.getThread(threadId);
  if (!thread) return err(404, 'No such thread.');
  const board = await store.boardBySlug(toSlug);
  if (!board) return err(404, 'No such board.');
  await store.moveThread(threadId, board.id, {
    fromBoardId: thread.boardId,
    replyCount: thread.replyCount || 0,
    counted: thread.isApproved !== false, // a held thread never counted anywhere yet
  });
  await store.log(logItem({ action: 'move', by: user.id, target: threadId, reason: `to ${board.id}`, at: now }, newId));
  return redirect(`/threads/${threadId}`, { notice: 'moved' });
}

/** Soft-delete a post: a tombstone with a mandatory reason. The body is kept, never shown. */
export async function deletePost(store, { threadId, seq, user, reason, now, newId } = {}) {
  if (!user || !can(user.role, 'softDelete')) return err(403, 'You cannot do that.');
  const why = String(reason || '').trim();
  if (!why) return err(400, 'A removal needs a reason.');
  const post = await store.getPost(threadId, seq);
  if (!post) return err(404, 'No such post.');
  const tomb = softDeletePost(post, { reason: why, by: user.id, role: user.role, at: now });
  await store.tombstonePost(threadId, seq, { deletedAt: tomb.deletedAt, deletedBy: tomb.deletedBy, deleteReason: tomb.deleteReason });
  if (post.isApproved === false) await store.approveFirstPost(`${threadId}.${seq}`); // a removed held post leaves the queue
  await store.log(logItem({ action: 'softDelete', by: user.id, target: `${threadId}.${seq}`, reason: why, at: now }, newId));
  return redirect(`/threads/${threadId}`, { notice: 'removed' });
}

/** Release a newcomer's held first post: mark it approved and clear it from the queue. */
export async function approvePost(store, { threadId, seq, user, now, newId } = {}) {
  if (!user || !can(user.role, 'approve')) return err(403, 'You cannot do that.');
  const post = await store.getPost(threadId, seq);
  if (!post) return err(404, 'No such post.');
  // Idempotent, and never republish a removed post: only a still-held, live post releases.
  if (post.isApproved !== false || post.deletedAt) return redirect(`/threads/${threadId}`);
  const thread = await store.getThread(threadId);
  const author = post.authorId ? await store.getUser(post.authorId) : null;
  await store.releaseHeldPost(threadId, seq, {
    at: post.createdAt, authorId: post.authorId, isPinned: !!(thread && thread.isPinned),
    boardId: thread && thread.boardId, postedBy: author ? author.displayName : undefined,
  });
  if (post.authorId) await store.setUser(post.authorId, { vouchedAt: now }); // vouch: this member now posts freely
  await store.approveFirstPost(`${threadId}.${seq}`);                        // deterministic sk, no scan
  await store.log(logItem({ action: 'approve', by: user.id, target: `${threadId}.${seq}`, reason: 'first post approved', at: now }, newId));
  return redirect(`/threads/${threadId}`, { notice: 'approved' });
}

/** A member reports a post into the queue (reports dedup per post in the store). */
export async function reportPost(store, { threadId, seq, user, reason, now, nowS, ip = 'unknown' } = {}) {
  if (!user || !can(user.role, 'report')) return err(403, 'Log in to report.');
  const post = await store.getPost(threadId, seq); // don't queue reports for posts that don't exist
  if (!post) return err(404, 'No such post.');
  // cap reporting so one member can't flood the mod queue with junk (docs/11 §8)
  if (typeof nowS === 'number' && (await store.rateHit(`report:${user.id}`, String(Math.floor(nowS / 3600)), nowS + 3600)) > 20) {
    return err(429, 'You have reported a lot lately. Please slow down.');
  }
  await store.report(`${threadId}.${seq}`, { reporterId: user.id, reason: String(reason || '').trim() || 'no reason given', at: now });
  return redirect(`/threads/${threadId}`, { notice: 'reported' });
}

/** Resolve or dismiss an open report. */
export async function resolveReport(store, { postRef, action = 'resolve', user, now, newId } = {}) {
  if (!user || !can(user.role, 'resolveReport')) return err(403, 'You cannot do that.');
  const dismissed = action === 'dismiss';
  await store.resolveReport(postRef, { status: dismissed ? 'dismissed' : 'resolved', by: user.id, at: now });
  await store.log(logItem({ action: dismissed ? 'dismissReport' : 'resolveReport', by: user.id, target: postRef, reason: null, at: now }, newId));
  return redirect('/', { notice: 'resolved' }); // to the index; the /mod/queue page is a fast-follow
}

/** Ban a user up the ladder. Permanent is webmaster-only (canBan); a mod can't ban a peer or
    superior (outranks). A blocking ban revokes the target's sessions so it bites immediately. */
export async function banUser(store, { targetId, level, reason, user, now, nowS, newId } = {}) {
  if (!user || !canBan(user.role, level)) return err(403, 'You cannot issue that ban.');
  const why = String(reason || '').trim();
  if (!why) return err(400, 'A ban needs a reason.');
  const target = await store.getUser(targetId);
  if (!target) return err(404, 'No such user.');
  if (!outranks(user.role, target.role)) return err(403, 'You cannot ban someone at or above your own role.');
  let ban;
  try { ban = issueBan(targetId, { level, reason: why, by: user.id, role: user.role, at: now }); }
  catch { return err(403, 'You cannot issue that ban.'); }
  await store.putBan(ban, logItem({ action: 'ban', by: user.id, target: targetId, reason: why, at: now }, newId));
  if (level !== 'note') await store.revokeSessions(targetId, nowS); // a warning doesn't log them out
  return redirect('/', { notice: 'banned' }); // to the index; member profile pages are a fast-follow
}

/** Lift the newest ban on a user. */
export async function liftBan(store, { targetId, user, now, newId } = {}) {
  if (!user || !can(user.role, 'liftBan')) return err(403, 'You cannot do that.');
  const target = await store.getUser(targetId);
  if (!target) return err(404, 'No such user.');
  // Lift the ban actually in force, not merely the newest record: a note logged after a permanent
  // ban must not be what "lift" removes (it would leave the real one standing). With nothing in
  // force, fall back to the newest record so a stray note or spent ban can still be retracted.
  const all = await store.bans(targetId);
  const ban = activeBan(all, now) || all[0] || null;
  if (!ban) return err(404, 'That user has no ban to lift.');
  // Lifting a ban needs the same authority as issuing it: a permanent ban is webmaster-only, so a
  // sysop can't undo one (the ladder was asymmetric before this).
  if (!canBan(user.role, ban.level)) return err(403, 'Lifting that ban is above your role.');
  await store.liftBan(targetId, ban.createdAt, now);
  await store.log(logItem({ action: 'liftBan', by: user.id, target: targetId, reason: null, at: now }, newId));
  return redirect('/', { notice: 'ban-lifted' }); // to the index; member profile pages are a fast-follow
}
