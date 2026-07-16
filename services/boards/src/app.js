// app.js, the thin hono binding: the ONLY file that imports hono. `createApp` takes its
// dependencies injected (store, mail transport, signing key, origin), so the whole wiring is
// exercised with the in-memory store via hono's test client (services/boards/integration.mjs) --
// it decides no policy, it marshals a request into a tested handler and maps the descriptor back.
// handler.js builds the real (DynamoDB + SMTP) dependencies and is the Lambda entry. Every
// mutation is an HTML form POST guarded by double-submit CSRF and answered with a 303 (PRG).
import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { newCsrfToken } from './auth.js';
import { indexPage, boardPage, threadPage } from './read-handlers.js';
import { newThread, postReply } from './write-handlers.js';
import { register, verify, login, logout, requestReset, performReset, newChallenge } from './auth-handlers.js';
import { flagThread, moveThread, deletePost, approvePost, reportPost, resolveReport, banUser, liftBan } from './mod-handlers.js';
import { layout, loginView, registerView, forgotView, resetView, newThreadView, noticeView, toHtml, NOTICES } from './views.js';
import { impressumView, datenschutzView } from './legal.js';
import { parseCookies, csrfCookie, checkCsrf, loadUser, toResponse, clientIp, CSRF_COOKIE } from './http.js';

const nowS = () => Math.floor(Date.now() / 1000);
const nowIso = () => new Date().toISOString();

// Emit a handler descriptor as a Response, attaching any cookies (incl. a fresh csrf).
function send(c, d) {
  const extra = c.get('freshCsrf') ? [csrfCookie(c.get('freshCsrf'))] : [];
  const r = toResponse(d, extra);
  for (const cookie of r.cookies) c.header('Set-Cookie', cookie, { append: true });
  for (const [k, v] of Object.entries(r.headers)) c.header(k, v);
  return c.body(r.body, r.status);
}
// path is opt-in: only real, indexable pages pass one (so it becomes a canonical);
// login/register/error pages leave it unset and get no canonical, like the read 404s.
const page = (c, title, body, opts = {}) =>
  send(c, { status: opts.status || 200, html: toHtml(layout({ title, user: c.get('user'), body, board: opts.board, description: opts.description, path: opts.path, csrf: c.get('csrf') })) });
async function form(c) {
  const body = await c.req.parseBody();
  return { body, ok: checkCsrf(c.get('cookies')[CSRF_COOKIE], body.csrf) };
}
const csrfFail = (c) => page(c, 'Try again', noticeView({ heading: 'Your session expired', message: 'Reload the page and try again.' }), { status: 403 });
const modBack = (c, r, back) => (r.redirect ? send(c, r) : page(c, 'Not allowed', noticeView({ heading: 'Not allowed', message: r.error, backHref: back }), { status: r.status }));

