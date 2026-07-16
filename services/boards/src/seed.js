// seed.js, first-run content as a pure function over the store, so it tests with mem-ops and
// runs (via seed-cli.js) against DynamoDB with the same code. It creates the three boards, the
// Webmaster account (credentials injected, never hard-coded), and the pinned opening threads
// authored by the Webmaster. Idempotency is NOT built in: run once on an empty table.
import { bbcodeToHtml } from './bbcode.js';
import { hashPassword } from './auth.js';

// Default to the zero-dep scrypt hasher so the tests stay native-free. seed-cli injects the same
// argon2id hasher the login path uses, so the seeded Webmaster is stored in the production scheme:
// otherwise a login against its address runs scrypt while a miss runs the argon2 dummy, and the two
// time apart into an existence oracle for the highest-value account.
const SCRYPT = { hash: (pw) => hashPassword(pw) };

/** Seed boards + the Webmaster + the pinned threads. `content` = { boards, threads, webmaster }. */
export async function seed(store, content, { now, newId, hasher = SCRYPT } = {}) {
  const boardId = {};
  for (const b of content.boards) {
    const id = newId();
    boardId[b.slug] = id;
    // spread first so extra fields (the Stammtisch's lang) ride along
    await store.putBoard({ ...b, id });
  }

  const wm = content.webmaster;
  const webmaster = {
    id: newId(), displayName: wm.displayName, email: String(wm.email).toLowerCase(),
    passwordHash: await hasher.hash(wm.password), role: 'webmaster', postCount: 0,
    createdAt: now, sessionsValidAfter: 0, verifiedAt: now,
  };
  await store.createUser(webmaster);

  const threads = [];
  for (const t of content.threads) {
    const id = newId();
    const post = { authorId: webmaster.id, bodyBbcode: t.body, bodyHtml: bbcodeToHtml(t.body), createdAt: now };
    await store.createThread(
      { id, boardId: boardId[t.board], title: t.title, authorId: webmaster.id, isPinned: !!t.pinned, createdAt: now, lastPostAt: now },
      post,
      { postedBy: webmaster.displayName },
    );
    threads.push({ id, board: t.board, title: t.title, pinned: !!t.pinned });
  }

  return { webmaster: webmaster.id, boards: Object.keys(boardId).length, threads };
}
