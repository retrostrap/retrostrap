// splash.js - the click-to-enter ceremony. Without JS the splash stays
// hidden and the page just loads; with JS a real <dialog> opens modally, so
// focus stays inside the ceremony and Esc dismisses it, both for free. It
// closes on Enter, Space, a click on the enter button, or Esc. A page that
// asked to be remembered skips it next time. Non-dialog markup falls back to
// a plain hidden-toggle overlay.
import { emit } from '../core/events.js';

function enhance(el, options) {
  const key = `rs:splash:${location.pathname}`;
  const remember = Number(options.remember) || 0; // days; 0 = ask every time
  const modal = el.tagName === 'DIALOG' && typeof el.showModal === 'function';
  const hide = () => { if (modal) { if (el.open) el.close(); } else el.hidden = true; };
  const show = () => { el.removeAttribute('hidden'); if (modal) { if (!el.open) el.showModal(); } };

  if (remember && seenRecently(key, remember)) {
    hide();
    return { enter() {}, reset() { forget(key); } };
  }

  show();
  el.querySelector('.rs-splash__enter')?.focus();

  let dismissed = false;
  function enter() {
    if (dismissed) return; // Enter arrives as both a keydown and a button click
    dismissed = true;
    hide();
    if (remember) rememberNow(key);
    emit(el, 'splash:enter', { remembered: !!remember });
  }
  const onClick = (e) => { if (e.target.closest('.rs-splash__enter')) enter(); };
  const onKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
    else if (e.key === 'Escape' && !modal) { e.preventDefault(); enter(); }
  };
  const onCancel = (e) => { e.preventDefault(); enter(); }; // native Esc on the modal
  el.addEventListener('click', onClick);
  el.addEventListener('keydown', onKey);
  if (modal) el.addEventListener('cancel', onCancel);

  return {
    enter,
    reset() { forget(key); },
    destroy() {
      el.removeEventListener('click', onClick);
      el.removeEventListener('keydown', onKey);
      if (modal) el.removeEventListener('cancel', onCancel);
      hide();
    },
  };
}

function seenRecently(key, days) {
  try {
    const at = Number(localStorage.getItem(key));
    return at && Date.now() - at < days * 86400000;
  } catch {
    return false;
  }
}
function rememberNow(key) {
  try { localStorage.setItem(key, String(Date.now())); } catch { /* ignore */ }
}
function forget(key) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

export default { name: 'splash', selector: '.rs-splash', enhance };
