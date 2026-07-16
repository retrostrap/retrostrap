// write-handlers.js, the posting flow as pure functions over the store + the tested logic
// (bbcode.js renders on write, the XSS boundary). Each returns a descriptor the request
// layer maps: { status: 303, redirect } on success, { status, error } on a bad request.
// `now` and `id` are injected so the tests don't chase the clock or a random id; app.js
// passes a real timestamp and uuid and enforces auth + CSRF before calling; posting rate is
// capped here.
import { bbcodeToHtml } from './bbcode.js';

const clean = (s) => String(s ?? '').trim();
const err = (status, error) => ({ status, error });
const redirect = (to) => ({ status: 303, redirect: to });
const MAX = 30000; // a post body cap
// A plain member's posts wait behind moderation until a sysop approves one of them (which
// vouches the account); staff and vouched members post straight through. Holds every post,
// not just the literal first, so a throwaway post can't buy a spammer a free pass.
const heldFor = (user) => user.role === 'member' && !user.vouchedAt;

// Cap posting so a flood (or a spammer's held posts) can't reorder the boards or inflate the
// approval queue: 30/hour per member, 60/hour per IP. A self-expiring token bucket, like reports.
async function tooFast(store, user, nowS, ip = 'unknown') {
  if (typeof nowS !== 'number') return false;
  const win = String(Math.floor(nowS / 3600));
  return (await store.rateHit(`post:${user.id}`, win, nowS + 3600)) > 30
      || (await store.rateHit(`post:ip:${ip}`, win, nowS + 3600)) > 60;
}

function validateBody(body) {
  const b = clean(body);
  if (!b) return { error: 'Say something first.' };
  if (b.length > MAX) return { error: 'That post is longer than the board allows.' };
  return { b };
}

/** Open a new thread: its title and first post. */
export async function newThread(store, { boardSlug, user, title, body, now, id, nowS, ip } = {}) {
  if (!user) return err(403, 'Log in to start a thread.');
  if (await tooFast(store, user, nowS, ip)) return err(429, 'You are posting very fast. Take a short breather.');
  const board = await store.boardBySlug(boardSlug);
  if (!board) return err(404, 'No such board.');
  const t = clean(title);
  if (t.length < 3 || t.length > 90) return err(400, 'A title is between 3 and 90 characters.');
  const { b, error } = validateBody(body);
  if (error) return err(400, error);
  const held = heldFor(user);
  const thread = { id, boardId: board.id, title: t, authorId: user.id, createdAt: now, lastPostAt: now };
  const firstPost = { authorId: user.id, bodyBbcode: b, bodyHtml: bbcodeToHtml(b), createdAt: now, isApproved: !held };
  await store.createThread(thread, firstPost, { postedBy: user.displayName });
  if (held) await store.queueFirstPost(`${id}.1`, { threadId: id, seq: 1, authorId: user.id, at: now });
  return redirect(`/threads/${id}`);
}

/** Reply to a thread. Refuses a locked thread; renders BBCode on write. */
export async function postReply(store, { threadId, user, body, now, nowS, ip } = {}) {
  if (!user) return err(403, 'Log in to reply.');
  if (await tooFast(store, user, nowS, ip)) return err(429, 'You are posting very fast. Take a short breather.');
  const thread = await store.getThread(threadId);
  if (!thread) return err(404, 'No such thread.');
  if (thread.isLocked) return err(403, 'This thread is locked.');
  const { b, error } = validateBody(body);
  if (error) return err(400, error);
  const held = heldFor(user);
  const post = { authorId: user.id, bodyBbcode: b, bodyHtml: bbcodeToHtml(b), createdAt: now, isApproved: !held };
  const { seq } = await store.addPost(threadId, post, thread.isPinned, held, { boardId: thread.boardId, postedBy: user.displayName });
  if (held) await store.queueFirstPost(`${threadId}.${seq}`, { threadId, seq, authorId: user.id, at: now });
  return redirect(`/threads/${threadId}?page=${Math.ceil(seq / 20)}#post-${seq}`);
}
