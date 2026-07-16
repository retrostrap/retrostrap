// menu.js - disclosure navigation (docs/08). This is site navigation, not an
// application menubar, so submenu triggers are buttons with aria-expanded and
// the items are ordinary links. Hover-open is CSS; here we add click/tap and
// the keyboard.
import { emit } from '../core/events.js';

function enhance(el) {
  const ac = new AbortController();
  const { signal } = ac; // one signal tears down every listener below on destroy
  el.classList.add('rs-menu--js'); // hand submenu display to aria-expanded, not :focus-within
  const triggers = [...el.querySelectorAll(':scope > ul li > button')];
  const controllers = new Map(); // trigger -> its own open()/close(), so every close path emits

  triggers.forEach((trigger) => {
    const submenu = trigger.nextElementSibling;
    if (!submenu || submenu.tagName !== 'UL') return;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-haspopup', 'true');

    const items = () => [...submenu.querySelectorAll(':scope > li > a, :scope > li > button')];

    const open = (focusFirst) => {
      if (trigger.getAttribute('aria-expanded') === 'true') { if (focusFirst) items()[0]?.focus(); return; } // already open: no second rs:menu:open
      closeAll(trigger);
      trigger.setAttribute('aria-expanded', 'true');
      emit(el, 'menu:open', { item: trigger });
      if (focusFirst) items()[0]?.focus();
    };
    const close = (refocus) => {
      if (trigger.getAttribute('aria-expanded') !== 'true') return;
      trigger.setAttribute('aria-expanded', 'false');
      emit(el, 'menu:close', { item: trigger });
      if (refocus) trigger.focus();
    };
    controllers.set(trigger, { open, close });

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      trigger.getAttribute('aria-expanded') === 'true' ? close(false) : open(false);
    }, { signal });

    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); open(true); }
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.getAttribute('aria-expanded') === 'true' ? close(false) : open(true);
      } else if (e.key === 'Escape') close(true);
    }, { signal });

    submenu.addEventListener('keydown', (e) => {
      const list = items();
      const i = list.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); list[Math.min(i + 1, list.length - 1)]?.focus(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); list[Math.max(i - 1, 0)]?.focus(); }
      else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
      else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
    }, { signal });
  });

  // route EVERY close through the trigger's own close() so `menu:close` always fires and open/close
  // stay balanced, whatever did the closing: a sibling opening, an outside click, focus leaving
  function closeAll(except) {
    triggers.forEach((t) => { if (t !== except) controllers.get(t)?.close(false); });
  }

  const onOutside = (e) => { if (!el.contains(e.target)) closeAll(null); };
  const onFocusOut = (e) => { if (!el.contains(e.relatedTarget)) closeAll(null); };
  document.addEventListener('click', onOutside, { signal });
  el.addEventListener('focusout', onFocusOut, { signal });

  return {
    open: (trigger) => controllers.get(trigger)?.open(false),
    close: (trigger) => controllers.get(trigger)?.close(false),
    closeAll: () => closeAll(null),
    destroy() {
      ac.abort(); // removes trigger, submenu, document, and focusout listeners at once
      el.classList.remove('rs-menu--js');
      triggers.forEach((t) => { t.removeAttribute('aria-haspopup'); t.setAttribute('aria-expanded', 'false'); });
    },
  };
}

export default { name: 'menu', selector: '.rs-menu', enhance };
