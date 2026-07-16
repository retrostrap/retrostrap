// starfield.js - warp-speed stars, the screensaver that ate the 90s (docs/05).
// Canvas, governor-thinned, paused when the tab hides. Under reduced motion it
// becomes a still sprinkle of stars, the look without the flight.
import { selfRegister } from './_overlay.js';

const DENSITY = { sparse: 60, normal: 120, dense: 200 };

function factory(el, options, ctx) {
  const count = DENSITY[options.density] || (Number(options.density) ? Math.min(Number(options.density), 200) : DENSITY.normal);
  const layers = Math.max(1, Math.min(3, Number(options.layers) || 2));
  const still = ctx.reducedMotion;
  ctx.budget.claim(count);

  // a starfield is a BACKGROUND, not a foreground overlay: it sits behind the
  // page content (z-index -1), above the page's flat background, so the content
  // sheet floats on it. That's the "centered table on a starfield" anatomy.
  const canvas = document.createElement('canvas');
  canvas.className = 'rs-starfield';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:-1;background:#000000';
  document.body.appendChild(canvas);
  const g = canvas.getContext('2d');

  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2; cy = h / 2;
  }
  resize();

  let seed = 1013904223;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

  const stars = [];
  function star() {
    const layer = 1 + Math.floor(rnd() * layers);
    return { x: (rnd() - 0.5) * w, y: (rnd() - 0.5) * h, z: rnd() * w, layer };
  }
  for (let i = 0; i < count; i++) stars.push(star());

  function paint() {
    g.clearRect(0, 0, w, h);
    for (const s of stars) {
      const k = w / Math.max(s.z, 1);
      const sx = cx + s.x * k;
      const sy = cy + s.y * k;
      if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;
      const size = Math.max(1, (1 - s.z / w) * 3 * s.layer / layers | 0) || 1;
      g.fillStyle = '#FFFFFF';
      g.fillRect(Math.round(sx), Math.round(sy), size, size);
    }
  }

  let running = true;
  let stop = () => {};
  if (still) {
    // spread the stars out to fixed positions and paint once
    for (const s of stars) s.z = 20 + rnd() * (w - 20);
    paint();
  } else {
    const speed = options.speed === 'fast' ? 220 : options.speed === 'slow' ? 60 : 120;
    stop = ctx.ticker.add((dt) => {
      if (!running) return;
      const want = ctx.budget.grant();
      if (stars.length > want) stars.length = want;
      while (stars.length < want) stars.push(star());
      for (const s of stars) {
        s.z -= speed * s.layer / layers * dt / 1000 * (w / 200);
        if (s.z < 1) { Object.assign(s, star()); s.z = w; }
      }
      paint();
    });
  }

  const onResize = () => { resize(); if (still) paint(); }; // resize wiped the canvas; a still field must redraw
  window.addEventListener('resize', onResize, { passive: true });

  return {
    pause() { running = false; },
    resume() { running = true; },
    destroy() { stop(); window.removeEventListener('resize', onResize); canvas.remove(); },
  };
}

export default selfRegister({ id: 'starfield', motion: 'decorative', pointer: 'any', factory });
