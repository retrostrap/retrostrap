// hit-store.js, the toplist counter logic over a storage interface (infra/README.md).
// Pure and testable: the deploy binds a DynamoDB `ops`, tests bind a fake. The
// mechanics are the classic topsite's, in = a member's badge sent a visitor to
// us (the ranking signal), out = we sent a visitor to a member. Counts are
// aggregate and anonymous; no visitor is ever identified (the Decency Law).
const FIELD = { in: 'inHits', out: 'outHits' };

export function hitStore(ops) {
  return {
    // Count one click for a listed site. Unknown or unlisted ids are silently not
    // counted (ops.add returns false) and never created, no orphan counters.
    count: (id, dir) => ops.add(id, FIELD[dir] || FIELD.out),

    // Seed a marker for each listed site (idempotent, never clobbers counts, seeds
    // the floor from the site's curated counts) and read the tallies back. Both the
    // seeding step and the export read, in one pass. Resilient per site: one throttled
    // write is skipped, not fatal, so the rest of the export still lands.
    async sync(sites) {
      const hits = {};
      for (const s of sites) {
        try { hits[s.id] = await ops.seedAndRead(s.id, { inHits: s.inHits || 0, outHits: s.outHits || 0 }); }
        catch { /* skip this one; the next tick retries it */ }
      }
      return hits;
    },
  };
}
