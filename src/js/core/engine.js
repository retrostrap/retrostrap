// engine.js - the widget lifecycle (docs/05, docs/06). Widgets are the toys:
// separately loadable, opt-in via data-rs-widgets, and strictly optional. The
// engine owns everything a widget shouldn't reimplement: option parsing, the
// reduced-motion and coarse-pointer gates, offscreen pausing, budget wiring,
// and the init/destroy events. A widget just gets a clean ctx and returns a
// handle with destroy().

import { parseOptions, warnOnce } from './options.js';
import { emit } from './events.js';
import { reduced, onChange as onMotionChange } from './motion.js';
import { onFrame, budgetFor, status } from './budget.js';
import { announce } from './announce.js';

const defs = new Map();          // id -> definition
const instances = new WeakMap(); // el -> Map<id, handle>
const active = new Set();        // {id, el, motion}, iterable view for re-init
let seq = 0;

// Reduced-motion can change live (docs/08). Decorative widgets re-initialize
// so the change takes effect without a reload: snow stops spawning, the cat
// sits down, each widget's factory re-reads ctx.reducedMotion.
onMotionChange(() => {
  for (const record of [...active]) {
    if (record.motion !== 'decorative') continue;
    const map = instances.get(record.el);
    map?.get(record.id)?.destroy();
    init(record.id, record.el, record.overrides); // re-init with the SAME programmatic options, not just attributes
  }
});

// one shared observer pauses element-hosted widgets when they scroll away
const io = typeof IntersectionObserver === 'function'
  ? new IntersectionObserver((entries) => {
      for (const e of entries) {
        const h = e.target.__rsWidgetHandles;
        if (!h) continue;
        for (const handle of h.values()) {
          if (e.isIntersecting) handle.resume?.();
          else handle.pause?.();
        }
      }
    }, { rootMargin: '100px' })
  : null;

const coarsePointer = () =>
  typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;

// The core usually boots before a deferred Toybox bundle registers its
// widgets (registration re-inits them, so they still work). Hold the
// "unknown widget" warning until the page settles; a real typo still warns.
const lateUnknown = new Set();
const settled = () => typeof document === 'undefined' || document.readyState === 'complete';
if (!settled() && typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    for (const id of lateUnknown) if (!defs.has(id)) warnOnce(`unknown widget "${id}"`);
    lateUnknown.clear();
  }, { once: true });
}
const unknown = (id) => { if (settled()) warnOnce(`unknown widget "${id}"`); else lateUnknown.add(id); };

/** Register a widget definition. Last registration of an id wins. Registering
   also initializes the widget on any host already asking for it, so the load
   order of retrostrap.js and the Toybox doesn't matter. */
export function register(def) {
  if (!def || !def.id || typeof def.factory !== 'function') {
    warnOnce('widget.register needs { id, factory }');
    return;
  }
  if (defs.has(def.id)) warnOnce(`widget "${def.id}" re-registered`);
  defs.set(def.id, def);

  if (typeof document !== 'undefined' && document.readyState !== 'loading') {
    for (const host of document.querySelectorAll('[data-rs-widgets]')) {
      if (host.dataset.rsWidgets.split(/\s+/).includes(def.id)) init(def.id, host);
    }
  }
}

export function list() {
  return [...defs.keys()];
}

/** Initialize one widget on one element. Idempotent. Returns the handle. */
export function init(id, el, overrides = {}) {
  const def = defs.get(id);
  if (!def) { unknown(id); return null; }

  let map = instances.get(el);
  if (map?.has(id)) return map.get(id); // already running here

  // coarse-pointer gate: fine-only widgets no-op on touch (docs/08)
  if (def.pointer === 'fine' && coarsePointer()) {
    return null;
  }

  const options = parseOptions(el, id, overrides);
  const budget = budgetFor(`${id}-${++seq}`);
  const ctx = {
    options,
    reducedMotion: reduced(),
    pointerCoarse: coarsePointer(),
    budget,
    ticker: { add: onFrame },
    emit: (type, detail) => emit(el, type, detail),
    announce,
    log: warnOnce,
  };

  let inner;
  try {
    inner = def.factory(el, options, ctx) || {};
  } catch (err) {
    warnOnce(`${id}: ${err && err.message ? err.message : err}`);
    return null;
  }

  let destroyed = false;
  const handle = {
    id,
    el,
    options,
    pause: inner.pause,
    resume: inner.resume,
    destroy() {
      if (destroyed) return; // idempotent: a second destroy must not re-emit or double-count
      destroyed = true;
      try { inner.destroy?.(); } catch (e) { warnOnce(`${id} destroy: ${e && e.message}`); }
      budget.release();
      map?.delete(id);
      if (io && (!map || map.size === 0)) io.unobserve(el); // other widgets may still ride this host
      active.delete(record);
      const store = el.__rsWidgetHandles;
      store?.delete(id);
      emit(el, 'widget:destroy', { id });
    },
  };

  if (!map) instances.set(el, (map = new Map()));
  map.set(id, handle);
  (el.__rsWidgetHandles ||= new Map()).set(id, handle);
  const record = { id, el, motion: def.motion, overrides };
  active.add(record);

  // decorative widgets set aria-hidden on their own overlay node at creation;
  // the engine never hides the host, which may carry real content.

  if (io && el !== document.body) io.observe(el);
  emit(el, 'widget:init', { id, instance: handle });
  return handle;
}

/** Scan a subtree for data-rs-widgets="a b c" and init each listed widget. */
export function initFromAttributes(root = document) {
  const scope = root.querySelectorAll ? root : document;
  const hosts = [...scope.querySelectorAll('[data-rs-widgets]')];
  if (root.nodeType === 1 && root.matches?.('[data-rs-widgets]')) hosts.push(root);
  for (const host of hosts) {
    for (const id of host.dataset.rsWidgets.split(/\s+/).filter(Boolean)) {
      init(id, host);
    }
  }
  // taste, not just correctness: the era's cap is two decorative effects a page (docs/05)
  let ambient = 0;
  for (const w of active) if (w.motion === 'decorative') ambient++;
  if (ambient > 2) warnOnce(`${ambient} ambient effects on one page, the era's taste cap is two (docs/05)`);
}

/** Get a widget handle (or all of them) on an element. */
export function get(el, id) {
  const map = instances.get(el);
  if (!map) return id ? undefined : [];
  return id ? map.get(id) : [...map.values()];
}

/** Tear down every widget instance in a subtree. */
export function destroyIn(root = document) {
  const scope = root === document ? document.body || document : root;
  const walk = (el) => {
    const map = instances.get(el);
    if (map) for (const handle of [...map.values()]) handle.destroy();
    for (const child of el.children || []) walk(child);
  };
  if (scope.nodeType === 1) walk(scope);
  else for (const child of scope.children || []) walk(child);
}

export { status };
