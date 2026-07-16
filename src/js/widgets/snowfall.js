// snowfall.js - the JavaScript snow every winter homepage had (docs/05).
// Canvas, so a hundred flakes cost almost nothing; the governor thins them if
// the page struggles; the shared loop pauses when the tab is hidden. Off
// entirely under reduced motion, the canvas is never even created.
import { selfRegister } from './_overlay.js';

const DENSITY = { light: 20, normal: 40, blizzard: 80 };
const SPEED = { slow: 20, normal: 40, fast: 70 }; // px/sec fall
const GLYPHS = { star: '★', heart: '♥', leaf: '❧', confetti: '' };
const CONFETTI = ['#FF0000', '#FFCC00', '#00CC00', '#00CCFF', '#FF66CC'];

function factory(el, options, ctx) {
  if (ctx.reducedMotion) return {}; // the canvas never mounts

  const density = DENSITY[options.density] || (Number(options.density) ? Math.min(Number(options.density), 100) : DENSITY.normal);
  const fall = SPEED[options.speed] || SPEED.normal;
  const wind = Math.max(-2, Math.min(2, Number(options.wind) || 0));
  // the drawable glyph CHARACTER for star/heart/leaf; null for confetti (empty)
  // and the default flake, which draw as filled pixel squares instead
  const glyph = GLYPHS[options.glyph] || null;
  const melt = options.melt !== false;
  ctx.budget.claim(density);

  const canvas = document.createElement('canvas');
  canvas.className = 'rs-snowfall';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:var(--rs-z-fx,600)';
  document.body.appendChild(canvas);
  const g = canvas.getContext('2d');

  let w = 0;
  let h = 0;
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2); // DPR cap 2 (docs/08)
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();

  // deterministic jitter, no Math.random, varies per index and time
  let seed = 2654435761;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const flakes = [];
  function spawn(top) {
    return {
      x: rnd() * w,
      y: top ? -10 : rnd() * h,
      size: glyph ? 10 + rnd() * 8 : 2 + Math.round(rnd() * 2),
      vy: fall * (0.6 + rnd() * 0.8),
      drift: (rnd() - 0.5) * 20,
      color: options.glyph === 'confetti' ? CONFETTI[flakes.length % CONFETTI.length] : '#FFFFFF',
    };
  }

  let running = true;
  const stop = ctx.ticker.add((dt) => {
    if (!running) return;
    const want = ctx.budget.grant();
    while (flakes.length < want) flakes.push(spawn(false));
    if (flakes.length > want) flakes.length = want;

    g.clearRect(0, 0, w, h);
    const s = dt / 1000;
    for (const f of flakes) {
      f.y += f.vy * s;
      f.x += (wind * 20 + f.drift) * s;
      if (f.y > h + 10) { Object.assign(f, spawn(true)); continue; }
      if (f.x < -10) f.x = w + 10; else if (f.x > w + 10) f.x = -10;
      g.globalAlpha = melt && f.y > h * 0.9 ? Math.max(0, (h - f.y) / (h * 0.1)) : 1;
      g.fillStyle = f.color;
      if (glyph) {
        g.font = `${f.size}px serif`;
        g.fillText(glyph, Math.round(f.x), Math.round(f.y));
      } else {
        g.fillRect(Math.round(f.x), Math.round(f.y), f.size, f.size); // crisp pixel flake
      }
    }
    g.globalAlpha = 1;
  });

  const onResize = () => resize();
  window.addEventListener('resize', onResize, { passive: true });

  return {
    pause() { running = false; },
    resume() { running = true; },
    destroy() {
      stop();
      window.removeEventListener('resize', onResize);
      canvas.remove();
    },
  };
}

export default selfRegister({ id: 'snowfall', motion: 'decorative', pointer: 'any', factory });
