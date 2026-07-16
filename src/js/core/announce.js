// announce.js - one page-wide polite live region, owned by the engine (docs/08).
// Retrostrap.announce(text) writes here, debounced and de-duplicated, so widgets
// never mint aria-live regions of their own and screen readers get one calm feed.

let region = null;
let last = '';
let pending = '';
let timer = null;

function ensureRegion() {
  if (region && region.isConnected) return region;
  region = document.getElementById('rs-live');
  if (!region) {
    region = document.createElement('div');
    region.id = 'rs-live';
    region.className = 'rs-sr-only';
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    document.body.appendChild(region);
  }
  return region;
}

/** Announce a short status message politely. Debounced 150ms; a message
    identical to the last one announced is dropped (docs/08). */
export function announce(text) {
  if (typeof document === 'undefined' || !text) return;
  pending = String(text);
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (pending === last) return; // don't repeat the same thing back to back
    last = pending;
    ensureRegion().textContent = pending;
  }, 150);
}
