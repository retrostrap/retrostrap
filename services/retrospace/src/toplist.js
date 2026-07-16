// toplist.js, the in/out visit toplist for listed sites (docs/12). Classic
// topsite mechanics: a member puts the toplist link on their page, the
// click-throughs IN rank them, and the toplist sends traffic back OUT. These
// are aggregate click counts only, no visitor, IP, or identifier is ever
// stored, exactly like the hit-counter (the Decency Law reaches here too).

/**
 * Rank listed sites by inbound traffic, most sent to the toplist ranks highest,
 * the way the old topsites did it. Ties break by outbound clicks, then title, so
 * the order is stable across calls.
 * @returns {{ rank: number, id, title, url, inHits, outHits }[]}
 */
export function rankSites(sites, { limit = 100 } = {}) {
  const cap = Number.isFinite(limit) ? Math.max(0, Math.trunc(limit)) : sites.length; // Infinity/big = "all", not | 0 → 0
  return sites
    .filter((s) => s.status === 'listed')
    .map((s) => ({ id: s.id, title: s.title, url: s.url, inHits: s.inHits || 0, outHits: s.outHits || 0 }))
    .sort((a, b) => b.inHits - a.inHits || b.outHits - a.outHits || String(a.title).localeCompare(String(b.title)))
    .slice(0, cap)
    .map((s, i) => ({ rank: i + 1, ...s }));
}
