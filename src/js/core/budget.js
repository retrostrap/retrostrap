// budget.js - the one animation loop and the budget governor (docs/08). Every
// widget shares this rAF loop; the governor watches its frame time and, when
// the page can't keep up, quietly thins the particles instead of stuttering.
// The loop pauses whenever the tab is hidden. Nothing here uses Date.now;
// the rAF timestamp is the clock.

const FRAME_BUDGET = 24;     // ms; sustained slower than this degrades
const ALPHA = 0.1;           // EMA smoothing
const DEGRADE_AFTER = 2000;  // ms over budget before stepping down
const RECOVER_AFTER = 10000; // ms comfortably fast before stepping back up
const PARTICLE_CAP = 150;    // global live-particle ceiling
const LADDER = [1, 0.75, 0.56, 0.42, 0]; // density multiplier per rung

let rung = 0;
let ema = 16;
let overSince = 0;
let underSince = 0;
let last = 0;
let running = false;
const callbacks = new Set();
const claims = new Map(); // instanceId -> requested count

const hasRaf = typeof requestAnimationFrame === 'function';

function loop(now) {
  const dt = last ? now - last : 16;
  last = now;
  if (dt < 100) ema += ALPHA * (dt - ema); // ignore tab-wake / debugger gaps
  govern(now);
  for (const cb of callbacks) {
    try { cb(dt); } catch { /* a broken tick never breaks the loop */ }
  }
  if (running && callbacks.size && visible()) requestAnimationFrame(loop);
  else { running = false; last = 0; }
}

function start() {
  if (running || !hasRaf || !callbacks.size || !visible()) return;
  running = true;
  last = 0;
  requestAnimationFrame(loop);
}

function govern(now) {
  // Two independent clocks, each cleared the moment its own condition lapses.
  // The common 16-24ms band is over neither threshold, so both reset there; that
  // stops a stale "over since" timestamp from surviving a recovery and tripping
  // an instant step-down on the next single slow frame.
  if (ema > FRAME_BUDGET) {
    overSince ||= now;
    if (now - overSince > DEGRADE_AFTER && rung < LADDER.length - 1) {
      rung++;
      overSince = now;
      if (LADDER[rung] === 0) {
        // eslint-disable-next-line no-console
        console.warn('[retrostrap] frame budget exceeded, ambient effects disabled');
      }
      announce();
    }
  } else {
    overSince = 0;
  }

  if (ema < 16) {
    underSince ||= now;
    if (now - underSince > RECOVER_AFTER && rung > 0) {
      rung--;
      underSince = now;
      announce();
    }
  } else {
    underSince = 0;
  }
}

function announce() {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('rs:budget:degraded', {
      bubbles: true,
      detail: { level: rung, multiplier: LADDER[rung], frameMs: Math.round(ema) },
    }));
  }
}

const visible = () => typeof document === 'undefined' || document.visibilityState !== 'hidden';

/** Register a per-frame callback; returns a remover. Starts the loop. */
export function onFrame(cb) {
  callbacks.add(cb);
  start();
  return () => callbacks.delete(cb);
}

/** A budget handle scoped to one widget instance. */
export function budgetFor(id) {
  return {
    claim(want) { claims.set(id, Math.max(0, want | 0)); return this.grant(); },
    grant() {
      const want = claims.get(id) || 0;
      let total = 0;
      for (const n of claims.values()) total += n;
      const capScale = total > PARTICLE_CAP ? PARTICLE_CAP / total : 1;
      return Math.floor(want * LADDER[rung] * capScale);
    },
    release() { claims.delete(id); },
  };
}

export function status() {
  let particles = 0;
  for (const n of claims.values()) particles += n;
  return { particles, cap: PARTICLE_CAP, degraded: rung > 0, level: rung, frameMs: Math.round(ema) };
}

// tab hidden -> pause the loop and every CSS animation; visible -> resume
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    document.documentElement.classList.toggle('rs-paused', !visible());
    if (visible()) start();
  });
}
