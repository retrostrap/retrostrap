// _overlay.js - the shared decoration layer. Every ambient effect draws into
// one of these: fixed, full-viewport, invisible to assistive tech, and unable
// to block a single click (docs/05 contract). Also the self-register helper
// every widget uses.

/** A fixed, pointer-transparent, aria-hidden overlay pinned to the fx band. */
export function overlay(className) {
  const el = document.createElement('div');
  el.className = className;
  el.setAttribute('aria-hidden', 'true');
  el.style.cssText =
    'position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:var(--rs-z-fx,600)';
  document.body.appendChild(el);
  return el;
}

/** Register a widget def against the page's Retrostrap, if one is loaded. */
export function selfRegister(def) {
  const rs = typeof window !== 'undefined' && (window.Retrostrap || window.RS);
  if (rs?.widget?.register) rs.widget.register(def);
  return def;
}

/** Where the shipped pixel assets live. Derived from the retrostrap script's
    own URL (works for both the core and toybox tags), overridable via
    Retrostrap.config({ assetBase }). */
export function assetBase() {
  const rs = typeof window !== 'undefined' && (window.Retrostrap || window.RS);
  const configured = rs?.config?.().assetBase;
  if (configured) return configured.replace(/\/$/, '');
  if (typeof document !== 'undefined') {
    const s = [...document.querySelectorAll('script[src]')]
      .find((x) => /retrostrap(-toybox)?(\.min)?\.js(\?|$)/.test(x.src));
    if (s) return s.src.replace(/[^/]*$/, '') + 'assets';
  }
  return 'assets';
}

/** A URL safe to put in an href or navigate to. Returns it unchanged if it
    resolves to http(s) or mailto (relative URLs included, they resolve against
    the page), otherwise '#'. Blocks javascript:/data:/vbscript: and friends,
    because widgets take URLs from federated webrings and visitor-signed
    guestbooks, which are untrusted. */
export function safeUrl(u) {
  try {
    const base = typeof location !== 'undefined' ? location.href : 'http://localhost/';
    const { protocol } = new URL(u, base);
    return (protocol === 'http:' || protocol === 'https:' || protocol === 'mailto:') ? u : '#';
  } catch {
    return '#';
  }
}

/** A value safe to drop inside a CSS url("...") sprite path. Rejects the characters that
    could close the quoted url() and smuggle a second declaration or an off-origin request
    (the Decency Law: no surprise network calls). Returns the value, or null if unsafe. */
export function cssUrl(u) {
  return typeof u === 'string' && u !== '' && !/["'()\\\s]/.test(u) ? u : null;
}
