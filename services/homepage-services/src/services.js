// services.js, the logic behind the hit-counter, guestbook, and webring
// widgets (docs/05, docs/11 companion). Pure functions over a storage
// interface, so they test without a database and deploy against DynamoDB. The
// counter counts HITS, never people, it stores no IP, no user agent, no
// identifier of any kind (Decency Law).

/** A tiny in-memory store for tests and local dev. Production passes the DynamoDB
    adapter (dynamo-store.js, infra/README.md) with the same shape. */
export function memoryStore() {
  const counters = new Map();       // page -> count
  const guestbooks = new Map();     // book -> [entries]
  // Storage-exhaustion guards: without them, a spray of distinct page/book keys
  // or an endless entry flood grows memory without bound. The DynamoDB adapter
  // does not enforce these: infra/README.md accepts a key flood as growing cost, not errors,
  // with the item TTL as a backstop and a WAF as the lever when it is needed.
  const MAX_KEYS = 50000, MAX_ENTRIES = 1000;
  const rates = new Map();          // rl token -> { n, expiresAt }
  return {
    async bumpCounter(page) {
      if (!counters.has(page) && counters.size >= MAX_KEYS) throw new Error('counter capacity reached');
      const n = (counters.get(page) || 0) + 1; counters.set(page, n); return n;
    },
    async rateHit(who, windowKey, expiresAt) {
      const nowS = Math.floor(Date.now() / 1000);
      for (const [k, v] of rates) if (v.expiresAt <= nowS) rates.delete(k); // lazy expiry, like the table's TTL
      const k = `${who}#${windowKey}`;
      const v = rates.get(k) || { n: 0, expiresAt };
      v.n += 1;
      rates.set(k, v);
      return v.n;
    },
    async getCounter(page) { return counters.get(page) || 0; },
    async addEntry(book, entry) {
      if (!guestbooks.has(book) && guestbooks.size >= MAX_KEYS) throw new Error('guestbook capacity reached');
      const list = guestbooks.get(book) || [];
      list.unshift(entry);
      if (list.length > MAX_ENTRIES) list.length = MAX_ENTRIES; // keep the newest
      guestbooks.set(book, list);
      return entry;
    },
    async listEntries(book) { return (guestbooks.get(book) || []).filter((e) => e.approved); },
  };
}

/** Increment and return the hit count for a page path. No identifiers stored. */
export async function counterHit(store, page) {
  return store.bumpCounter(cleanPage(page));
}
export async function counterGet(store, page) {
  return store.getCounter(cleanPage(page));
}

/** Counter damper, the same recipe as the guestbook and the Retrospace clicks:
    every visitor still counts, but one address can bump a given page at most 60
    times an hour, so a script can't inflate a counter (or run up our write bill)
    without bound. The rl# token self-expires (table TTL). Returns true when the
    address is over its hourly allowance for that page; the caller then reports the
    current total without bumping (the hit simply goes uncounted, as in the 2000s a
    reload might or might not tick). */
export async function counterThrottled(store, ip, page, nowS = Math.floor(Date.now() / 1000)) {
  return (await store.rateHit(`ip:${ip}`, `count:${cleanPage(page)}:${Math.floor(nowS / 3600)}`, nowS + 3600)) > 60;
}
function cleanPage(page) {
  return String(page || '/').slice(0, 300).replace(/[?#].*$/, ''); // path only, bounded
}

/** Add a guestbook entry. Text fields only, stored VERBATIM as untrusted text:
    consumers MUST render them with textContent, never innerHTML (the shipped
    widget does, the only URL field, homepage, is http(s)-gated by httpUrl).
    New entries start unapproved when moderation is on. */
export async function guestbookAdd(store, book, input, { moderated = true } = {}) {
  const entry = {
    name: str(input.name, 40) || 'Guest',
    from: str(input.from, 60),
    message: str(input.message, 2000),
    homepage: httpUrl(input.homepage),
    date: str(input.date, 40) || null,   // caller stamps the date (services stay clock-free in tests)
    approved: !moderated,
  };
  if (!entry.message) throw new Error('a guestbook entry needs a message');
  return store.addEntry(book, entry);
}
export async function guestbookList(store, book) {
  return store.listEntries(book);
}

/** Guestbook write throttle: ten signatures an hour per address, plenty for a
    person, a wall for a script. The rl# token expires on its own (DynamoDB
    TTL), so a new hour is a clean slate. Checked AFTER the honeypot, a bot in
    the trap burns no quota. */
export async function guestbookThrottled(store, ip, nowS = Math.floor(Date.now() / 1000)) {
  return (await store.rateHit(`ip:${ip}`, `sign:${Math.floor(nowS / 3600)}`, nowS + 3600)) > 10;
}

function str(v, max) { return typeof v === 'string' ? v.trim().slice(0, max) : ''; }
function httpUrl(v) {
  if (typeof v !== 'string') return null;
  const u = v.trim().slice(0, 300);
  // http(s) only, and reject the chars that let a stored URL break out of an href attribute in a
  // careless third-party consumer. The shipped widget renders text-only; this is belt and braces.
  return /^https?:\/\//i.test(u) && !/[\s<>"'`]/.test(u) ? u : null;
}

/** Compute prev/random/next for a ring, given the current site URL. Mirrors the
    webring widget, server-side, for the hosted-ring service. */
export function webringNav(ring, currentUrl, seed = 0) {
  const sites = (ring && ring.sites) || [];
  if (!sites.length) return null;
  const here = norm(currentUrl);
  let i = sites.findIndex((s) => norm(s.url) === here);
  const inRing = i >= 0;
  if (!inRing) i = 0;
  const n = sites.length;
  const step = ((seed % (n - 1 || 1)) + 1);
  return {
    inRing,
    prev: sites[(i - 1 + n) % n],
    next: sites[(i + 1) % n],
    random: sites[(i + step) % n],
    home: ring.home || null,
  };
}
function norm(u) { return String(u || '').replace(/\/$/, ''); }
