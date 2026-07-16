// last-updated.js - "Last updated: Friday, July 10, 2026", printed from the
// document's own last-modified date (docs/05). Pure nostalgia by information;
// no motion, nothing to calm. Hides itself if the browser reports a garbage
// date (some servers send the epoch).
import { selfRegister } from './_overlay.js';

function factory(el, options) {
  const prefix = typeof options.prefix === 'string' ? options.prefix : 'Last updated:';
  const long = options.format !== 'short';
  const locale = typeof options.locale === 'string' ? options.locale : (document.documentElement.lang || undefined);
  const priorText = el.textContent; // hand the host back untouched on destroy (SPA remounts)
  const priorHidden = el.hidden;

  // an author can pin the date verbatim (a "reviewed on" stamp, a period demo)
  // instead of the file's own last-modified time
  if (typeof options.date === 'string' && options.date.trim()) {
    el.textContent = `${prefix} ${options.date.trim()}`;
    el.classList.add('rs-last-updated');
    return { destroy() { el.textContent = priorText; el.classList.remove('rs-last-updated'); } };
  }

  const stamp = new Date(document.lastModified);
  const epoch = !document.lastModified || stamp.getTime() <= 0 || Number.isNaN(stamp.getTime());
  if (epoch) { el.hidden = true; return { destroy() { el.hidden = priorHidden; } }; }

  const opts = long
    ? { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };
  el.textContent = `${prefix} ${stamp.toLocaleDateString(locale, opts)}`.trim();
  el.classList.add('rs-last-updated');

  return { destroy() { el.textContent = priorText; el.classList.remove('rs-last-updated'); } };
}

export default selfRegister({ id: 'last-updated', motion: 'informative', pointer: 'any', factory });
