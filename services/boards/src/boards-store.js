// boards-store.js, the Boards persisted on the one shared DynamoDB table (infra/README.md).
// Pure logic over an injected `ops` interface, so it tests at the repo root with no
// AWS SDK, the same shape as homepage-services/dynamo-store.js. `ops-dynamo.js` binds
// `ops` to the real table; `mem-ops.js` gives an in-memory one for the tests.
//
// The domain records (ids, timestamps, hashes, rendered HTML) are built by the caller
// (the request layer, using auth.js / bbcode.js / moderation.js) and handed in whole;
// this file owns only storage: keys, uniqueness, atomic counters, transactions, queries.
//
// ── Single-table design (pk/sk, one sparse GSI `gsi1`) ─────────────────────────────
// Item              pk                       sk                     notes
// User              user#<id>                profile                display_name, email, password_hash,
//                                                                   role, post_count, sig…, sessionsValidAfter
// Name → id         name#<lower(name)>       -                      display-name uniqueness (conditional)
// Email → id        email#<lower(email)>     -                      login lookup + uniqueness (conditional)
// Board             board                    <pos2>#<id>            query pk=board = the ordered board list
// Board stats       board#<boardId>          stats                  threadCount, postCount, lastPostAt/By,
//                                                                   bumped in the same tx as the post that causes them
// Thread            board#<boardId>          thread#<id>            gsi1pk=board#<boardId>, gsi1sk=<9|1>#<lastPostAt>
// Post              thread#<threadId>        post#<seq10>           seq from the thread's atomic post_seq (page-N linkable)
// Post revision     thread#<threadId>        rev#<seq10>#<ts>       edit history, kept forever
// Report            queue#reports            <postId>              one open item per post (dedup); reporters[] accrue
// First-post queue  queue#approval           <postId>             releases via approve (sk = threadId.seq)
// Ban               user#<id>                ban#<ts>              newest ban = query desc limit 1
// Mod-log           modlog#<yyyymm>          <ts>#<id>             private, sysop-visible
// Rate token        rl#<who>#<window>        -                      atomic ADD + TTL, self-expiring
// Setting           settings                 <key>                 rate limits, motd (quiz pool is in quiz.js)
// Token             token#<hash>             -                      email verify / password reset, single-use, TTL
//
// Sessions are signed JWTs, NOT stored. Revocation (password reset, ban, erasure) bumps
// `sessionsValidAfter` on the user item; every authenticated request GetItems the user and
// checks the token's `iat >= sessionsValidAfter` (and re-reads `role`, never the JWT's).
//
// GSI `gsi1` exists so a reply can bump a thread to the top of its board: the thread's
// sort key `thread#<id>` is immutable, but `gsi1sk` is rewritten on every reply. A query of
// gsi1pk=board#<boardId>, ScanIndexForward:false yields pinned-first (prefix 9 > 1) then
// most-recent-first, which is exactly the board index order the board view wants.

const SEQ = (n) => String(n).padStart(10, '0');            // post sequence → sortable/linkable
const POS = (n) => String(n).padStart(2, '0');             // board position
const gsiSk = (isPinned, lastPostAt) => `${isPinned ? '9' : '1'}#${lastPostAt}`;
const lower = (s) => String(s || '').toLowerCase();
// the board-index columns (threads/posts/last post) live on one stats item per
// board, written in the same transaction as the post that changes them
const statsBump = (boardId, { newThread = false, at, by } = {}) => ({
  type: 'update', pk: `board#${boardId}`, sk: 'stats',
  add: { postCount: 1, ...(newThread ? { threadCount: 1 } : {}) },
  set: { lastPostAt: at, ...(by ? { lastPostBy: by } : {}) },
});

/** A ConflictError is thrown by `ops.putNew`/`ops.transact` when a uniqueness or
    optimistic condition fails. Callers turn it into "name taken" / "try again". */
export class ConflictError extends Error { constructor(m = 'conflict') { super(m); this.name = 'ConflictError'; } }

