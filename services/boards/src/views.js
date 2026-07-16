// views.js, the Boards' server-rendered HTML, built with retrostrap itself and safe by
// default. A tiny tagged-template (`html`) escapes every interpolated value unless it is
// wrapped in `raw()`; the only raw HTML is a post body, which bbcode.js already sanitised
// (no raw tags, http(s)-only URLs, Palette-Law colours). Pure functions, no hono, no JSX,
// so the rendering (and its escaping) tests at the repo root. The request layer (app.js)
// wraps these with hono. JS-optional: every action is a plain form, no script required.
import { rankFor } from './ranks.js';

class Raw { constructor(s) { this.s = s; } }
/** Mark a string as already-safe HTML (a bbcode-rendered body, a nested view). */
export const raw = (s) => new Raw(String(s));

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function render(v) {
  if (v == null || v === false) return '';
  if (v instanceof Raw) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  return escapeHtml(v);
}
/** Tagged template that escapes by default and returns Raw, so views nest safely. */
export function html(strings, ...values) {
  let out = strings[0];
  for (let i = 0; i < values.length; i++) out += render(values[i]) + strings[i + 1];
  return new Raw(out);
}
/** Turn a view (Raw) into the string the Lambda returns. */
export const toHtml = (view) => (view instanceof Raw ? view.s : render(view));

// ── page chrome ────────────────────────────────────────────────────────────────────
const CDN = '/dist'; // same-origin: the docs/demo build serves the framework here too

/** The full document: retrostrap CSS/JS, the masthead nav, the content, the footer. */
export function layout({ title, user, body, board, description, path, csrf }) {
  const desc = description || 'The Retrostrap Boards: a slow, friendly community forum for retrostrap, the framework that builds the modern web to look like 1999.';
  const canonical = path ? `https://boards.retrostrap.dev${path}` : null;
  return html`<!DOCTYPE html>
<html lang="en" data-rs-theme="bevel">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} - Retrostrap Boards</title>
<meta name="description" content="${desc}">
${canonical ? html`<link rel="canonical" href="${canonical}">
<meta property="og:url" content="${canonical}">
` : ''}<meta property="og:title" content="${title} - Retrostrap Boards">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="website">
<meta property="og:image" content="https://retrostrap.dev/assets/og.png">
<link rel="stylesheet" href="${CDN}/retrostrap.min.css">
<link rel="stylesheet" href="${CDN}/themes/bevel.css">
<style>
/* the phpBB post shape: a slim author cell, the message gets the rest */
.rsx-post { display: grid; gap: var(--rs-space-2); }
@media (min-width: 640px) {
  .rsx-post { grid-template-columns: 140px 1fr; }
  .rsx-post > :last-child { min-width: 0; }
}
</style>
</head>
<body>
<a class="rs-skip" href="#main">Skip to content</a>
<div class="rs-page rs-container">
  <header class="rs-window__titlebar">
    <span class="rs-window__title"><a href="/">The Retrostrap Boards</a></span>
    <nav class="rs-nav" aria-label="Account">
      ${user
        ? html`<span>Signed in as ${user.displayName}</span>
               <form method="post" action="/logout" style="display:inline"><input type="hidden" name="csrf" value="${csrf}"><button class="rs-btn rs-btn--small" type="submit">Log out</button></form>`
        : html`<a class="rs-btn rs-btn--small" href="/login">Log in</a> <a class="rs-btn rs-btn--small" href="/register">Register</a>`}
    </nav>
  </header>
  <nav class="rs-breadcrumbs" aria-label="You are here">
    <ol>
      <li><a href="/">Boards</a></li>${board ? html`<li><a href="/boards/${board.slug}">${board.name}</a></li>` : ''}
    </ol>
  </nav>
  <main id="main">${body}</main>
  <footer class="rs-footer">
    <p><a href="/">Board index</a> &middot; <a href="/impressum">Impressum</a> &middot; <a href="/datenschutz">Datenschutz</a></p>
    <p class="rs-font-1">Built like it's 2026, argued like it's 1999.</p>
  </footer>
</div>
<script defer src="${CDN}/retrostrap.min.js"></script>
</body>
</html>`;
}

// One line per notice key a handler can send someone home with (?notice=<key>). Unknown keys
// render nothing, so a crafted query string can't put words in our mouth.
export const NOTICES = {
  'check-email': 'Account created. Check your email to confirm.',
  verified: 'Email confirmed. You can log in now.',
  welcome: 'Welcome back, you are signed in.',
  'password-changed': 'Your password was changed.',
  reported: 'Reported. A moderator will take a look.',
  approved: 'Approved and released to the board.',
  moved: 'This thread has moved to a better neighborhood.',
  removed: 'Post removed. The mod log has the details.',
  resolved: 'Report closed. Thanks for keeping watch.',
  banned: 'Account suspended. The mod log has the details.',
  'ban-lifted': 'Ban lifted. Welcome them back.',
};

