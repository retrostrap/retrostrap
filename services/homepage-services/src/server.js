// server.js, a runnable homepage-services backend (counter, guestbook,
// webring) with zero dependencies, over the tested logic in services.js. It
// runs on the in-memory store out of the box; a store of the same shape (the
// shipped one is DynamoDB, infra/README.md) swaps in for a real deploy. No identifiers are ever logged or stored
// (Decency Law). CORS is open for reads so any homepage can call it.
import { createServer } from 'node:http';
import {
  memoryStore, counterHit, counterGet, counterThrottled,
  guestbookAdd, guestbookList, guestbookThrottled, webringNav,
} from './services.js';

// self-host has no CloudFront to stamp the viewer IP, so the socket address is the honest key here
// (never a client X-Forwarded-For, which is spoofable); it feeds the same damper the hosted path uses
const clientIp = (req) => req.socket?.remoteAddress || 'unknown';

// The hosted guestbook is opt-in (`{ guestbook: true }`, from GUESTBOOK_ENABLED
// on the runnable server), off by default: the Boards are the community home and
// spam-protect it far better; the counter and webring stay always-on.
export function createApp(store = memoryStore(), rings = new Map(), { guestbook = false, moderated = false } = {}) {
  return createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const send = (code, body) => {
      res.writeHead(code, {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
        'cache-control': 'no-store',
      });
      res.end(JSON.stringify(body));
    };
    const redirect = (to) => { res.writeHead(302, { location: to, 'cache-control': 'no-store' }); res.end(); };
    const body = () => new Promise((resolve) => {
      let s = ''; req.on('data', (c) => { s += c; if (s.length > 1e5) req.destroy(); });
      req.on('end', () => { try { resolve(JSON.parse(s || '{}')); } catch { resolve({}); } });
      // destroy() on the size guard emits close/error, not end: settle here too or the handler hangs
      req.on('close', () => resolve({}));
      req.on('error', () => resolve({}));
    });

    try {
      if (req.method === 'OPTIONS') return send(204, {});
      const [, section, id, action] = url.pathname.split('/');

      // /counter?page=/index.html  (GET reads, POST increments)
      if (section === 'counter') {
        const page = url.searchParams.get('page') || '/';
        let count;
        if (req.method === 'POST') {
          // over the per-address hourly allowance, report the total without bumping (the hosted path's rule)
          count = (await counterThrottled(store, clientIp(req), page)) ? await counterGet(store, page) : await counterHit(store, page);
        } else {
          count = await counterGet(store, page);
        }
        return send(200, { count });
      }

      // /guestbook/:book  (GET lists approved, POST adds) - opt-in, else 404
      if (section === 'guestbook' && id && guestbook) {
        if (req.method === 'POST') {
          const input = await body();
          if (String(input.website || '').trim() !== '') return send(201, { ok: true, pending: true }); // honeypot: feign success, store nothing
          if (await guestbookThrottled(store, clientIp(req))) return send(429, { error: 'Please slow down and try again shortly.' });
          const entry = await guestbookAdd(store, id, { ...input, date: new Date().toISOString().slice(0, 10) }, { moderated });
          return send(201, { ok: true, pending: !entry.approved });
        }
        return send(200, { entries: await guestbookList(store, id) });
      }

      // /webring/:ring/(next|prev|random)?from=<url>
      if (section === 'webring' && id && action) {
        const ring = rings.get(id);
        if (!ring) return send(404, { error: 'no such ring' });
        const nav = webringNav(ring, url.searchParams.get('from') || '', Date.now() % 997);
        const target = nav && ['next', 'prev', 'random'].includes(action) ? nav[action] : null; // not inRing/home
        if (target) return redirect(typeof target === 'string' ? target : target.url);
        return send(404, { error: 'no target' });
      }

      return send(404, { error: 'not found' });
    } catch (err) {
      return send(400, { error: 'bad request' }); // don't echo internals, even in dev
    }
  });
}

// run directly: `node src/server.js`
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const port = Number(process.env.PORT) || 8090;
  const guestbook = process.env.GUESTBOOK_ENABLED === '1';
  const moderated = process.env.GUESTBOOK_MODERATED === '1'; // classic unmoderated book by default; set 1 to hold entries for approval
  createApp(undefined, undefined, { guestbook, moderated }).listen(port, () =>
    console.log(`homepage-services on :${port} (in-memory, guestbook ${guestbook ? `on, ${moderated ? 'moderated' : 'live'}` : 'off'})`));
}
