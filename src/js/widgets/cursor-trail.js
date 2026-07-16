// cursor-trail.js - things that follow your mouse, the Comet Cursor of our
// hearts (docs/05). A small pool of DOM sprites chase the pointer in a lerp
// chain; positions snap to integer pixels so the pixel art stays crisp.
// Pointer-only and decorative: the engine no-ops it on touch, and it doesn't
// spawn under reduced motion.
import { overlay, selfRegister, cssUrl } from './_overlay.js';

const GLYPH = { stars: '★', sparkle: '✦', hearts: '♥', dots: '', bubbles: '', image: '' };

function factory(el, options, ctx) {
  if (ctx.reducedMotion) return {}; // decorative: no trail when motion is calmed

  const variant = GLYPH[options.variant] !== undefined ? options.variant : 'stars';
  const count = Math.min(Number(options.count) || 8, 16);
  const size = Math.min(Number(options.size) || 12, 24);
  const color = typeof options.color === 'string' ? options.color : 'var(--rs-accent, #000080)';
  const image = cssUrl(options.image); // author-set sprite; null if it would break out of url("")
  const n = ctx.budget.claim(count);

  const layer = overlay('rs-cursor-trail');
  const trailers = [];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.style.cssText =
      `position:absolute;left:0;top:0;width:${size}px;height:${size}px;` +
      `font-size:${size}px;line-height:${size}px;text-align:center;will-change:transform`;
    if (variant === 'image' && image) {
      s.style.backgroundImage = `url("${image}")`;
      s.style.backgroundSize = 'contain';
      s.style.imageRendering = 'pixelated';
    } else if (variant === 'dots') {
      s.style.background = color;
    } else if (variant === 'bubbles') {
      s.style.border = `2px solid ${color}`;
    } else {
      s.textContent = GLYPH[variant] || '★';
      s.style.color = color;
    }
    layer.appendChild(s);
    trailers.push({ el: s, x: -100, y: -100 });
  }

  let px = -100;
  let py = -100;
  const onMove = (e) => { px = e.clientX; py = e.clientY; };
  window.addEventListener('pointermove', onMove, { passive: true });

  const stop = ctx.ticker.add(() => {
    let tx = px;
    let ty = py;
    for (const t of trailers) {
      t.x += (tx - t.x) * 0.35; // stepped chase
      t.y += (ty - t.y) * 0.35;
      const rx = Math.round(t.x - size / 2);
      const ry = Math.round(t.y - size / 2);
      t.el.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      tx = t.x; // the next trailer chases this one
      ty = t.y;
    }
  });

  return {
    destroy() {
      stop();
      window.removeEventListener('pointermove', onMove);
      layer.remove();
    },
  };
}

export default selfRegister({ id: 'cursor-trail', motion: 'decorative', pointer: 'fine', factory });
