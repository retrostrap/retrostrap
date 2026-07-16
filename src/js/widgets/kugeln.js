// kugeln.js - the little shiny spheres that chase (or orbit) your pointer, the
// spinning-ball DHTML cursor toys of ~2000. Drawn as pixel spheres so the 3D
// sheen stays inside the Palette Law (docs/05). Pointer-only and decorative:
// nothing spawns under reduced motion, and the engine no-ops it on touch.
import { overlay, selfRegister, assetBase } from './_overlay.js';

const COLORS = ['red', 'gold', 'green', 'cyan', 'blue', 'purple', 'pink', 'silver'];
const RAINBOW = ['red', 'gold', 'green', 'cyan', 'blue', 'purple', 'pink'];

function factory(el, options, ctx) {
  if (ctx.reducedMotion) return {}; // decorative: the spheres rest when motion is calmed

  const mode = options.mode === 'orbit' ? 'orbit' : 'trail';
  const count = Math.min(Math.max(Number(options.count) || 7, 1), 12);
  const size = Math.min(Math.max(Number(options.size) || 20, 8), 32);
  const single = COLORS.includes(options.colors) ? options.colors : null;
  const palette = single ? [single] : RAINBOW;
  const n = ctx.budget.claim(count);
  const base = assetBase();

  const layer = overlay('rs-kugeln');
  const balls = [];
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    const color = palette[i % palette.length];
    s.style.cssText =
      `position:absolute;left:0;top:0;width:${size}px;height:${size}px;` +
      `background-image:url("${base}/kugeln-${color}.png");` +
      `background-size:${size}px ${size}px;background-repeat:no-repeat;` +
      `image-rendering:pixelated;will-change:transform`;
    layer.appendChild(s);
    balls.push({ el: s, x: -100, y: -100 });
  }

  let px = -100;
  let py = -100;
  const onMove = (e) => { px = e.clientX; py = e.clientY; };
  window.addEventListener('pointermove', onMove, { passive: true });

  // orbit mode keeps a smoothed centre and a turning angle
  let cx = -100;
  let cy = -100;
  let angle = 0;
  const radius = size * 1.4;

  const place = (b, x, y) => {
    b.x = x;
    b.y = y;
    b.el.style.transform =
      `translate3d(${Math.round(x - size / 2)}px,${Math.round(y - size / 2)}px,0)`;
  };

  const stop = ctx.ticker.add((dt) => {
    if (mode === 'orbit') {
      cx += (px - cx) * 0.18;
      cy += (py - cy) * 0.18;
      angle += (dt / 1000) * 1.6; // about a quarter-turn a second
      balls.forEach((b, i) => {
        const a = angle + (i / balls.length) * Math.PI * 2;
        place(b, cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
      });
    } else {
      let tx = px;
      let ty = py;
      for (const b of balls) {
        place(b, b.x + (tx - b.x) * 0.32, b.y + (ty - b.y) * 0.32);
        tx = b.x; // the next sphere chases this one
        ty = b.y;
      }
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

export default selfRegister({ id: 'kugeln', motion: 'decorative', pointer: 'fine', factory });