export function boardsStore(ops) {
  return {
    // ── users ──────────────────────────────────────────────────────────────────
    /** Register: user + name# + email# uniqueness in one transaction, so a taken
        name or email fails the whole thing (no half-created user). */
    async createUser(user) {
      const items = [
        { type: 'put', item: { pk: `user#${user.id}`, sk: 'profile', ...user } },
        { type: 'putNew', item: { pk: `name#${lower(user.displayName)}`, sk: '-', userId: user.id } },
      ];
      if (user.email) items.push({ type: 'putNew', item: { pk: `email#${lower(user.email)}`, sk: '-', userId: user.id } });
      await ops.transact(items); // throws ConflictError if name/email is taken
      return user;
    },
    getUser: (id) => ops.get(`user#${id}`, 'profile'),
    async userByEmail(email) {
      const p = await ops.get(`email#${lower(email)}`, '-');
      return p ? ops.get(`user#${p.userId}`, 'profile') : null;
    },
    async userByName(name) {
      const p = await ops.get(`name#${lower(name)}`, '-');
      return p ? ops.get(`user#${p.userId}`, 'profile') : null;
    },
    setUser: (id, patch) => ops.update(`user#${id}`, 'profile', { set: patch }),
    /** Invalidate every existing session for a user (reset / ban / erasure). */
    revokeSessions: (id, epoch) => ops.update(`user#${id}`, 'profile', { set: { sessionsValidAfter: epoch } }),

    // ── boards (few, static-ish) ────────────────────────────────────────────────
    putBoard: (board) => ops.put({ pk: 'board', sk: `${POS(board.position)}#${board.id}`, ...board }),
    async listBoards({ withStats = false } = {}) {
      const boards = (await ops.query('board', { forward: true, limit: 100 })).items;
      if (!withStats) return boards;
      const stats = await Promise.all(boards.map((b) => ops.get(`board#${b.id}`, 'stats')));
      return boards.map((b, i) => {
        const { pk, sk, ...s } = stats[i] || {}; // the stats item's keys must not shadow the board row's
        return { threadCount: 0, postCount: 0, ...b, ...s };
      });
    },
    async boardBySlug(slug) { return (await this.listBoards()).find((b) => b.slug === slug) || null; },

    // ── threads (meta + posts share the thread#<id> partition; gsi1 is the board list) ──
    /** Open a thread and its first post atomically. The thread meta lives at
        thread#<id>/meta beside its posts, so getThread needs only the id; gsi1pk carries
        board membership so the board index (below) queries the index, not a scan. */
    async createThread(thread, firstPost, { postedBy } = {}) {
      const held = firstPost.isApproved === false;
      const t = { ...thread, replyCount: 0, postSeq: 1, isPinned: !!thread.isPinned, isLocked: false, isApproved: !held };
      const tx = [
        { type: 'putNew', item: {
          pk: `thread#${t.id}`, sk: 'meta', ...t,
          gsi1pk: `board#${t.boardId}`, gsi1sk: gsiSk(t.isPinned, t.lastPostAt),
        } },
        { type: 'putNew', item: { pk: `thread#${t.id}`, sk: `post#${SEQ(1)}`, seq: 1, ...firstPost } },
      ];
      // a held opening post counts for nothing until approved (releaseHeldPost adds it back)
      if (!held) {
        tx.push({ type: 'update', pk: `user#${firstPost.authorId}`, sk: 'profile', add: { postCount: 1 } });
        tx.push(statsBump(t.boardId, { newThread: true, at: t.lastPostAt, by: postedBy }));
      }
      await ops.transact(tx);
      return { ...t, firstPost: { ...firstPost, seq: 1 } };
    },
    getThread: (threadId) => ops.get(`thread#${threadId}`, 'meta'),
    /** Board index: pinned first, then most-recently-bumped, paginated. Uses gsi1. */
    listThreads: (boardId, { limit = 20, after } = {}) =>
      ops.queryIndex(`board#${boardId}`, { forward: false, limit, after }),
    setThread(threadId, patch) {
      const set = { ...patch };
      // Pin/lastPostAt both feed the gsi sort key, and this doesn't read first: pass BOTH
      // together (pinning? include the thread's current lastPostAt) or the key half-forms.
      if ('isPinned' in patch || 'lastPostAt' in patch) set.gsi1sk = gsiSk(patch.isPinned, patch.lastPostAt);
      return ops.update(`thread#${threadId}`, 'meta', { set });
    },
    /** Move a thread to another board (docs/11 §8). Because the thread is keyed by its own
        id, this is a single re-pointer on the gsi, no pk rewrite and no double-listing. The
        board stats move with it (a held thread was never counted, so it carries nothing);
        each board's last-post line may go stale until the next post, which is fine. */
    async moveThread(threadId, toBoardId, { fromBoardId, replyCount = 0, counted = true } = {}) {
      const tx = [{ type: 'update', pk: `thread#${threadId}`, sk: 'meta',
        set: { boardId: toBoardId, gsi1pk: `board#${toBoardId}` } }];
      if (counted && fromBoardId && fromBoardId !== toBoardId) {
        const posts = 1 + replyCount;
        tx.push(
          { type: 'update', pk: `board#${fromBoardId}`, sk: 'stats', add: { threadCount: -1, postCount: -posts } },
          { type: 'update', pk: `board#${toBoardId}`, sk: 'stats', add: { threadCount: 1, postCount: posts } },
        );
      }
      await ops.transact(tx);
    },

    // ── posts ───────────────────────────────────────────────────────────────────
    /** Reply: allocate the next per-thread sequence (atomic), write the post, bump the
        thread (reply count + last_post_at + gsi) and the author's post count together. */
    async addPost(threadId, post, isPinned = false, held = false, { boardId, postedBy } = {}) {
      const seq = await ops.add(`thread#${threadId}`, 'meta', 'postSeq', 1);
      const tx = [{ type: 'put', item: { pk: `thread#${threadId}`, sk: `post#${SEQ(seq)}`, seq, ...post } }];
      // A held post is invisible, so it must not bump the board, the reply count, or the
      // author's rank; releaseHeldPost applies all of that when a mod approves it.
      if (!held) {
        const lastPostAt = post.createdAt;
        tx.push(
          { type: 'update', pk: `thread#${threadId}`, sk: 'meta',
            set: { lastPostAt, gsi1sk: gsiSk(isPinned, lastPostAt) }, add: { replyCount: 1 } },
          { type: 'update', pk: `user#${post.authorId}`, sk: 'profile', add: { postCount: 1 } },
        );
        if (boardId) tx.push(statsBump(boardId, { at: lastPostAt, by: postedBy }));
      }
      await ops.transact(tx);
      return { ...post, seq };
    },
    getPost: (threadId, seq) => ops.get(`thread#${threadId}`, `post#${SEQ(seq)}`),
    /** One page of a thread's posts (20/page by default), page N directly addressable.
        Returns { items, hasMore }; hasMore peeks one past the page so a full final page
        doesn't advertise a next page that turns out empty. */
    async listPosts(threadId, { page = 1, perPage = 20 } = {}) {
      const from = (page - 1) * perPage + 1;
      const { items } = await ops.query(`thread#${threadId}`, {
        forward: true, limit: perPage + 1,
        skBetween: [`post#${SEQ(from)}`, `post#${SEQ(from + perPage)}`],
      });
      return { items: items.slice(0, perPage), hasMore: items.length > perPage };
    },
    /** Edit a post: keep the old body as a revision, then update in place. */
    async editPost(threadId, seq, { body, revision }) {
      await ops.put({ pk: `thread#${threadId}`, sk: `rev#${SEQ(seq)}#${revision.editedAt}`, seq, ...revision });
      return ops.update(`thread#${threadId}`, `post#${SEQ(seq)}`, { set: body });
    },
    revisions: (threadId, seq) => ops.query(`thread#${threadId}`, { skBegins: `rev#${SEQ(seq)}#`, forward: true }),
    /** Soft-delete: the caller passes the tombstone (moderation.softDeletePost); we just store it. */
    // A held post clears moderation: make its deferred public effects real (it added none while
    // held). The OP just surfaces its thread; a reply also bumps the board and the reply count.
    async releaseHeldPost(threadId, seq, { at, authorId, isPinned = false, boardId, postedBy } = {}) {
      const isOp = Number(seq) === 1;
      const tx = [
        { type: 'update', pk: `thread#${threadId}`, sk: `post#${SEQ(seq)}`, set: { isApproved: true } },
        { type: 'update', pk: `user#${authorId}`, sk: 'profile', add: { postCount: 1 } },
        // Only the OP surfaces its thread. A reply must NOT flip thread.isApproved: if a mod
        // approves a held reply before the still-held OP, the thread (and its unreviewed title)
        // has to stay hidden until the OP itself is released.
        isOp
          ? { type: 'update', pk: `thread#${threadId}`, sk: 'meta', set: { isApproved: true } }
          : { type: 'update', pk: `thread#${threadId}`, sk: 'meta',
              set: { lastPostAt: at, gsi1sk: gsiSk(isPinned, at) }, add: { replyCount: 1 } },
      ];
      // the board line takes the post's own time; approving something old can
      // pull the by-line back for a while, and the next post sets it right
      if (boardId) tx.push(statsBump(boardId, { newThread: isOp, at, by: postedBy }));
      await ops.transact(tx);
    },
    tombstonePost: (threadId, seq, tombstone) =>
      ops.update(`thread#${threadId}`, `post#${SEQ(seq)}`, { set: tombstone }),

    // ── reports & first-post queue ──────────────────────────────────────────────
    /** Report a post: one item per post (dedup); a second report accrues a reporter. */
    async report(postId, { reporterId, reason, at }) {
      const existing = await ops.get('queue#reports', postId);
      if (existing && existing.status === 'open') {
        const reporters = [...new Set([...(existing.reporters || []), reporterId])];
        return ops.update('queue#reports', postId, { set: { reporters, lastReason: reason, lastAt: at } });
      }
      return ops.put({ pk: 'queue#reports', sk: postId, status: 'open', reporters: [reporterId], reason, at });
    },
    openReports: (opts = {}) => ops.query('queue#reports', { forward: true, limit: 100, ...opts }),
    // resolving DELETES the report item: the who/why/when lives in the mod-log,
    // and the reporters' ids don't need to outlive the case (the privacy page
    // says reports are kept until handled, so handled means gone)
    resolveReport: (postId) => ops.remove('queue#reports', postId),
    queueFirstPost: (postId, item) => ops.put({ pk: 'queue#approval', sk: postId, ...item }),
    approvalQueue: (opts = {}) => ops.query('queue#approval', { forward: true, limit: 100, ...opts }),
    approveFirstPost: (sk) => ops.remove('queue#approval', sk),

    // ── bans & mod-log ──────────────────────────────────────────────────────────
    /** Persist a ban (moderation.issueBan built it) and a mod-log line in one write. */
    putBan: (ban, logItem) => ops.transact([
      { type: 'put', item: { pk: `user#${ban.userId}`, sk: `ban#${ban.createdAt}`, ...ban } },
      { type: 'put', item: { pk: `modlog#${logItem.at.slice(0, 7).replace('-', '')}`, sk: `${logItem.at}#${logItem.id}`, ...logItem } },
    ]),
    async newestBan(userId) {
      const r = await ops.query(`user#${userId}`, { skBegins: 'ban#', forward: false, limit: 1 });
      return r.items[0] || null;
    },
    /** Every ban on a user, newest first, so enforcement (moderation.activeBan) can weigh them all;
        a lighter ban added after a heavier one must not shadow it. */
    async bans(userId) {
      const r = await ops.query(`user#${userId}`, { skBegins: 'ban#', forward: false });
      return r.items;
    },
    liftBan: (userId, createdAt, at) => ops.update(`user#${userId}`, `ban#${createdAt}`, { set: { liftedAt: at } }),
    log: (logItem) => ops.put({ pk: `modlog#${logItem.at.slice(0, 7).replace('-', '')}`, sk: `${logItem.at}#${logItem.id}`, ...logItem }),

    // ── rate limiting, settings, email tokens ───────────────────────────────────
    /** Atomic self-expiring counter. `expiresAt` is an ABSOLUTE Unix epoch (DynamoDB TTL),
        never a duration, or the item is born already-expired. Returns the new count. */
    rateHit: (who, windowKey, expiresAt) => ops.add(`rl#${who}#${windowKey}`, '-', 'n', 1, { ttl: expiresAt }),
    getSetting: (key) => ops.get('settings', key),
    putSetting: (key, value, meta = {}) => ops.put({ pk: 'settings', sk: key, value, ...meta }),
    putToken: (hash, data, ttl) => ops.put({ pk: `token#${hash}`, sk: '-', ttl, ...data }),
    /** Single-use: atomic take, so a token can't be redeemed twice even under a race. */
    consumeToken: (hash) => ops.take(`token#${hash}`, '-'),
    /** Burn a one-time nonce (the registration challenge): true the first time, false on replay. */
    async useNonce(nonce, ttl) {
      try { await ops.putNew({ pk: `nonce#${nonce}`, sk: '-', ttl }); return true; }
      catch (e) { if (e instanceof ConflictError) return false; throw e; }
    },
  };
}
