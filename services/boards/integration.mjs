// integration.mjs, a standalone wiring check for app.js against the in-memory store via hono's
// test client. Deliberately NOT a *.test.js, so the repo-root suite (which has no hono) never
// runs it and CI stays green without service deps. Run it after installing the boards deps:
//   cd services/boards && npm install && node integration.mjs
// It exits non-zero on the first failed assertion. It validates WIRING (route -> handler ->
// response, cookies, CSRF); the handlers themselves are unit-tested at the repo root.
import assert from 'node:assert/strict';
import { createApp } from './src/app.js';
import { boardsStore } from './src/boards-store.js';
import { memOps } from './src/mem-ops.js';
import { memEmail } from './src/mem-email.js';
import { signValue } from './src/session.js';
import { argon2Hasher } from './src/auth-argon2.js';
import { hashPassword } from './src/auth.js';

const KEY = 'integration-key';
const store = boardsStore(memOps());
const mail = memEmail();
let n = 0;
// Run the whole flow on the PRODUCTION hasher (argon2id), the way handler.js wires it.
const app = createApp({ store, mail, key: KEY, origin: 'http://localhost', newId: () => `id${++n}`, hasher: argon2Hasher });
await store.putBoard({ id: 'b1', slug: 'talk', name: 'The Talk', description: 'General chatter', position: 0 });

const jar = {};
const updateJar = (res) => {
  for (const sc of res.headers.getSetCookie?.() || []) {
    const [pair] = sc.split(';');
    const i = pair.indexOf('=');
    const k = pair.slice(0, i).trim();
    const v = pair.slice(i + 1).trim();
    if (k) { if (v) jar[k] = v; else delete jar[k]; }
  }
};
const cookie = () => Object.entries(jar).map(([k, v]) => `${k}=${v}`).join('; ');
const GET = async (path) => { const r = await app.request(path, { headers: { cookie: cookie() } }); updateJar(r); return r; };
const POST = async (path, fields) => {
  const r = await app.request(path, { method: 'POST', headers: { cookie: cookie(), 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(fields).toString() });
  updateJar(r); return r;
};
const grab = (s, re) => (String(s).match(re) || [])[1];
const nowS = () => Math.floor(Date.now() / 1000);
let step = 0;
const ok = (msg) => console.log(`  ok ${++step}. ${msg}`);

// 1. board index
let res = await GET('/');
assert.equal(res.status, 200);
assert.match(await res.text(), /The Talk/);
ok('board index lists the board');

const CSRF = () => jar['__Host-csrf'];

// 2. register form issues a csrf cookie
res = await GET('/register');
assert.equal(res.status, 200);
assert.ok(CSRF(), 'csrf cookie set');
ok('register form sets csrf + renders');

// 3. register (pre-mint the challenge with t in the past + a nonce so it clears the gates once)
const challenge = signValue({ q: 0, t: nowS() - 10, n: 'harness-nonce' }, KEY, { expiresIn: 1800 });
res = await POST('/register', { csrf: CSRF(), challenge, website: '', name: 'Ada', email: 'ada@x.example', password: 'sekrit-pw-99', password2: 'sekrit-pw-99', age: 'yes', answer: 'world wide web' });
assert.equal(res.status, 200);
assert.match(await res.text(), /confirmation link/i);
assert.equal(mail.sent.length, 1, 'a verification email was sent');
ok('register creates the account + emails a link');

// 4. verify confirms the email but does NOT auto-login (redirects to the login form)
const token = decodeURIComponent(grab(mail.sent[0].text, /verify\?token=([^\s&]+)/));
res = await GET(`/verify?token=${token}`);
assert.equal(res.status, 303);
assert.match(res.headers.get('location'), /\/login/);
assert.ok(!jar['__Host-sid'], 'verify does not mint a session');
ok('verify confirms, no GET auto-login');

// 5. log in to get a session
res = await POST('/login', { csrf: CSRF(), email: 'ada@x.example', password: 'sekrit-pw-99' });
assert.equal(res.status, 303);
assert.ok(jar['__Host-sid'], 'session cookie set on login');
ok('login signs in');

// 6. authed chrome shows the name
res = await GET('/');
assert.match(await res.text(), /Signed in as/);
ok('signed-in chrome shows');

// 7-8. compose + post a thread, then read it
res = await GET('/boards/talk/new');
assert.equal(res.status, 200);
res = await POST('/boards/talk/new', { csrf: CSRF(), title: 'Hello world', body: 'first post [b]bold[/b]' });
assert.equal(res.status, 303);
const threadPath = res.headers.get('location');
assert.match(threadPath, /^\/threads\//);
const threadId = threadPath.split('/')[2].split('?')[0];
ok(`new thread posted -> ${threadPath}`);

res = await GET(threadPath);
const body = await res.text();
assert.match(body, /Hello world/);
assert.match(body, /<strong>bold<\/strong>/); // bbcode rendered on write
ok('thread renders the opening post, bbcode rendered');

// 9. reply
res = await POST(`/threads/${threadId}/reply`, { csrf: CSRF(), body: 'a reply' });
assert.equal(res.status, 303);
ok('reply posts');

// 10. csrf guard refuses a bad token
res = await POST('/login', { csrf: 'wrong', email: 'x', password: 'y' });
assert.equal(res.status, 403);
ok('csrf guard blocks a mismatched token');

// 11. moderation wiring: promote Ada to sysop, lock the thread
const ada = await store.userByEmail('ada@x.example');
await store.setUser(ada.id, { role: 'sysop' });
res = await POST(`/threads/${threadId}/flag`, { csrf: CSRF(), action: 'lock' });
assert.equal(res.status, 303);
assert.equal((await store.getThread(threadId)).isLocked, true);
ok('moderation: lock wired + applied');

// 12. the argon2 hasher: new hashes are argon2id, and it still verifies a legacy scrypt hash (migration)
assert.match((await store.getUser(ada.id)).passwordHash, /^\$argon2id\$/, 'account created under argon2id');
assert.equal(await argon2Hasher.verify('legacy-pw', hashPassword('legacy-pw')), true, 'verifies a legacy scrypt hash');
assert.equal(await argon2Hasher.verify('wrong', hashPassword('legacy-pw')), false, 'rejects a wrong password');
ok('argon2id hashing + scrypt-migration verify');

// 13. Ada was an unvouched newcomer, so her whole thread is held: a signed-out visitor sees
// neither its title nor its body (the thread is invisible) until a moderator releases it.
res = await app.request(threadPath);
const anon = await res.text();
assert.doesNotMatch(anon, /<strong>bold<\/strong>/);  // the body is hidden
assert.doesNotMatch(anon, /Hello world/);             // and so is the title (the thread is held whole)
ok('a held thread is hidden from anonymous visitors');

// 14. Ada is a sysop now (step 11); when she releases the held opening post the thread goes public.
res = await POST(`/posts/${threadId}.1/approve`, { csrf: CSRF() });
assert.equal(res.status, 303);
res = await app.request(threadPath);
const released = await res.text();
assert.match(released, /Hello world/);                // title now public
assert.match(released, /<strong>bold<\/strong>/);     // body now public
ok('approving the opening post releases the thread to the public');

console.log(`\nALL ${step} WIRING CHECKS PASSED`);
