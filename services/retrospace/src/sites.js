// sites.js, the in-memory sites store: submit, moderate, list, search (docs/12).
// This is the DB-free heart the frontend seeds and the tests drive. A real
// deployment swaps the array for DynamoDB (ops-dynamo.js, infra/README.md); the logic above it is unchanged.
import { normalizeCategories, normalizeLanguages } from './classify.js';
import { apply, dueForReview } from './moderation.js';
import { searchSites } from './search.js';
import { rankSites } from './toplist.js';

const copy = (s) => JSON.parse(JSON.stringify(s)); // deep, so callers can't mutate our store

// Normalize a URL for matching a member's homepage to a listing: http(s) only,
// drop the scheme, a leading www., a trailing slash, and case. So
// https://www.Example.com/ and http://example.com match.
function normUrl(u) {
  try {
    const url = new URL(String(u || '').trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return (url.host.replace(/^www\./i, '') + url.pathname.replace(/\/$/, '')).toLowerCase();
  } catch { return null; }
}

export function createStore(seed = []) {
  const sites = seed.map(copy);
  // start the id counter past any numeric id already seeded, and never collide
  let seq = sites.reduce((m, s) => { const n = /^s(\d+)$/.exec(s.id || ''); return n ? Math.max(m, +n[1]) : m; }, 0);
  const uid = () => { let id; do { id = `s${++seq}`; } while (sites.some((s) => s.id === id)); return id; };

  return {
    all: () => sites.map(copy),
    get: (id) => { const s = sites.find((x) => x.id === id); return s ? copy(s) : null; },

    // Is this URL a currently-listed site? Powers the Boards' "listed in
    // Retrospace" profile badge, the directory vouching for a member's homepage
    // (docs/11, docs/12). Matches on the normalized URL, listed sites only.
    listedByUrl(url) {
      const n = normUrl(url);
      if (!n) return null;
      const s = sites.find((x) => x.status === 'listed' && normUrl(x.url) === n);
      return s ? copy(s) : null;
    },

    submit(input, { actor = null } = {}) {
      const url = String(input.url || '').trim();
      if (!/^https?:\/\//i.test(url)) throw new Error('url must be http(s)');
      const n = normUrl(url);
      if (n && sites.some((s) => normUrl(s.url) === n)) throw new Error('url already submitted'); // one listing per url, trailing slash and all
      // A submission never sets its own moderation state, no id, status,
      // approver, check score, or review dates come from the submitter. A site
      // can't list itself; only a reviewer moves it (docs/12). Trusted seeding
      // uses createStore(seed), which keeps whatever the seed carries.
      const site = {
        id: uid(),
        url,
        title: String(input.title || '').trim(),
        blurb: String(input.blurb || '').trim(),
        categories: normalizeCategories(input.categories),
        languages: normalizeLanguages(input.languages),
        tags: Array.isArray(input.tags) ? input.tags.slice(0, 8).map((t) => String(t).slice(0, 32)) : [],
        submittedBy: actor,   // ownership comes from the trusted caller, never the input bag

        check: null,
        status: 'submitted',
        approvedAt: null,
        lastReviewedAt: null,
        nextReviewAt: null,
        approvedBy: null,
        inHits: 0,   // toplist counters, never from the submitter, only clicks move them
        outHits: 0,
      };
      sites.push(site);
      return copy(site);
    },

    // toplist: aggregate click counts, listed sites only (docs/12). in = traffic a
    // member sends to the toplist; out = traffic the toplist sends back to them.
    hitIn(id) { const s = sites.find((x) => x.id === id); if (!s || s.status !== 'listed') return null; s.inHits = (s.inHits || 0) + 1; return s.inHits; },
    hitOut(id) { const s = sites.find((x) => x.id === id); if (!s || s.status !== 'listed') return null; s.outHits = (s.outHits || 0) + 1; return s.outHits; },
    toplist: (opts) => rankSites(sites, opts),

    moderate(id, action, ctx = {}) {
      const i = sites.findIndex((s) => s.id === id);
      if (i < 0) throw new Error('no such site');
      const next = apply(sites[i], action, ctx);
      if ((action === 'approve' || action === 'relist') && ctx.by) next.approvedBy = ctx.by;
      sites[i] = next;
      return copy(next);
    },

    list({ status = 'listed', category, language } = {}) {
      let out = sites.filter((s) => (status ? s.status === status : true));
      if (category) out = out.filter((s) => (s.categories || []).includes(category));
      if (language) out = out.filter((s) => (s.languages || []).includes(language));
      return out.map(copy);
    },

    search: (query, filter) => searchSites(sites, query, filter).map(copy),
    due: (nowISO) => dueForReview(sites, nowISO).map(copy),
  };
}
