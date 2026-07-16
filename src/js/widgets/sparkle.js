// sparkle.js - twinkles at the cursor and/or ambient twinkles on a zone: the
// glitter-graphics scene, brought back tastefully (docs/05). Each sparkle is a
// short-lived star that fades out (alpha is allowed here, this is a
// decorative overlay, not UI chrome). Decorative; silent under reduced motion.
import { overlay, selfRegister } from './_overlay.js';

const PALETTES = {
  gold: ['#FFCC00', '#FFFF99', '#FFFFFF'],
  ice: ['#00FFFF', '#99CCFF', '#FFFFFF'],
  rainbow: ['#FF0000', '#FFCC00', '#00CC00', '#00CCFF', '#CC66FF'],
  theme: ['var(--rs-accent, #000080)', '#FFFFFF'],
};

function factory(el, options, ctx) {
  if (ctx.reducedMotion) return {};

  const mode = ['pointer', 'ambient', 'both'].includes(options.mode) ? options.mode : 'pointer';
  const colors = typeof options.color === 'string'
    ? [options.color]
    : PALETTES[options.palette] || PALETTES.theme;
  const cap = ctx.budget.claim(40);

  const layer = overlay('rs-sparkle-layer');
  const live = new Set();
  const timeouts = new Set();
  const rafs = new Set();

  function spark(x, y) {
    if (live.size >= cap) return;
    const s = document.createElement('span');
    const size = 6 + Math.floor((live.size % 4) * 2); // varied, deterministic
    s.textContent = '✦';
    s.style.cssText =
      `position:absolute;left:0;top:0;font-size:${size}px;line-height:1;` +
      `transform:translate3d(${Math.round(x)}px,${Math.round(y)}px,0);` +
      'opacity:1;transition:opacity .5s linear';
    // color is author-set (data-rs-sparkle-color); property setter, not cssText,
    // so a smuggled declaration list can't ride in
    s.style.color = colors[live.size % colors.length];
    layer.appendChild(s);
    live.add(s);
    const raf = requestAnimationFrame(() => { rafs.delete(raf); s.style.opacity = '0'; });
    rafs.add(raf);
    const t = setTimeout(() => { timeouts.delete(t); s.remove(); live.delete(s); }, 520);
    timeouts.add(t);
  }

  const cleanup = [];
  if (mode === 'pointer' || mode === 'both') {
    const trigger = options.trigger === 'click' ? 'pointerdown' : 'pointermove';
    let n = 0;
    const onPointer = (e) => { if (trigger === 'pointerdown' || n++ % 3 === 0) spark(e.clientX, e.clientY); };
    window.addEventListener(trigger, onPointer, { passive: true });
    if (trigger === 'pointermove') {
      const onDown = (e) => spark(e.clientX, e.clientY);
      window.addEventListener('pointerdown', onDown, { passive: true });
      cleanup.push(() => window.removeEventListener('pointerdown', onDown));
    }
    cleanup.push(() => window.removeEventListener(trigger, onPointer));
  }
  if (mode === 'ambient' || mode === 'both') {
    const zone = (typeof options.zone === 'string' && document.querySelector(options.zone)) || el;
    let acc = 0;
    const stop = ctx.ticker.add((dt) => {
      acc += dt;
      if (acc < 400) return; // ~1 ambient twinkle every 400ms per zone
      acc = 0;
      const r = zone.getBoundingClientRect();
      spark(r.left + pseudoRandom() * r.width, r.top + pseudoRandom() * r.height);
    });
    cleanup.push(stop);
  }

  // a tiny deterministic jitter, no Math.random needed, and it stays lively
  let seed = 1;
  function pseudoRandom() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

  return {
    destroy() {
      cleanup.forEach((fn) => fn());
      timeouts.forEach(clearTimeout);   // no fade timer or frame fires against a detached node after teardown
      rafs.forEach(cancelAnimationFrame);
      layer.remove();
      live.clear();
    },
  };
}

export default selfRegister({ id: 'sparkle', motion: 'decorative', pointer: 'any', factory });
