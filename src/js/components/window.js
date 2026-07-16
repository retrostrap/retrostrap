// window.js - the Phase 1 window enhancer wires the control buttons and F6
// cycling. Dragging, minimize-to-dock, and the five-window cap arrive with
// the windows widget (docs/05); this keeps the furniture keyboard-usable.
import { emit } from '../core/events.js';
import { announce } from '../core/announce.js';

function enhance(el) {
  const ac = new AbortController();
  const { signal } = ac; // one signal removes every listener below on destroy
  const controls = el.querySelector('.rs-window__controls');
  const body = el.querySelector('.rs-window__body');
  const statusbar = el.querySelector('.rs-window__statusbar');

  const byLabel = (needle) =>
    controls && [...controls.querySelectorAll('button')].find((b) =>
      (b.getAttribute('aria-label') || '').toLowerCase().includes(needle));

  const minBtn = byLabel('minimize');
  const closeBtn = byLabel('close');
  const restoreBtn = byLabel('restore');

  // snapshot the DOM we're about to mutate, so destroy() can hand it back untouched
  const initialElHidden = el.hidden;
  const initialMinimized = el.hasAttribute('data-rs-minimized');
  const initialMinLabel = minBtn ? minBtn.getAttribute('aria-label') : null;

  const setHidden = (hide) => {
    if (body) body.hidden = hide;
    if (statusbar) statusbar.hidden = hide;
  };

  // the window's accessible name, for spoken state changes (docs/08)
  const label = () => (el.querySelector('.rs-window__title') || el.querySelector('.rs-window__titlebar'))?.textContent?.trim() || 'Window';

  // the minimize button is a toggle, so its accessible name flips with the state
  function minimize() { setHidden(true); el.setAttribute('data-rs-minimized', ''); minBtn?.setAttribute('aria-label', 'Restore window'); announce(`${label()} minimized`); emit(el, 'window:minimize'); }
  function restore() { setHidden(false); el.removeAttribute('data-rs-minimized'); minBtn?.setAttribute('aria-label', 'Minimize window'); announce(`${label()} restored`); emit(el, 'window:restore'); }
  function close() {
    const name = label();
    el.hidden = true;
    // never strand focus on a hidden window: hand it to the next open one
    const open = [...document.querySelectorAll('.rs-window:not([hidden])')].filter((w) => w !== el);
    open[0]?.querySelector('.rs-window__titlebar')?.focus();
    announce(`${name} closed`);
    emit(el, 'window:close');
  }
  function focusWindow() {
    (el.querySelector('.rs-window__titlebar') || el).focus?.();
    emit(el, 'window:focus');
  }

  minBtn?.addEventListener('click', () => (el.hasAttribute('data-rs-minimized') ? restore() : minimize()), { signal });
  restoreBtn?.addEventListener('click', restore, { signal });
  closeBtn?.addEventListener('click', close, { signal });

  // F6 cycles to the next open window's titlebar
  const onKey = (e) => {
    if (e.key !== 'F6') return;
    const all = [...document.querySelectorAll('.rs-window:not([hidden])')];
    const here = all.indexOf(el);
    const next = all[(here + 1) % all.length];
    if (next && next !== el) {
      e.preventDefault();
      next.querySelector('.rs-window__titlebar')?.focus();
    }
  };
  el.addEventListener('keydown', onKey, { signal });

  // let the titlebar receive focus for F6 to land on
  const bar = el.querySelector('.rs-window__titlebar');
  const barHadTabindex = bar ? bar.hasAttribute('tabindex') : true;
  if (bar && !barHadTabindex) bar.tabIndex = -1;

  return {
    minimize, restore, close, focus: focusWindow,
    destroy() {
      ac.abort();
      // leave the window as we found it: undo any minimize/close state and the
      // tabindex we added, so nothing is left visually stuck after teardown.
      el.hidden = initialElHidden;
      setHidden(initialMinimized); // restore visibility silently, no announce/emit on teardown
      if (initialMinimized) el.setAttribute('data-rs-minimized', ''); else el.removeAttribute('data-rs-minimized');
      if (minBtn) { if (initialMinLabel == null) minBtn.removeAttribute('aria-label'); else minBtn.setAttribute('aria-label', initialMinLabel); }
      if (bar && !barHadTabindex) bar.removeAttribute('tabindex');
    },
  };
}

export default { name: 'window', selector: '.rs-window', enhance };
