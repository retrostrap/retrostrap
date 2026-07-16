// hit-counter.js - the odometer, proof of life in a pre-analytics world
// (docs/05). Three modes: a static number you can defend, a local count kept
// in this browser, or an api endpoint. The api contract counts hits, never
// people, no identifiers, ever (Decency Law). Announced once to a screen
// reader, never on a tick.
import { selfRegister } from './_overlay.js';

function pad(n, width) { return String(Math.max(0, n | 0)).padStart(width, '0'); }

function factory(el, options, ctx) {
  let alive = true; // an api retry can resolve after destroy; don't touch detached nodes
  const mode = ['static', 'local', 'api'].includes(options.mode) ? options.mode : 'static';
  const width = Math.min(12, Math.max(1, Number(options.digits) || 6)); // clamp: padStart won't allocate wildly

  el.classList.add('rs-counter');
  const digits = document.createElement('span');
  digits.setAttribute('aria-hidden', 'true');
  const sr = document.createElement('span');
  sr.className = 'rs-sr-only';
  el.append(digits, sr);

  // each digit is a frame in the 7-segment sprite sheet: 11px wide, 0-9 then a dash
  const DIGIT_W = 11;
  const renderDigits = (str) => {
    digits.textContent = '';
    digits.setAttribute('data-rs-value', str); // the digits are sprites; keep the value readable
    for (const ch of str) {
      const d = document.createElement('span');
      d.className = 'rs-counter__digit';
      const idx = ch >= '0' && ch <= '9' ? Number(ch) : 10;
      d.style.backgroundPositionX = `${-idx * DIGIT_W}px`;
      digits.appendChild(d);
    }
  };
  const show = (n, announce) => {
    renderDigits(pad(n, width));
    if (announce) sr.textContent = `You are visitor number ${Number(n).toLocaleString()}.`;
  };

  if (mode === 'static') {
    show(Number(options.value) || 1337, true);
    return { destroy() { cleanup(); } };
  }

  if (mode === 'local') {
    const key = `rs:hits:${location.pathname}`;
    let n = 0;
    try { n = Number(localStorage.getItem(key)) || 0; n += 1; localStorage.setItem(key, String(n)); } catch { n = 1; }
    show(n, true);
    sr.textContent = `This is visit number ${n} from this browser.`;
    return { destroy() { cleanup(); } };
  }

  // api: POST to increment, expects { count }. One retry, then it gives up and
  // shows dashes, an era-true aesthetic of honest breakage.
  show(0, false);
  renderDigits('-'.repeat(width));
  if (typeof options.src === 'string') {
    // the endpoint counts per page, so name the page in the query (docs/05 contract)
    const src = options.src + (options.src.includes('?') ? '&' : '?') + 'page=' + encodeURIComponent(location.pathname);
    let tries = 0;
    const hit = () => fetch(src, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: location.pathname }) })
      .then((r) => r.json())
      .then((d) => { if (alive) show(Number(d.count) || 0, true); })
      .catch(() => { if (!alive) return; if (tries++ < 1) hit(); else { renderDigits('-'.repeat(width)); sr.textContent = 'The counter is asleep. You still count.'; ctx.log('hit-counter: endpoint unreachable'); } });
    hit();
  } else {
    ctx.log('hit-counter: api mode needs a src');
  }

  function cleanup() { alive = false; el.classList.remove('rs-counter'); digits.remove(); sr.remove(); }
  return { destroy() { cleanup(); } };
}

export default selfRegister({ id: 'hit-counter', motion: 'informative', pointer: 'any', factory });
