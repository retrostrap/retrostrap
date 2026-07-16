// motion.js - the reduced-motion gate the whole framework consults (docs/08).
// Live: flipping the OS setting takes effect without a reload.

const query = typeof matchMedia === 'function'
  ? matchMedia('(prefers-reduced-motion: reduce)')
  : null;

/** True when the visitor has asked for less motion. */
export function reduced() {
  return !!query && query.matches;
}

/** True when motion is allowed, the reading most call sites want. */
export function allowed() {
  return !reduced();
}

/** Run cb now and whenever the preference changes. Returns an unsubscribe. */
export function onChange(cb) {
  if (!query) return () => {};
  const handler = () => cb(reduced());
  query.addEventListener('change', handler);
  return () => query.removeEventListener('change', handler);
}