// ── board index ────────────────────────────────────────────────────────────────────
export function boardIndexView({ boards, notice }) {
  const totals = boards.reduce(
    (t, b) => ({ threads: t.threads + (b.threadCount || 0), posts: t.posts + (b.postCount || 0) }),
    { threads: 0, posts: 0 },
  );
  return html`
  <h1 class="rs-font-5">The Retrostrap Boards</h1>
  ${noticeBanner(notice)}
  <table class="rs-table rs-table--data">
    <thead><tr><th scope="col">Board</th><th scope="col" class="rs-num">Threads</th><th scope="col" class="rs-num">Posts</th><th scope="col">Last post</th></tr></thead>
    <tbody>
      ${boards.map((b) => html`<tr>
        <th scope="row"><a href="/boards/${b.slug}">${b.name}</a><br><span class="rs-font-1">${b.description}</span></th>
        <td class="rs-num">${b.threadCount ?? 0}</td>
        <td class="rs-num">${b.postCount ?? 0}</td>
        <td class="rs-font-1">${b.lastPostAt
          ? html`${b.lastPostBy ? html`by ${b.lastPostBy}, ` : ''}${relTime(b.lastPostAt)}`
          : 'no posts yet'}</td>
      </tr>`)}
    </tbody>
  </table>
  <p class="rs-panel rs-font-1">${totals.threads} ${totals.threads === 1 ? 'thread' : 'threads'} &middot; ${totals.posts} ${totals.posts === 1 ? 'post' : 'posts'} &middot; all of it readable without an account</p>`;
}

