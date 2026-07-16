// clock.js - an LED clock for your homepage (docs/05). The digits live in an
// rs-counter shell (green on black), refreshed once a second. A digit changing
// value is content, not motion, so reduced motion changes nothing here. The
// visible digits are aria-hidden; a screen reader reads the sr-only time.
import { selfRegister } from './_overlay.js';

function two(n) { return String(n).padStart(2, '0'); }

function factory(el, options) {
  const h24 = String(options.format) !== '12';
  const seconds = options.seconds !== false;
  const label = typeof options.label === 'string' ? options.label : '';

  el.classList.add('rs-clock');
  const digits = document.createElement('span');
  digits.className = 'rs-counter';
  digits.setAttribute('aria-hidden', 'true');
  const time = document.createElement('time');
  time.className = 'rs-sr-only';
  el.append(digits, time);
  let cap = null;
  if (label) {
    cap = document.createElement('span');
    cap.className = 'rs-counter__label';
    cap.textContent = label;
    el.appendChild(cap);
  }

  let lastMinute = -1;
  function render() {
    const d = new Date();
    let h = d.getHours();
    const suffix = h24 ? '' : h < 12 ? ' AM' : ' PM';
    if (!h24) { h = h % 12 || 12; }
    const text = `${two(h)}:${two(d.getMinutes())}${seconds ? ':' + two(d.getSeconds()) : ''}${suffix}`;
    digits.textContent = text;
    // update the spoken time only when the minute changes, no per-second spam
    if (d.getMinutes() !== lastMinute) {
      lastMinute = d.getMinutes();
      time.dateTime = d.toISOString();
      time.textContent = text;
    }
  }
  render();
  const id = setInterval(render, 1000);

  return { destroy() { clearInterval(id); el.classList.remove('rs-clock'); digits.remove(); time.remove(); cap?.remove(); } };
}

export default selfRegister({ id: 'clock', motion: 'informative', pointer: 'any', factory });
