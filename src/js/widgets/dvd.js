// dvd.js - a logo bouncing around the viewport, waiting for the corner hit you
// will never quite see (docs/05). Off unless you ask for it. Decorative, so
// under reduced motion it parks in a corner and holds still.
import { selfRegister } from './_overlay.js';

const LEGAL = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF9900'];

function factory(el, options, ctx) {
  // the thing that bounces: a named target, or a default logo chip
  let logo = typeof options.target === 'string' ? document.querySelector(options.target) : null;
  let owned = false;
  if (!logo) {
    logo = document.createElement('div');
    logo.textContent = options.text || 'retrostrap';
    logo.className = 'rs-dvd';
    logo.style.cssText = 'font:bold 20px Impact,sans-serif;padding:6px 10px;color:#FF00FF;white-space:nowrap';
    owned = true;
  }
  // a borrowed target must be handed back untouched on destroy
  const prevStyle = owned ? null : logo.getAttribute('style');
  const prevAria = owned ? null : logo.getAttribute('aria-hidden');
  const restore = () => {
    if (owned) { logo.remove(); return; }
    if (prevStyle === null) logo.removeAttribute('style'); else logo.setAttribute('style', prevStyle);
    if (prevAria === null) logo.removeAttribute('aria-hidden'); else logo.setAttribute('aria-hidden', prevAria);
  };
  logo.setAttribute('aria-hidden', 'true');
  logo.style.position = 'fixed';
  logo.style.zIndex = 'var(--rs-z-fx,600)';
  logo.style.pointerEvents = 'none';
  logo.style.left = '0';
  logo.style.top = '0';
  logo.style.willChange = 'transform';
  if (owned) document.body.appendChild(logo);

  let x = 40;
  let y = 40;
  const speed = options.speed === 'fast' ? 180 : options.speed === 'slow' ? 60 : 110;
  let vx = speed;
  let vy = speed;
  let colorIdx = 0;

  const bounds = () => ({ w: window.innerWidth - logo.offsetWidth, h: window.innerHeight - logo.offsetHeight });

  function place() { logo.style.transform = `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)`; }
  place();

  // the payoff nobody waits around for: the sacred corner hit gets a little party
  const parties = [];
  function celebrate() {
    const pop = document.createElement('div');
    pop.textContent = '★ CORNER! ★';
    pop.setAttribute('aria-hidden', 'true');
    pop.className = 'rs-dvd__corner';
    pop.style.cssText = 'position:fixed;z-index:var(--rs-z-fx,600);pointer-events:none;'
      + 'font:bold 18px Impact,sans-serif;color:#FFFF00;background:#FF00FF;padding:4px 10px;'
      + 'inset-block-start:50%;inset-inline-start:50%;transform:translate(-50%,-50%);white-space:nowrap';
    document.body.appendChild(pop);
    let n = 0;
    let linger;
    let entry;
    const done = () => { const i = parties.indexOf(entry); if (i >= 0) parties.splice(i, 1); };
    // 250ms toggle is two blinks a second, under the 3/s flash ceiling (docs/08)
    const blink = setInterval(() => { pop.style.visibility = (n++ % 2) ? 'hidden' : 'visible'; }, 250);
    // after the blink, a smaller line lingers, the folklore of the corner hit
    const settle = setTimeout(() => {
      clearInterval(blink);
      pop.style.visibility = 'visible';
      pop.textContent = 'You saw it. No one will believe you.';
      pop.style.font = 'bold 13px Impact,sans-serif';
      linger = setTimeout(() => { pop.remove(); done(); }, 4000);
    }, 1600);
    entry = () => { clearInterval(blink); clearTimeout(settle); clearTimeout(linger); pop.remove(); };
    parties.push(entry);
  }

  if (ctx.reducedMotion) {
    x = 8; y = 8; place();
    return { destroy() { restore(); } };
  }

  let cornerCooldown = 0; // ms until another corner party may fire, so a tight viewport can't flood
  const stop = ctx.ticker.add((dt) => {
    const b = bounds();
    if (b.w <= 0 || b.h <= 0) { place(); return; } // logo bigger than the viewport: nowhere to bounce
    x += (vx * dt) / 1000;
    y += (vy * dt) / 1000;
    let corner = 0;
    if (x <= 0) { x = 0; vx = Math.abs(vx); corner++; }
    else if (x >= b.w) { x = b.w; vx = -Math.abs(vx); corner++; }
    if (y <= 0) { y = 0; vy = Math.abs(vy); corner++; }
    else if (y >= b.h) { y = b.h; vy = -Math.abs(vy); corner++; }
    if (corner) {
      colorIdx = (colorIdx + 1) % LEGAL.length;
      logo.style.color = LEGAL[colorIdx];
      if (corner === 2 && cornerCooldown <= 0) { cornerCooldown = 5000; ctx.emit('dvd:corner', {}); celebrate(); } // the sacred double-edge hit
    }
    if (cornerCooldown > 0) cornerCooldown -= dt;
    place();
  });

  return {
    destroy() { stop(); parties.forEach((end) => end()); restore(); },
  };
}

export default selfRegister({ id: 'dvd', motion: 'decorative', pointer: 'any', factory });
