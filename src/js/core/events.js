// events.js - the rs:* CustomEvent seam (docs/06). Everything the framework
// wants to tell you bubbles from the element it happened on.

/** Fire a bubbling, cancelable rs:<type> event; returns false if prevented. */
export function emit(el, type, detail = {}) {
  return el.dispatchEvent(
    new CustomEvent(`rs:${type}`, { bubbles: true, cancelable: true, detail })
  );
}

/** Listen for an rs:<type> event at the document level. Returns an off(). */
export function on(type, handler) {
  const wrapped = (e) => handler(e);
  document.addEventListener(`rs:${type}`, wrapped);
  return () => document.removeEventListener(`rs:${type}`, wrapped);
}