/** Build the app over injected dependencies. `newId` is overridable so a harness gets stable ids. */
export function createApp({ store, mail, key, origin = '', appName = 'Retrostrap Boards', newId = randomUUID, hasher } = {}) {
  const app = new Hono();

  // Every request: cookies, a csrf token (double-submit, minted if absent), the current user.
  app.use('*', async (c, next) => {
    const cookies = parseCookies(c.req.header('cookie'));
    c.set('cookies', cookies);
    let csrf = cookies[CSRF_COOKIE];
    if (!csrf) { csrf = newCsrfToken(); c.set('freshCsrf', csrf); }
    c.set('csrf', csrf);
    c.set('user', await loadUser(store, cookies, key, nowS(), nowIso()));
    await next();
  });

  // ── reads ──
  app.get('/', async (c) => send(c, await indexPage(store, { user: c.get('user'), notice: NOTICES[c.req.query('notice')], csrf: c.get('csrf') })));
  app.get('/boards/:slug', async (c) => send(c, await boardPage(store, { slug: c.req.param('slug'), after: c.req.query('after'), user: c.get('user'), key, csrf: c.get('csrf') })));
  app.get('/threads/:id', async (c) => send(c, await threadPage(store, { threadId: c.req.param('id'), page: c.req.query('page'), user: c.get('user'), csrf: c.get('csrf'), notice: NOTICES[c.req.query('notice')] })));

  // ── the legal pages (ECG § 5, MedienG § 25, DSGVO), linked from every footer ──
  app.get('/impressum', (c) => page(c, 'Impressum', impressumView(), { path: '/impressum' }));
  app.get('/datenschutz', (c) => page(c, 'Datenschutz', datenschutzView(), { path: '/datenschutz' }));

  // ── crawlers: allow all, and a bounded sitemap (boards + recent approved threads) ──
  app.get('/robots.txt', (c) => c.text('User-agent: *\nDisallow:\n\nSitemap: https://boards.retrostrap.dev/sitemap.xml\n'));
  app.get('/sitemap.xml', async (c) => {
    const boards = await store.listBoards();
    const urls = ['/'];
    for (const b of boards) {
      urls.push(`/boards/${b.slug}`);
      const { items } = await store.listThreads(b.id, { limit: 50 });
      for (const t of items) if (t.isApproved !== false) urls.push(`/threads/${t.id}`); // held threads stay out
    }
    const xesc = (s) => String(s).replace(/[&<>]/g, (ch) => (ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : '&gt;'));
    const body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
      + urls.map((u) => `  <url><loc>https://boards.retrostrap.dev${xesc(u)}</loc></url>`).join('\n')
      + '\n</urlset>\n';
    return c.body(body, 200, { 'content-type': 'application/xml; charset=utf-8' });
  });

  // ── account ──
  app.get('/login', (c) => page(c, 'Log in', loginView({ csrf: c.get('csrf'), notice: NOTICES[c.req.query('notice')] })));
  app.get('/register', (c) => page(c, 'Register', registerView({ challenge: newChallenge({ key, nowS: nowS(), seed: nowS() }), csrf: c.get('csrf') })));
  app.get('/forgot', (c) => page(c, 'Reset password', forgotView({ csrf: c.get('csrf') })));
  app.get('/reset', (c) => page(c, 'Reset password', resetView({ token: c.req.query('token'), csrf: c.get('csrf') })));
  app.get('/verify', async (c) => {
    const r = await verify(store, { token: c.req.query('token'), key, nowS: nowS(), nowIso: nowIso() });
    return r.redirect ? send(c, r) : page(c, 'Confirmation', noticeView({ heading: 'Could not confirm', message: r.error, backHref: '/register', backLabel: 'Back to registration' }), { status: r.status });
  });

  app.post('/register', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await register(store, mail, { form: body, ip: clientIp(c), nowS: nowS(), nowIso: nowIso(), key, appName, verifyUrlBase: `${origin}/verify`, newId, hasher });
    if (r.notice === 'check-email') return page(c, 'Check your email', noticeView({ heading: 'Almost there', message: `We sent a confirmation link to ${r.email}. Open it to finish.` }));
    return page(c, 'Register', registerView({ challenge: newChallenge({ key, nowS: nowS(), seed: nowS(), avoid: r.failedQ ?? -1 }), csrf: c.get('csrf'), error: r.error, values: body }), { status: r.status });
  });
  app.post('/login', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await login(store, { form: body, ip: clientIp(c), nowS: nowS(), nowIso: nowIso(), key, hasher });
    return r.redirect ? send(c, r) : page(c, 'Log in', loginView({ csrf: c.get('csrf'), error: r.error }), { status: r.status });
  });
  app.post('/logout', async (c) => { const { ok } = await form(c); return ok ? send(c, logout()) : csrfFail(c); });
  app.post('/forgot', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    await requestReset(store, mail, { form: body, ip: clientIp(c), nowS: nowS(), key, appName, resetUrlBase: `${origin}/reset`, floorMs: 800 });
    return page(c, 'Check your email', noticeView({ heading: 'Check your email', message: 'If that address has an account, a reset link is on its way.' }));
  });
  app.post('/reset', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await performReset(store, { form: body, nowS: nowS(), nowIso: nowIso(), key, hasher });
    return r.redirect ? send(c, r) : page(c, 'Reset password', resetView({ token: body.token, csrf: c.get('csrf'), error: r.error }), { status: r.status });
  });

  // ── posting ──
  app.get('/boards/:slug/new', async (c) => {
    if (!c.get('user')) return c.redirect('/login');
    const board = await store.boardBySlug(c.req.param('slug'));
    if (!board) return c.notFound();
    return page(c, 'New thread', newThreadView({ board, csrf: c.get('csrf') }), { board });
  });
  app.post('/boards/:slug/new', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await newThread(store, { boardSlug: c.req.param('slug'), user: c.get('user'), title: body.title, body: body.body, now: nowIso(), id: newId(), nowS: nowS(), ip: clientIp(c) });
    if (r.redirect) return send(c, r);
    const board = (await store.boardBySlug(c.req.param('slug'))) || { name: '', slug: c.req.param('slug') };
    return page(c, 'New thread', newThreadView({ board, csrf: c.get('csrf'), error: r.error, values: body }), { status: r.status, board });
  });
  app.post('/threads/:id/reply', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await postReply(store, { threadId: c.req.param('id'), user: c.get('user'), body: body.body, now: nowIso(), nowS: nowS(), ip: clientIp(c) });
    return r.redirect ? send(c, r) : page(c, 'Reply', noticeView({ heading: 'Could not post', message: r.error, backHref: `/threads/${c.req.param('id')}`, backLabel: 'Back to the thread' }), { status: r.status });
  });

  // ── moderation (Approve and Report forms render in the post views; the rest answer direct
  //    POSTs until the mod pages land, roadmap P4) ──
  app.post('/threads/:id/flag', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await flagThread(store, { threadId: c.req.param('id'), action: body.action, user: c.get('user'), now: nowIso(), newId });
    return modBack(c, r, `/threads/${c.req.param('id')}`);
  });
  app.post('/threads/:id/move', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await moveThread(store, { threadId: c.req.param('id'), toSlug: body.toSlug, user: c.get('user'), now: nowIso(), newId });
    return modBack(c, r, `/threads/${c.req.param('id')}`);
  });
  app.post('/posts/:ref/delete', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const [threadId, seq] = String(c.req.param('ref')).split('.');
    const r = await deletePost(store, { threadId, seq, user: c.get('user'), reason: body.reason, now: nowIso(), newId });
    return modBack(c, r, `/threads/${threadId}`);
  });
  app.post('/posts/:ref/approve', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const [threadId, seq] = String(c.req.param('ref')).split('.');
    const r = await approvePost(store, { threadId, seq, user: c.get('user'), now: nowIso(), newId });
    return modBack(c, r, `/threads/${threadId}`);
  });
  app.post('/posts/:ref/report', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const [threadId, seq] = String(c.req.param('ref')).split('.');
    const r = await reportPost(store, { threadId, seq, user: c.get('user'), reason: body.reason, now: nowIso(), nowS: nowS(), ip: clientIp(c) });
    return modBack(c, r, `/threads/${threadId}`);
  });
  app.post('/reports/:ref/resolve', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await resolveReport(store, { postRef: c.req.param('ref'), action: body.action, user: c.get('user'), now: nowIso(), newId });
    return modBack(c, r, '/');
  });
  app.post('/users/:id/ban', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await banUser(store, { targetId: c.req.param('id'), level: body.level, reason: body.reason, user: c.get('user'), now: nowIso(), nowS: nowS(), newId });
    return modBack(c, r, '/');
  });
  app.post('/users/:id/lift', async (c) => {
    const { body, ok } = await form(c); if (!ok) return csrfFail(c);
    const r = await liftBan(store, { targetId: c.req.param('id'), user: c.get('user'), now: nowIso(), newId });
    return modBack(c, r, '/');
  });

  app.onError((err, c) => {
    console.error('[boards]', err);
    return page(c, 'Server error', noticeView({ heading: 'The server tripped over a cable', message: 'Not your fault. Try again in a minute.' }), { status: 500 });
  });
  app.notFound((c) => page(c, 'Not found', noticeView({ heading: 'Not found', message: 'That page does not exist.' }), { status: 404 }));
  return app;
}
