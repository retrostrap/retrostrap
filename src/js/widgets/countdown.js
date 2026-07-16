// countdown.js - party like it's 1999 (docs/05). Counts down to a datetime in
// LED digits. Informative: a digit changing value is content, so reduced motion
// keeps the count; it just drops any flip flourish. The remaining time is
// announced once a minute, never every second.
import { selfRegister } from './_overlay.js';

function factory(el, options, ctx) {
  const to = new Date(options.to);
  if (Number.isNaN(to.getTime())) { ctx.log('countdown: needs a valid `to` datetime'); return {}; }
  const doneMsg = typeof options.done === 'string' ? options.done : 'Happy new millennium!';

  el.classList.add('rs-countdown');
  el.setAttribute('role', 'timer');
  const digits = document.createElement('span');
  digits.className = 'rs-counter';
  digits.setAttribute('aria-hidden', 'true');
  const sr = document.createElement('span');
  sr.className = 'rs-sr-only';
  el.append(digits, sr);

  let done = false;
  let lastAnnounce = -1;
  let timer = null;

  function render() {
    const ms = to.getTime() - Date.now();
    if (ms <= 0) {
      if (!done) { done = true; digits.textContent = doneMsg; sr.textContent = doneMsg; ctx.announce(doneMsg); ctx.emit('countdown:done', {}); }
      if (timer) { clearInterval(timer); timer = null; } // nothing left to tick
      return;
    }
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const two = (n) => String(n).padStart(2, '0');
    digits.textContent = `${d}d ${two(h)}:${two(m)}:${two(s)}`;
    // announce on the minute, not the second
    if (m !== lastAnnounce) {
      lastAnnounce = m;
      sr.textContent = `${d} days, ${h} hours and ${m} minutes remaining.`;
    }
  }
  render();
  if (!done) timer = setInterval(render, 1000); // an already-finished target never starts a ticker

  return {
    destroy() { if (timer) clearInterval(timer); el.classList.remove('rs-countdown'); el.removeAttribute('role'); digits.remove(); sr.remove(); },
  };
}

export default selfRegister({ id: 'countdown', motion: 'informative', pointer: 'any', factory });
