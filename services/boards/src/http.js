// http.js, the request layer's pure, hono-free helpers so the security-critical plumbing tests
// at the repo root: cookie (de)serialization, the double-submit CSRF check, loading the current
// user from the session cookie (verify the JWT, re-read the user so role + revocation + BAN come
// from the record, never the token), and mapping a handler descriptor to a plain response with
// security headers attached. app.js is the thin hono/aws-lambda binding over these.
import { timingSafeEqual } from 'node:crypto';
import { verifyJwt } from './session.js';
import { activeBan } from './moderation.js';

// `__Host-` prefix = host-only, Secure, Path=/, no Domain: a sibling subdomain can't set or
// shadow these, which is what closes the cookie-tossing CSRF vector.
export const SESSION_COOKIE = '__Host-sid';
export const CSRF_COOKIE = '__Host-csrf';
const MONTH = 30 * 24 * 3600;
const ATTRS = 'Path=/; HttpOnly; Secure; SameSite=Lax';

// Set on every response: block injected scripts (script-src 'self'), framing, and MIME sniffing.
// Inline styles are allowed because retro [color] bbcode and the honeypot emit style=""; scripts
// are never inline, so XSS still can't execute. https images are allowed for [img] posts.
const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
};

/** Parse a Cookie header into a plain object. A malformed %-escape must not throw the request. */
export function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (!k) continue;
    const raw = part.slice(eq + 1).trim();
    try { out[k] = decodeURIComponent(raw); } catch { out[k] = raw; }
  }
  return out;
}

export const sessionCookie = (jwt, { maxAge = MONTH } = {}) => `${SESSION_COOKIE}=${jwt}; ${ATTRS}; Max-Age=${maxAge}`;
export const clearSession = () => `${SESSION_COOKIE}=; ${ATTRS}; Max-Age=0`;
// The server renders the same value into the form, so this never needs to be JS-readable.
export const csrfCookie = (token) => `${CSRF_COOKIE}=${token}; ${ATTRS}; Max-Age=${MONTH}`;

/** Double-submit: the form field must equal the cookie, constant-time over BYTES, non-empty. */
export function checkCsrf(cookieToken, formToken) {
  if (!cookieToken || !formToken) return false;
  const a = Buffer.from(String(cookieToken));
  const b = Buffer.from(String(formToken));
  return a.length === b.length && a.length > 0 && timingSafeEqual(a, b);
}

/** The signed-in user, or null. Verifies the JWT, re-reads the user (role + `sessionsValidAfter`
    from the record, never the token), and treats an ACTIVE ban as logged-out so no session -- from
    reset, verify, or an old cookie -- can write while banned. `nowS` = unix seconds, `nowIso` for
    the ban compare. */
export async function loadUser(store, cookies, key, nowS, nowIso) {
  const token = cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const payload = verifyJwt(token, key, { now: nowS });
  if (!payload || !payload.sub) return null;
  const user = await store.getUser(payload.sub);
  if (!user) return null;
  if (typeof user.sessionsValidAfter === 'number' && Number(payload.iat) < user.sessionsValidAfter) return null;
  if (activeBan(await store.bans(user.id), nowIso)) return null; // any ban still in force = no session
  return user;
}

/** Map a success descriptor to a plain response (with security headers + any cookies). Redirect
    carries the session cookie (login/reset) or clears it (logout) and rides any flash notice as
    a ?notice=<key> for the landing page to render; html is a rendered page. */
export function toResponse(d, extraCookies = []) {
  const cookies = [...extraCookies];
  if (d.setSession) cookies.push(sessionCookie(d.setSession));
  if (d.clearSession) cookies.push(clearSession());
  if (d.redirect) {
    const to = d.notice ? `${d.redirect}${d.redirect.includes('?') ? '&' : '?'}notice=${encodeURIComponent(d.notice)}` : d.redirect;
    return { status: d.status || 303, headers: { ...SECURITY_HEADERS, Location: to }, cookies, body: '' };
  }
  return { status: d.status || 200, headers: { ...SECURITY_HEADERS, 'Content-Type': 'text/html; charset=utf-8' }, cookies, body: d.html ?? '' };
}

// Trust only edge-set signals for the client IP, NEVER the client's X-Forwarded-For (spoofable):
// first the x-viewer-address our CloudFront Function stamps as a bare IP on EVERY request, so a
// viewer-sent copy never survives to the origin (the flat-rate plans have no custom
// origin-request policies, see infra/README.md); then CloudFront-Viewer-Address
// ("ip:port", only set when a managed policy forwards it, and NOT reliably stripped from the
// viewer otherwise, which is why it must not come first); then the Lambda event source IP.
// Direct Function-URL callers can't spoof any of these once EDGE_SECRET is set: handler.js
// answers them with a 403 before this runs. Falls back to 'unknown' off-Lambda (the test
// harness). Only the CloudFront header carries a port; stripping ":digits" from a bare IPv6
// would eat its last hextet, so the stamped header is used untouched.
export const clientIp = (c) => {
  const stamped = c.req.header('x-viewer-address');
  if (stamped) return stamped.trim();
  const cf = c.req.header('cloudfront-viewer-address');
  if (cf) return cf.replace(/:\d+$/, '').trim();
  return c.env?.event?.requestContext?.http?.sourceIp || 'unknown';
};
