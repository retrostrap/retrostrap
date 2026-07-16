// index.js - the public surface. Small on purpose: if the API fits in your
// head, it fits in a prompt, and it fits in 1999 (docs/06).

import { init as initEnhancers, destroy as destroyEnhancers, register as registerEnhancer, registered, getHandle } from './core/registry.js';
import * as engine from './core/engine.js';
import { on, emit } from './core/events.js';
import * as theme from './core/theme.js';
import * as motion from './core/motion.js';
import { audit } from './core/audit.js';
import { announce } from './core/announce.js';

// component enhancers, registered explicitly. Explicit registration (rather
// than a bare self-registering import) keeps these in the bundle: with
// package.json sideEffects scoped to CSS, a side-effect-only import would be
// tree-shaken away.
import marquee from './components/marquee.js';
import spoiler from './components/spoiler.js';
import menu from './components/menu.js';
import tabs from './components/tabs.js';
import windowEnhancer from './components/window.js';
import splash from './components/splash.js';
import statusbar from './components/statusbar.js';
import dialogEnhancer, * as dialog from './components/dialog.js';

for (const e of [marquee, spoiler, menu, tabs, windowEnhancer, splash, statusbar, dialogEnhancer]) {
  registerEnhancer(e);
}

const version = '0.1.1';
// the global settings bag. assetBase is the one key consumed today (docs/06),
// read by the Toybox through Retrostrap.config().assetBase to find its sprites.
// No reduced-motion knob lives here on purpose: honoring the preference is not
// something you get to opt out of (docs/06).
let config = {};

// init/destroy cover both layers: the always-on component enhancers and the
// opt-in widgets declared via data-rs-widgets.
function init(root = document) {
  initEnhancers(root);
  engine.initFromAttributes(root);
}
function destroy(root = document) {
  engine.destroyIn(root);
  destroyEnhancers(root);
}

const Retrostrap = {
  version,
  init,
  destroy,
  on,
  emit: (el, type, detail) => emit(el, type, detail),
  ui: (el, name) => getHandle(el, name),
  theme: { get: theme.get, set: theme.set },
  dialog: { alert: dialog.alert, confirm: dialog.confirm },
  motion: { allowed: motion.allowed, reduced: motion.reduced, onChange: motion.onChange },
  budget: { status: engine.status },
  announce,
  config(next) {
    if (next) config = { ...config, ...next };
    return { ...config };
  },
  audit,
  // the widget engine: register a toy, init it, find it, list them
  widget: {
    register: engine.register,
    init: engine.init,
    get: engine.get,
    list: engine.list,
  },
  // the component enhancers are internal chrome, exposed here only so tooling
  // (and the bundle-integrity test) can see they all made it in
  enhancers: registered,
};

function boot() {
  theme.restore();
  init(document);
  emit(document.documentElement, 'ready', { version });
  greet();
}

// A quiet hello to the webmaster, dev hosts only. Console spam on a visitor's
// site would be modern-rude, so gating it is the Decency Law thinking too.
function greet() {
  try {
    const h = location.hostname;
    if (h !== 'localhost' && h !== '127.0.0.1' && location.protocol !== 'file:') return;
    console.log('%c ~ welcome, webmaster ~ ', 'background:#000080;color:#FFFFFF;font-weight:bold');
    console.log(`retrostrap v${version}, try Retrostrap.audit(), or find the code.`);
  } catch { /* no console, no worries */ }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
  // convenience globals; ESM consumers import the named export instead
  window.Retrostrap = Retrostrap;
  window.RS = Retrostrap;
}

export default Retrostrap;
export { Retrostrap };
