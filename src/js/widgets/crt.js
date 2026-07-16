// crt.js - the CRT overlay as a managed widget (docs/05). The rs-crt utility
// class already draws static scanlines; this adds an optional vignette and a
// very subtle flicker. Flicker is OFF by default and capped far below the
// photosensitivity threshold (2 changes/sec, tiny opacity delta), and it is
// force-disabled under reduced motion.
import { selfRegister } from './_overlay.js';

function factory(el, options, ctx) {
  const overlay = document.createElement('div');
  overlay.className = 'rs-crt-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const vignette = options.vignette !== false;
  overlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:var(--rs-z-fx,600);' +
    'background:repeating-linear-gradient(0deg, rgba(0,0,0,0.10) 0 1px, transparent 1px 3px)' +
    (vignette ? ',radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.35) 100%)' : '');
  document.body.appendChild(overlay);

  // flicker: opt-in, and never under reduced motion
  let stop = () => {};
  if (options.flicker === true && !ctx.reducedMotion) {
    let acc = 0;
    let on = true;
    stop = ctx.ticker.add((dt) => {
      acc += dt;
      if (acc < 500) return;          // <= 2 changes per second
      acc = 0;
      on = !on;
      overlay.style.opacity = on ? '1' : '0.94'; // delta 0.06, sub-threshold
    });
  }

  return {
    destroy() { stop(); overlay.remove(); },
  };
}

export default selfRegister({ id: 'crt', motion: 'decorative', pointer: 'any', factory });
