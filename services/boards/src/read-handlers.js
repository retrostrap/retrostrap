// read-handlers.js, the Boards' public read path as pure functions over the store, so
// the browsing experience tests at the repo root with no hono and no AWS. Each returns a
// { status, html } descriptor; app.js maps it to a hono Response. Reads never mutate, so
// these sit behind CloudFront with a short TTL (anonymous requests) per infra/README.md.
import { boardIndexView, threadListView, threadView, layout, html, toHtml } from './views.js';
import { signValue, verifyValue } from './session.js';

// The store's pagination cursor is opaque (an sk string here, a DynamoDB key in prod). SIGN it
// (HMAC via signValue) so a tampered `?after=` can't be fed to DynamoDB as a raw ExclusiveStartKey
// (which would 500 as a ValidationException); a bad cursor just verifies to nothing -> first page.
export const encCursor = (c, key) => (c == null ? null : signValue(c, key, { expiresIn: 86400 }));
export const decCursor = (s, key) => {
  if (!s) return undefined;
  const v = verifyValue(s, key);
  return v == null ? undefined : v;
};

const ok = (view) => ({ status: 200, html: toHtml(view) });
const notFound = (msg) => ({ status: 404, html: toHtml(layout({ title: 'Not found', body: html`<p class="rs-alert rs-alert--error">${msg}</p><p><a href="/">Back to the board index</a>.</p>` })) });

/** The board index: the front page's list of boards, with their stats. */
export async function indexPage(store, { user, notice, csrf } = {}) {
  const boards = await store.listBoards({ withStats: true });
  return ok(layout({ title: 'Boards', user, body: boardIndexView({ boards, notice }), path: '/', csrf }));
}

/** A board: its threads, pinned-first then most-recently-bumped, cursor-paginated (signed cursor). */
export async function boardPage(store, { slug, after, user, key, csrf } = {}) {
  const board = await store.boardBySlug(slug);
  if (!board) return notFound('No such board.');
  const { items, cursor } = await store.listThreads(board.id, { after: decCursor(after, key) });
  const canModerate = user && (user.role === 'sysop' || user.role === 'webmaster');
  // a thread whose opening post is still held stays off the public list, its title included
  const threads = items.filter((t) => t.isApproved !== false || canModerate || (!!user && t.authorId === user.id));
  const body = threadListView({ board, threads, nextCursor: encCursor(cursor, key), user });
  return ok(layout({ title: board.name, user, board, body, description: board.description, path: `/boards/${board.slug}`, csrf }));
}

/** A thread: one page of its posts, each author's rank read live. */
export async function threadPage(store, { threadId, page = 1, user, csrf = '', notice } = {}) {
  const thread = await store.getThread(threadId);
  if (!thread) return notFound('No such thread.');
  // A held post (a newcomer's, pending approval) shows only to its author and the mods, flagged;
  // a held OP makes the whole thread invisible to everyone else, title and all, until released.
  const canModerate = user && (user.role === 'sysop' || user.role === 'webmaster');
  if (thread.isApproved === false && !canModerate && !(user && thread.authorId === user.id)) return notFound('No such thread.');
  const pg = Math.max(1, Math.floor(Number(page)) || 1);
  const board = (await store.listBoards()).find((b) => b.id === thread.boardId) || { slug: '', name: '(unknown)' };
  const { items, hasMore } = await store.listPosts(threadId, { page: pg, perPage: 20 });
  const authors = await loadAuthors(store, items);
  // an erased author reads as Guest, and as Gast at the German table (docs/11 §5)
  const guest = board.lang === 'de' ? 'Gast' : 'Guest';
  const posts = items
    .filter((p) => p.isApproved !== false || canModerate || (!!user && p.authorId === user.id))
    .map((p) => ({
      ...p,
      authorName: authors[p.authorId]?.displayName || guest,
      authorRole: authors[p.authorId]?.role,
      authorPostCount: authors[p.authorId]?.postCount,
      awaitingApproval: p.isApproved === false && !p.deletedAt,
    }));
  const body = threadView({ board, thread, posts, page: pg, hasMore, user, csrf, notice });
  return ok(layout({ title: thread.title, user, board, body, description: `${thread.title} - a discussion on the Retrostrap Boards.`, path: `/threads/${thread.id}`, csrf }));
}

async function loadAuthors(store, posts) {
  const ids = [...new Set(posts.map((p) => p.authorId).filter(Boolean))];
  const map = {};
  await Promise.all(ids.map(async (id) => { map[id] = await store.getUser(id); }));
  return map;
}
