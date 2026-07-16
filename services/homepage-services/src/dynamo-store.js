// dynamo-store.js, the homepage services backed by one on-demand DynamoDB
// table (infra/README.md). It exposes the SAME four-method shape as memoryStore, so
// services.js (the counter/guestbook logic) runs against it unchanged.
//
// The DynamoDB calls are injected as `ops` (ops-dynamo.js binds the AWS SDK).
// That keeps this file dependency-free and unit-testable at the repo root,
// the same trick the MCP server uses to keep its tested core SDK-free.

const GB_CAP = 1000; // most-recent entries kept per book

// Storage backstops (infra/README.md "what's not in here yet"): item TTLs bound what a key-spray can
// cost long-term. A counter refreshes ~2 years on every hit, so an abandoned
// page expires and an active one never does; a guestbook entry gets 180 days,
// the docs promise no longer.
export const COUNTER_TTL_S = 2 * 365 * 24 * 3600;
export const ENTRY_TTL_S = 180 * 24 * 3600;

/** Stamp the backstop TTL on an item (absolute Unix epoch, DynamoDB-style). */
export const withTtl = (item, ttlS, nowS = Math.floor(Date.now() / 1000)) => ({ ...item, ttl: nowS + ttlS });

/**
 * @param {{
 *   add:   (key:{pk,sk}, field:string, n:number, opts?:{ttl?:number}) => Promise<number>,  // atomic increment
 *   get:   (key:{pk,sk}) => Promise<object|null>,
 *   append:(pk:string, item:object) => Promise<void>,                 // append with a fresh sort key
 *   query: (pk:string, opts?:{limit?:number}) => Promise<object[]>,   // newest-first
 * }} ops
 */
export function dynamoStore(ops) {
  return {
    // ADD is atomic in DynamoDB, no read-modify-write, so the counter's whole
    // race condition simply doesn't exist here.
    bumpCounter: (page) => ops.add({ pk: `counter#${page}`, sk: 'n' }, 'count', 1),
    getCounter: (page) => ops.get({ pk: `counter#${page}`, sk: 'n' }).then((i) => (i ? i.count : 0)),

    addEntry: (book, entry) => ops.append(`gb#${book}`, entry).then(() => entry),
    listEntries: (book) => ops.query(`gb#${book}`, { limit: GB_CAP }).then((items) => items.filter((e) => e.approved)),

    /** Atomic self-expiring throttle token, the boards' rl# recipe. `expiresAt`
        is an ABSOLUTE Unix epoch (DynamoDB TTL). Returns the new count. */
    rateHit: (who, windowKey, expiresAt) => ops.add({ pk: `rl#${who}#${windowKey}`, sk: '-' }, 'n', 1, { ttl: expiresAt }),
  };
}
