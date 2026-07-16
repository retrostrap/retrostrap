// throttle.js, the write endpoints' abuse damper (infra/README.md "what's not in here yet"). Every
// gate is a self-expiring rl# token on the shared table, the boards' recipe: one
// atomic ADD per hit, the item's TTL retires the window. Pure over the injected
// ops (ops-dynamo.js binds the real table), so it tests with a Map.

const hourKey = (nowMs) => Math.floor(nowMs / 3600e3);
const dayKey = (nowMs) => new Date(nowMs).toISOString().slice(0, 10).replace(/-/g, ''); // yyyymmdd

export function throttle(ops) {
  // fail open on a storage error: the damper must never take the endpoint down
  const hit = async (scope, expiresAt) => {
    try { return await ops.rateHit(scope, expiresAt); } catch { return 0; }
  };
  return {
    /** Gate a submission's cheap checks: the honeypot short-circuits first, so a
        bot in the trap burns nobody's quota, then 5 an hour per address. The
        global day budget is NOT metered here, the handler charges it via
        mayOpenIssue only once the submission is well-formed, so junk POSTs can't
        burn the whole directory's daily allowance. Returns 'drop' | 'slow' | 'ok'. */
    async submit(input, ip, nowMs = Date.now()) {
      if (input.website) return 'drop';
      const nowS = Math.floor(nowMs / 1000);
      if ((await hit(`submit#${ip}#${hourKey(nowMs)}`, nowS + 3600)) > 5) return 'slow';
      return 'ok';
    },

    /** The shared GitHub-token day budget: 50 issues a day for everyone. Charged
        only after validation (see submit), so a flood of invalid submissions can't
        lock out the whole directory. Returns true while there's room. */
    async mayOpenIssue(nowMs = Date.now()) {
      return (await hit(`submit#all#${dayKey(nowMs)}`, Math.floor(nowMs / 1000) + 86400)) <= 50;
    },

    /** The ranking-inflation damper: one address gets 60 counted clicks an hour,
        /hit and /go share the bucket. Over it, the visitor still gets their
        204/302; the click just goes uncounted. */
    async mayCount(ip, nowMs = Date.now()) {
      return (await hit(`count#${ip}#${hourKey(nowMs)}`, Math.floor(nowMs / 1000) + 3600)) <= 60;
    },
  };
}
