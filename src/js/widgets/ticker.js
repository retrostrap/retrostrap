// ticker.js - the status-bar scroller, the window.status gag brought on-page
// (docs/05). Informative, so it never disappears: under reduced motion it
// stops scrolling and swaps the message every few seconds instead. Pauses on
// hover and focus. Never aria-live, the messages are ordinary readable text.
import { selfRegister } from './_overlay.js';

const SPEED = { slow: 30, normal: 60, fast: 120 };

function readMessages(el, options) {
  if (Array.isArray(options.messages)) return options.messages.map(String);
  if (typeof options.source === 'string') {
    const src = document.querySelector(options.source);
    if (src) return [...src.querySelectorAll('li')].map((li) => li.textContent.trim());
  }
  const own = [...el.querySelectorAll('li')].map((li) => li.textContent.trim());
  return own.length ? own : [el.textContent.trim()].filter(Boolean);
}

function factory(el, options, ctx) {
  const messages = readMessages(el, options).filter(Boolean);
  if (!messages.length) { ctx.log('ticker: no messages'); return {}; }
  const sep = typeof options.separator === 'string' ? options.separator : '+++';
  const speed = SPEED[options.speed] || SPEED.normal;
  const dock = options.dock === 'bottom';

  el.textContent = '';
  el.classList.add('rs-ticker');
  el.style.cssText = dock
    ? 'position:fixed;inset-inline:0;inset-block-end:0;z-index:var(--rs-z-sticky,100);'
      + 'background:var(--rs-bevel-face);border-block-start:2px groove var(--rs-bevel-face);'
      + 'padding:2px 8px;display:flex;align-items:center;gap:6px'
    : 'display:flex;align-items:center;gap:6px';
  if (dock) document.body.style.paddingBlockEnd = '28px'; // never cover content

  let paused = false;
  // a real, always-present pause control: hover was the only way to stop the
  // scroll before, which left keyboard and touch users with none (docs/08)
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'rs-btn rs-ticker__pause';
  btn.style.cssText = 'flex:0 0 auto;padding:0 6px';
  el.appendChild(btn);
  const relabel = () => {
    btn.textContent = paused ? '▶' : '||';
    btn.setAttribute('aria-label', paused ? 'Resume the ticker' : 'Pause the ticker');
  };

  const scroller = document.createElement('span');
  scroller.className = 'rs-ticker__scroll';
  scroller.style.cssText = 'flex:1 1 0;min-inline-size:0;overflow:hidden;white-space:nowrap';
  el.appendChild(scroller);

  const cleanup = () => {
    btn.remove();       // the pause button and the scroller (with its track) are ours to take back
    scroller.remove();
    el.classList.remove('rs-ticker');
    el.style.cssText = '';
    if (dock) document.body.style.paddingBlockEnd = '';
  };

  // reduced motion: one message at a time, swapped on a timer, no scroll; the
  // button pauses the swap
  if (ctx.reducedMotion) {
    let i = 0;
    let id = null;
    scroller.textContent = messages[0];
    const tick = () => { i = (i + 1) % messages.length; scroller.textContent = messages[i]; };
    const onClick = () => {
      paused = !paused; relabel();
      if (paused) { clearInterval(id); id = null; } else id = setInterval(tick, 5000);
    };
    relabel();
    id = setInterval(tick, 5000);
    btn.addEventListener('click', onClick);
    return {
      pause() { paused = true; relabel(); clearInterval(id); id = null; },
      resume() { if (!id) { paused = false; relabel(); id = setInterval(tick, 5000); } },
      destroy() { clearInterval(id); btn.removeEventListener('click', onClick); cleanup(); },
    };
  }

  const track = document.createElement('span');
  track.className = 'rs-ticker__track';
  track.style.cssText = 'display:inline-block;padding-inline-start:100%;will-change:transform';
  track.textContent = messages.join(`  ${sep}  `) + `  ${sep}  `;
  scroller.appendChild(track);

  let offset = 0;
  let hovering = false; // pointer users keep hover-pause; the button is the persistent one
  const width = track.scrollWidth;
  const onClick = () => { paused = !paused; relabel(); };
  const onEnter = () => { hovering = true; };
  const onLeave = () => { hovering = false; };
  relabel();
  btn.addEventListener('click', onClick);
  el.addEventListener('pointerenter', onEnter);
  el.addEventListener('pointerleave', onLeave);

  const stop = ctx.ticker.add((dt) => {
    if (paused || hovering) return;
    offset -= (speed * dt) / 1000;
    if (-offset > width) offset = scroller.clientWidth; // loop
    track.style.transform = `translateX(${Math.round(offset)}px)`;
  });

  return {
    pause() { paused = true; relabel(); },
    resume() { paused = false; relabel(); },
    destroy() {
      stop();
      btn.removeEventListener('click', onClick);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      cleanup();
    },
  };
}

export default selfRegister({ id: 'ticker', motion: 'informative', pointer: 'any', factory });
