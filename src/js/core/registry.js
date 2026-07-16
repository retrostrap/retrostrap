// registry.js - the enhancer registry and the per-element handle store.
// An enhancer is { name, selector, enhance(el, options) -> handle }. boot()
// walks the registry; init/destroy live here so there is one source of truth.

import { parseOptions, warnOnce } from './options.js';
import { emit } from './events.js';

const enhancers = [];
// el -> Map<enhancerName, handle>. WeakMap so detached nodes are collectable.
const handles = new WeakMap();

/** Register a component enhancer. Later registration of the same name wins. */
export function register(enhancer) {
  const i = enhancers.findIndex((e) => e.name === enhancer.name);
  if (i >= 0) {
    warnOnce(`enhancer "${enhancer.name}" re-registered`);
    enhancers[i] = enhancer;
  } else {
    enhancers.push(enhancer);
  }
}

export function registered() {
  return enhancers.map((e) => e.name);
}

/** Enhance one element with one enhancer, idempotently. */
function enhanceOne(el, enhancer) {
  let map = handles.get(el);
  if (map?.has(enhancer.name)) return; // already done
  let handle;
  try {
    handle = enhancer.enhance(el, parseOptions(el, enhancer.name)) || {};
  } catch (err) {
    warnOnce(`${enhancer.name}: ${err && err.message ? err.message : err}`);
    return; // a broken enhancer never breaks the page
  }
  handle.el = el;
  handle.id = enhancer.name;
  if (!map) handles.set(el, (map = new Map()));
  map.set(enhancer.name, handle);
  emit(el, 'widget:init', { id: enhancer.name, instance: handle });
}

/** Scan a subtree and enhance everything the registry recognizes. */
export function init(root = document) {
  const scope = root === document ? document : root;
  for (const enhancer of enhancers) {
    const matches = scope.querySelectorAll(enhancer.selector);
    for (const el of matches) enhanceOne(el, enhancer);
    // an enhancer's selector can also match the root element itself
    if (root.nodeType === 1 && root.matches?.(enhancer.selector)) enhanceOne(root, enhancer);
  }
}

/** Tear down every handle in a subtree (SPA unmount hook). */
export function destroy(root = document) {
  const scope = root === document ? document.body || document : root;
  const walk = (el) => {
    const map = handles.get(el);
    if (map) {
      for (const [name, handle] of map) {
        try {
          handle.destroy?.();
        } catch (err) {
          warnOnce(`${name} destroy: ${err && err.message ? err.message : err}`);
        }
        emit(el, 'widget:destroy', { id: name });
      }
      handles.delete(el);
    }
    for (const child of el.children || []) walk(child);
  };
  if (scope.nodeType === 1) walk(scope);
  else for (const child of scope.children || []) walk(child);
}

/** Get the handle(s) attached to an element. */
export function getHandle(el, name) {
  const map = handles.get(el);
  if (!map) return name ? undefined : [];
  return name ? map.get(name) : [...map.values()];
}
