// options.js - one parser, one grammar, every enhancer and (later) widget.
// data-rs-<name>-<option> in kebab-case becomes a camelCase option, cast by
// shape: booleans, numbers, JSON, or plain strings (docs/06).

const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Cast a raw attribute string the way its shape suggests. */
export function cast(raw) {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw);
  if (/^\s*[[{]/.test(raw)) {
    try {
      // drop prototype-pollution keys so a future deep-merge of an option can't be a sink
      return JSON.parse(raw, (k, v) => (k === '__proto__' || k === 'constructor' || k === 'prototype') ? undefined : v);
    } catch {
      warnOnce(`could not parse JSON option: ${raw.slice(0, 40)}`);
      return raw;
    }
  }
  return raw;
}

/**
 * Read every data-rs-<name>-* attribute off an element into an options object.
 * JS-supplied overrides win over attributes (the caller merges them on top).
 */
export function parseOptions(el, name, overrides = {}) {
  const prefix = `rs${name.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`;
  const out = {};
  for (const key in el.dataset) {
    if (key.startsWith(prefix) && key.length > prefix.length) {
      const opt = camel(key.slice(prefix.length).replace(/^./, (c) => c.toLowerCase()));
      out[opt] = cast(el.dataset[key]);
    }
  }
  return { ...out, ...overrides };
}

const warned = new Set();
/** Warn a given message at most once per page load; decoration never shouts. */
export function warnOnce(msg) {
  if (warned.has(msg)) return;
  warned.add(msg);
  // eslint-disable-next-line no-console
  console.warn(`[retrostrap] ${msg}`);
}
