// handler.js, Retrospace write endpoints (infra/README.md), fronted at /api/retrospace/*.
// Browse, search, and the toplist ranking are static (sites.json on CloudFront) +
// client-side, so they have no route here. Three things write: a submission opens a
// GitHub issue (the git-PR moderation inbox, no admin auth, no submission DB); and
// the two toplist counters, in = a member's badge sent a visitor to us (302 back to
// the directory), out = we sent a visitor to a member (a beacon on click-through).
// Counts are aggregate + anonymous, and only ever touch a seeded, listed site.
// A coarse per-address damper (throttle.js) sits in front of all three writes.
import { timingSafeEqual } from 'node:crypto';
import { normalizeCategories, normalizeLanguages } from './classify.js';
import { createSubmissionIssue } from './submit-issue.js';
import { hitOps } from './ops-dynamo.js';
import { hitStore } from './hit-store.js';
import { throttle } from './throttle.js';

const env = process.env;
// The edge lock fails closed: without the secret the 403 check below never fires
// and every direct Function-URL caller walks straight past CloudFront (and its WAF).
if (!env.EDGE_SECRET) {
  throw new Error('EDGE_SECRET must be set (the CloudFront distribution stamps it as x-origin-verify)');
}

const ops = hitOps();
const hits = hitStore(ops);
const gate = throttle(ops);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type',
  'content-type': 'application/json',
  'x-content-type-options': 'nosniff',    // declared JSON stays JSON, everywhere
};
const json = (statusCode, body) => ({ statusCode, headers: CORS, body: JSON.stringify(body) });
const idOk = (id) => /^[\w-]{1,64}$/.test(id);
// Constant-time secret compare, fail-closed on a missing header.
const edgeSecretOk = (got, want) => {
  if (typeof got !== 'string' || typeof want !== 'string') return false;
  const a = Buffer.from(got);
  const b = Buffer.from(want);
  return a.length === b.length && timingSafeEqual(a, b);
};
// counting is best-effort: a throttle or transient error must never break the
// response the visitor actually needs (the 302, or the beacon's 204).
const countSafe = async (id, dir) => { if (idOk(id)) { try { await hits.count(id, dir); } catch { /* swallow */ } } };

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

  const path = (event.rawPath || '/').replace(/^\/api\/retrospace(?=\/|$)/, '').replace(/\/+$/, '') || '/';
  const q = event.queryStringParameters || {};
  let input = {};
  if (event.body) {
    try { input = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body); }
    catch { return json(400, { error: 'bad json' }); }
    if (!input || typeof input !== 'object' || Array.isArray(input)) input = {}; // a bare null/number/array is not a submission
  }

  try {
    // A submission never lists itself, it just opens an issue for a human. The
    // approver assigns id/status when they add it to the curated source in a PR.
    if (path === '/submit' && method === 'POST') {
      // the gate runs the honeypot first (bots fill it; drop, feign success),
      // then the quotas, so a trap visit never burns anyone's budget
      const verdict = await gate.submit(input, clientIp(event));
      if (verdict === 'drop') return json(202, { ok: true });
      if (verdict === 'slow') return json(429, { error: 'You are submitting very fast. Take a short breather and try again.' });
      const url = String(input.url || '').trim();
      if (!/^https?:\/\//i.test(url)) return json(400, { error: 'url must be http(s)' });
      const title = String(input.title || '').trim().slice(0, 120);
      if (!title) return json(400, { error: 'a title is required' });
      // charge the shared daily budget only now the submission is well-formed, so
      // junk POSTs can't spend the directory's whole day of GitHub-issue quota
      if (!(await gate.mayOpenIssue())) return json(429, { error: "The directory has hit today's submission limit. Please try again tomorrow." });
      const number = await createSubmissionIssue({
        url,
        title,
        blurb: String(input.blurb || '').trim().slice(0, 300),
        categories: normalizeCategories(input.categories),
        languages: normalizeLanguages(input.languages),
        tags: Array.isArray(input.tags) ? input.tags.slice(0, 8).map((t) => String(t).slice(0, 32)) : [], // mirror the store's per-tag cap
      });
      return json(202, { ok: true, issue: number });
    }

    // out: the directory beacons a click-through. The link's href already did the
    // navigation, so this is fire-and-forget, count if we can, 204 either way.
    // Over the damper, the click simply goes uncounted.
    if (path === '/hit' && method === 'POST') {
      if (await gate.mayCount(clientIp(event))) await countSafe(String(q.id || ''), 'out');
      return { statusCode: 204, headers: CORS };
    }

    // in: a member's Retrospace badge links here. Count the referral (best-effort),
    // then send the visitor on to the directory. A relative Location resolves against
    // this domain, so DIRECTORY_URL needs no hardcoded host.
    if (path === '/go' && method === 'GET') {
      if (await gate.mayCount(clientIp(event))) await countSafe(String(q.id || ''), 'in');
      const to = env.DIRECTORY_URL || '/';
      return { statusCode: 302, headers: { location: to, 'cache-control': 'no-store' } };
    }

    return json(404, { error: 'not found' });
  } catch {
    return json(500, { error: 'server error' }); // don't echo internals to the client
  }
}