// ── a board's thread list ──────────────────────────────────────────────────────────
export function threadListView({ board, threads, nextCursor, user }) {
  return html`
  <div class="rs-toolbar">
    <h1 class="rs-font-5">${board.name}</h1>
    ${user ? html`<a class="rs-btn rs-btn--primary" href="/boards/${board.slug}/new">New thread</a>` : ''}
  </div>
  <p class="rs-font-1">${board.description}</p>
  <table class="rs-table rs-table--data rs-table--striped">
    <thead><tr><th scope="col">Thread</th><th scope="col" class="rs-num">Replies</th><th scope="col">Last post</th></tr></thead>
    <tbody>
      ${threads.length === 0
        ? html`<tr><td colspan="3" class="rs-center">No threads yet. Be the first, post #1 always gets remembered.</td></tr>`
        : threads.map((t) => html`<tr>
            <th scope="row">${t.isPinned ? html`<span class="rs-badge">PINNED</span> ` : ''}${t.isLocked ? html`<span class="rs-badge">LOCKED</span> ` : ''}<a href="/threads/${t.id}">${t.title}</a></th>
            <td class="rs-num">${t.replyCount ?? 0}</td>
            <td class="rs-font-1">${relTime(t.lastPostAt)}</td>
          </tr>`)}
    </tbody>
  </table>
  ${nextCursor ? html`<nav class="rs-pagination" aria-label="Pages"><a class="rs-btn rs-btn--small" href="/boards/${board.slug}?after=${encodeURIComponent(nextCursor)}">next &raquo;</a></nav>` : ''}`;
}

// ── a thread and its posts ─────────────────────────────────────────────────────────
export function threadView({ board, thread, posts, page, hasMore, user, csrf, notice }) {
  return html`
  <h1 class="rs-font-5">${thread.title}</h1>
  ${notice ? html`<p class="rs-alert rs-alert--info">${notice}</p>` : ''}
  ${thread.isLocked ? html`<p class="rs-note">This thread is locked; no new replies.</p>` : ''}
  ${posts.map((p) => postView(p, { thread, user, csrf }))}
  ${pager(`/threads/${thread.id}`, page, hasMore)}
  ${user && !thread.isLocked
    ? html`<form class="rs-panel" method="post" action="/threads/${thread.id}/reply">
        <h2 class="rs-panel__title">Reply</h2>
        <input type="hidden" name="csrf" value="${csrf}">
        <p><textarea class="rs-textarea" name="body" rows="6" required></textarea></p>
        <p><button class="rs-btn rs-btn--primary" type="submit">Post reply</button></p>
      </form>`
    : (!user ? html`<p class="rs-note"><a href="/login">Log in</a> to reply.</p>` : '')}`;
}

/** One post: author column (rank stars, join date) beside the body, with a tombstone
    when soft-deleted (the body is kept but never shown). */
export function postView(p, { thread, user, csrf } = {}) {
  const rank = rankFor(p.authorPostCount ?? 0, p.authorRole);
  const stars = raw('&#9733;'.repeat(rank.stars) + '&#9734;'.repeat(Math.max(0, 5 - rank.stars)));
  const canModerate = user && (user.role === 'sysop' || user.role === 'webmaster');
  return html`
  <article class="rs-window" id="post-${p.seq}">
    <div class="rs-window__titlebar"><span class="rs-window__title">${p.authorName}</span><span class="rs-font-1">#${p.seq} &middot; ${relTime(p.createdAt)}</span></div>
    <div class="rs-window__body rsx-post">
      <aside class="rs-font-1"><strong>${rank.title}</strong><br><span title="${rank.stars} of 5">${stars}</span></aside>
      <div>
        ${p.awaitingApproval
          ? html`<p class="rs-note">Awaiting a moderator's ok before it shows to the board.${canModerate
              ? html` <form method="post" action="/posts/${thread.id}.${p.seq}/approve" style="display:inline"><input type="hidden" name="csrf" value="${csrf}"><button class="rs-btn rs-btn--small" type="submit">Approve</button></form>`
              : ''}</p>`
          : ''}
        ${p.deletedAt
          ? html`<p class="rs-note">[removed by a moderator: ${p.deleteReason}]</p>`
          : raw(p.bodyHtml)}
        ${p.editedAt && !p.deletedAt ? html`<p class="rs-font-1">edited ${relTime(p.editedAt)}</p>` : ''}
        ${user && !p.deletedAt && !p.awaitingApproval
          ? html`<details class="rs-spoiler rs-font-1"><summary>report this post</summary>
              <form method="post" action="/posts/${thread.id}.${p.seq}/report">
                <input type="hidden" name="csrf" value="${csrf}">
                <p><label>What's wrong here? <input class="rs-input" name="reason"></label>
                <button class="rs-btn rs-btn--small" type="submit">Send to the mods</button></p>
              </form></details>`
          : ''}
      </div>
    </div>
  </article>`;
}

// ── small helpers ──────────────────────────────────────────────────────────────────
function pager(base, page, hasMore) {
  if (page <= 1 && !hasMore) return '';
  return html`<nav class="rs-pagination" aria-label="Pages">
    ${page > 1 ? html`<a class="rs-btn rs-btn--small" href="${base}?page=${page - 1}">&laquo; prev</a>` : ''}
    <span class="rs-font-1">page ${page}</span>
    ${hasMore ? html`<a class="rs-btn rs-btn--small" href="${base}?page=${page + 1}">next &raquo;</a>` : ''}
  </nav>`;
}

// ── account forms ──────────────────────────────────────────────────────────────────
// JS-optional plain forms: label/input pairs in an rs-form-table, one error banner (the
// handlers return a single message), CSRF + the signed challenge as hidden fields.
const errorBanner = (error) => (error ? html`<p class="rs-alert rs-alert--error" role="alert">${error}</p>` : '');
const noticeBanner = (notice) => (notice ? html`<p class="rs-alert" role="status">${notice}</p>` : '');

/** Register: name/email/password, the anti-bot quiz, a signed challenge, and a honeypot that a
    human never sees (off-screen, aria-hidden, tab-skipped) but a form-filling bot trips. */
export function registerView({ challenge, csrf, error, values = {} } = {}) {
  return html`
  <h1 class="rs-font-5">Join the boards</h1>
  ${errorBanner(error)}
  <form class="rs-form-table" method="post" action="/register">
    <input type="hidden" name="csrf" value="${csrf}">
    <input type="hidden" name="challenge" value="${challenge?.token}">
    <label for="r-name">Name:</label>
    <input class="rs-input" id="r-name" name="name" type="text" value="${values.name || ''}" minlength="3" maxlength="24" required autocomplete="nickname">
    <label for="r-email">Email:</label>
    <input class="rs-input" id="r-email" name="email" type="email" value="${values.email || ''}" maxlength="254" required autocomplete="username">
    <label for="r-pass">Password:</label>
    <input class="rs-input" id="r-pass" name="password" type="password" minlength="10" required autocomplete="new-password">
    <label for="r-pass2">Confirm password:</label>
    <input class="rs-input" id="r-pass2" name="password2" type="password" minlength="10" required autocomplete="new-password">
    <label for="r-answer">${challenge?.question}</label>
    <input class="rs-input" id="r-answer" name="answer" type="text" required autocomplete="off" aria-describedby="r-hint">
    <p class="rs-note" id="r-hint">Hint: ${challenge?.hint}</p>
    <div aria-hidden="true" style="position:absolute;left:-9999px" tabindex="-1">
      <label for="r-web">Website (leave this blank):</label>
      <input id="r-web" name="website" type="text" tabindex="-1" autocomplete="off">
    </div>
    <p><label><input type="checkbox" name="age" value="yes" required class="rs-checkbox"> I am 16 or older.</label></p>
    <button class="rs-btn rs-btn--primary" type="submit">Create account</button>
  </form>
  <p class="rs-font-1">Already have an account? <a href="/login">Log in</a>.</p>`;
}

/** Log in. A notice slot carries a just-registered or just-reset message. */
export function loginView({ csrf, error, notice } = {}) {
  return html`
  <h1 class="rs-font-5">Log in</h1>
  ${noticeBanner(notice)}${errorBanner(error)}
  <form class="rs-form-table" method="post" action="/login">
    <input type="hidden" name="csrf" value="${csrf}">
    <label for="l-email">Email:</label>
    <input class="rs-input" id="l-email" name="email" type="email" required autocomplete="username">
    <label for="l-pass">Password:</label>
    <input class="rs-input" id="l-pass" name="password" type="password" required autocomplete="current-password">
    <button class="rs-btn rs-btn--primary" type="submit">Log in</button>
  </form>
  <p class="rs-font-1"><a href="/forgot">Forgot your password?</a> &middot; New here? <a href="/register">Register</a>.</p>`;
}

/** Ask for a reset link (email only). */
export function forgotView({ csrf, error, notice } = {}) {
  return html`
  <h1 class="rs-font-5">Reset your password</h1>
  ${noticeBanner(notice)}${errorBanner(error)}
  <p class="rs-font-1">Give us the email on your account and we'll send a reset link.</p>
  <form class="rs-form-table" method="post" action="/forgot">
    <input type="hidden" name="csrf" value="${csrf}">
    <label for="f-email">Email:</label>
    <input class="rs-input" id="f-email" name="email" type="email" required autocomplete="username">
    <button class="rs-btn rs-btn--primary" type="submit">Send the link</button>
  </form>`;
}

/** Set a new password (the reset link carried the token). */
export function resetView({ token, csrf, error } = {}) {
  return html`
  <h1 class="rs-font-5">Choose a new password</h1>
  ${errorBanner(error)}
  <form class="rs-form-table" method="post" action="/reset">
    <input type="hidden" name="csrf" value="${csrf}">
    <input type="hidden" name="token" value="${token}">
    <label for="n-pass">New password:</label>
    <input class="rs-input" id="n-pass" name="password" type="password" minlength="10" required autocomplete="new-password">
    <button class="rs-btn rs-btn--primary" type="submit">Set password</button>
  </form>`;
}

/** The compose form for a new thread (the reply form lives inside threadView). */
export function newThreadView({ board, csrf, error, values = {} } = {}) {
  return html`
  <h1 class="rs-font-5">New thread in ${board.name}</h1>
  ${errorBanner(error)}
  <form class="rs-panel" method="post" action="/boards/${board.slug}/new">
    <input type="hidden" name="csrf" value="${csrf}">
    <p><label for="t-title">Title</label><br>
      <input class="rs-input" id="t-title" name="title" type="text" value="${values.title || ''}" maxlength="90" required></p>
    <p><label for="t-body">Message</label><br>
      <textarea class="rs-textarea" id="t-body" name="body" rows="10" required>${values.body || ''}</textarea></p>
    <p><button class="rs-btn rs-btn--primary" type="submit">Post thread</button></p>
  </form>`;
}

/** A plain confirmation page: check your email, welcome, password changed. */
export function noticeView({ heading, message, backHref = '/', backLabel = 'Back to the boards' } = {}) {
  // only same-origin paths in the button href: no javascript:, no //evil.com, no scheme
  const safe = String(backHref || '/');
  const href = safe.startsWith('/') && !safe.startsWith('//') ? safe : '/';
  return html`
  <div class="rs-panel">
    <h1 class="rs-font-5">${heading}</h1>
    <p>${message}</p>
    <p><a class="rs-btn" href="${href}">${backLabel}</a></p>
  </div>`;
}

/** A period-plain "N minutes ago" with the ISO stamp kept for machines. `now` injectable. */
export function relTime(iso, now = Date.now()) {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  const s = Math.max(0, Math.floor((now - t) / 1000));
  const say = s < 60 ? 'just now'
    : s < 3600 ? `${Math.floor(s / 60)} min ago`
    : s < 86400 ? `${Math.floor(s / 3600)} h ago`
    : `${Math.floor(s / 86400)} d ago`;
  return raw(`<time datetime="${escapeHtml(iso)}">${escapeHtml(say)}</time>`);
}
