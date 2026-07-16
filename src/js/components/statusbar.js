// statusbar.js - the browser status bar, revived honestly. Hover or focus a
// link and its real destination shows down here, the way it did before every
// page rewrote window.status to lie about where a link went (docs/04). The
// preview is the enhancer's own cell laid over the bar, so a docked ticker
// (or any other tenant) keeps its DOM and simply carries on when the pointer
// moves along. Silent to assistive tech, the link's accessible name already
// says where it goes.

export function enhance(el, options) {
  let preview = null;

  // built on first use: enhancers run before widgets, and a ticker docking
  // here clears the bar's children while it builds
  const cell = () => {
    if (!preview || !preview.isConnected) {
      preview = document.createElement('span');
      preview.className = 'rs-statusbar__preview';
      preview.setAttribute('aria-hidden', 'true');
      el.appendChild(preview);
    }
    return preview;
  };

  const show = (t) => {
    const a = t && t.closest && t.closest('a[href]');
    const href = a && a.getAttribute('href');
    if (href) { const p = cell(); p.textContent = href; p.hidden = false; }
  };
  const clear = (t) => {
    if (!preview || preview.hidden) return;
    if (!t || (t.closest && t.closest('a[href]'))) preview.hidden = true;
  };

  const onOver = (e) => show(e.target);
  const onOut = (e) => clear(e.target);
  const onFocus = (e) => show(e.target);
  const onBlur = () => clear(null);

  document.addEventListener('mouseover', onOver);
  document.addEventListener('mouseout', onOut);
  document.addEventListener('focusin', onFocus);
  document.addEventListener('focusout', onBlur);

  return {
    destroy() {
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
      document.removeEventListener('focusin', onFocus);
      document.removeEventListener('focusout', onBlur);
      if (preview) preview.remove();
      preview = null;
    },
  };
}

export default { name: 'statusbar', selector: '.rs-statusbar', enhance };
