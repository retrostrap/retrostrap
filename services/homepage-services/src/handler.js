// handler.js, the Lambda (Function URL) entry for the homepage services, fronted
// through CloudFront on /api/* (infra/README.md). The counter and guestbook widgets embed
// on other people's pages, so CORS is open, there are no cookies or credentials
// here, nothing to steal. Webring stays entirely client-side; no route for it.
import { timingSafeEqual } from 'node:crypto';
import { counterHit, counterGet, counterThrottled, guestbookAdd, guestbookList, guestbookThrottled } from './services.js';
import { dynamoStore } from './dynamo-store.js';
import { dynamoOps } from './ops-dynamo.js';

const env = process.env;
// The edge lock fails closed: without the secret the 403 check below never fires
// and every direct Function-URL caller walks straight past CloudFront (and its WAF).
if (!env.EDGE_SECRET) {
  throw new Error('EDGE_SECRET must be set (the CloudFront distribution stamps it as x-origin-verify)');
}

const store = dynamoStore(dynamoOps());

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json',
  // guestbook entries echo back verbatim; no browser gets to second-guess the type
  'x-content-type-options': 'nosniff',
};
const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });
// Constant-time secret compare, fail-closed on a missing header.
const edgeSecretOk = (got, want) => {
  if (typeof got !== 'string' || typeof want !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
};

// Trust only edge-set signals for the caller's address, never x-forwarded-for
// (spoofable): the x-viewer-address our CloudFront Function stamps as a bare IP,
// then CloudFront-Viewer-Address ("ip:port"), then the Lambda event's source IP.
// Only the CloudFront header carries a port; stripping ":digits" from a bare
// IPv6 would eat its last hextet, so the stamped header is used untouched.
const clientIp = (event) => {
  const h = event.headers || {};
  if (h['x-viewer-address']) return h['x-viewer-address'].trim();
  if (h['cloudfront-viewer-address']) return h['cloudfront-viewer-address'].replace(/:\d+$/, '').trim();
  return event.requestContext?.http?.sourceIp || 'unknown';
};

export async function handler(event) {
  // requests without the stamped secret never came through our distribution
  if (!edgeSecretOk(event?.headers?.['x-origin-verify'], env.EDGE_SECRET)) {
    return { statusCode: 403, headers: { 'content-type': 'text/plain' }, body: 'forbidden' };
  }
  const method = event.requestContext?.http?.method || 'GET';
  if (method === 'OPTIONS') return { statusCode: 204, headers: CORS };

  // CloudFront forwards the matched path verbatim (/api/counter), so strip the
  // /api segment; direct Function-URL access (/counter) is unaffected.
  const path = (event.rawPath || '/').replace(/^\/api(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const q = event.queryStringParameters || {};
  let input = {};
  if (event.body) {
    try { input = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body); }
    catch { return json(400, { error: 'bad json' }); }
  }

  try {
    if (path === '/counter') {
      const page = q.page ?? input.page; // query is the contract; body is a tolerated fallback
      if (method === 'POST') {
        // every hit counts, but damp one address hammering a page (inflation + write cost);
        // over the damper we report the running total without bumping it
        if (await counterThrottled(store, clientIp(event), page)) return json(200, { count: await counterGet(store, page) });
        return json(200, { count: await counterHit(store, page) });
      }
      return json(200, { count: await counterGet(store, page) });
    }

    // The hosted guestbook is opt-in (GUESTBOOK_ENABLED=1), off by default: the
    // community lives on the Boards, which are far better spam-protected, and no
    // page of ours points at it. The counter stays always-on. Disabled → 404.
    const gb = env.GUESTBOOK_ENABLED === '1' && path.match(/^\/guestbook\/([\w.-]{1,64})$/); // bounded book key
    if (gb) {
      const book = gb[1];
      if (method === 'POST') {
        if (input.website) return json(200, { ok: true }); // honeypot: bots fill it; drop, feign success
        if (await guestbookThrottled(store, clientIp(event))) {
          return json(429, { error: 'You are signing very fast. Take a short breather and try again.' });
        }
        // classic guestbooks show entries at once, the widget renders text-only, so
        // there's nothing to inject; honeypot + throttle + caps are the spam control.
        // Set GUESTBOOK_MODERATED=1 to hold entries (needs an out-of-band approval path).
        const moderated = env.GUESTBOOK_MODERATED === '1';
        const entry = await guestbookAdd(store, book, { ...input, date: new Date().toISOString() }, { moderated });
        return json(201, { ok: true, entry });
      }
      return json(200, { entries: await guestbookList(store, book) });
    }

    return json(404, { error: 'not found' });
  } catch {
    return json(500, { error: 'server error' }); // don't echo internals to the client
  }
}
