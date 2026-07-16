// theme.js - the theme switcher helper (docs/07). Sets data-rs-theme on the
// root, remembers the choice, and announces the change. Loading the theme's
// stylesheet is the page's job; this flips the token scope. Re-applying a
// remembered choice on load is the page's job too (the docs site does it in
// its head): a page that declares its own theme must keep it.

import { emit } from './events.js';

const KEY = 'rs:theme';

export function get() {
  return document.documentElement.getAttribute('data-rs-theme') || 'classic';
}

export function set(name) {
  const previous = get();
  document.documentElement.setAttribute('data-rs-theme', name);
  try {
    localStorage.setItem(KEY, name);
  } catch {
    /* private mode, or no storage, the switch still works for this page */
  }
  emit(document.documentElement, 'theme:change', { theme: name, previous });
  return name;
}
