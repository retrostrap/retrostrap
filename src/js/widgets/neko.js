// neko.js - the pixel cat, and the mascot (docs/05). Gif chases your cursor,
// or patrols the edge of an element, or dozes. It is older than the web (the
// Neko/oneko lineage, docs/01) and it is ours, drawn from a blank grid. Under
// reduced motion the cat stays, it just sits down. Decorative and silent to
// assistive tech; it never overlaps a dialog, because it lives below chrome
// but above content and can't be clicked through to.
import { selfRegister, assetBase, cssUrl } from './_overlay.js';

const SPEED = { slow: 40, normal: 80, fast: 140 };
const FRAME = { sit: 0, alert: 1, run1: 2, run2: 3, sleep: 4, groom: 5 };
const SPRITE = 16;   // source frame size
const SCALE = 2;     // integer scale keeps the pixels crisp
const SIZE = SPRITE * SCALE;
const SKINS = new Set(['gif', 'calico', 'void']);

let population = 0;  // at most two cats per page (docs/05)

function factory(el, options, ctx) {
  if (population >= 2) { ctx.log('neko: two cats is plenty'); return {}; }

  const skin = SKINS.has(options.skin) ? options.skin : 'gif';
  let behavior = ['chase', 'patrol', 'sleepy'].includes(options.behavior) ? options.behavior : 'chase';
  if (behavior === 'chase' && ctx.pointerCoarse) behavior = 'patrol'; // no cursor to chase
  const speed = SPEED[options.speed] || SPEED.normal;
  const target = (typeof options.target === 'string' && document.querySelector(options.target)) || null;

  const cat = document.createElement('div');
  cat.className = 'rs-neko';
  cat.setAttribute('aria-hidden', 'true');
  // the sprite URL is author-set (data-rs-neko-src); cssUrl drops a value that would close the
  // url("") and smuggle a second (off-origin) image, falling back to the shipped sprite
  const src = cssUrl(options.src) || `${assetBase()}/neko-${skin}.png`;
  cat.style.cssText =
    `position:fixed;left:0;top:0;width:${SIZE}px;height:${SIZE}px;pointer-events:none;` +
    `z-index:var(--rs-z-fx,600);image-rendering:pixelated;` +
    `background-repeat:no-repeat;background-size:${SIZE * 6}px ${SIZE}px`;
  cat.style.backgroundImage = `url("${src}")`;
  document.body.appendChild(cat);
  population++;

  // start somewhere sensible: near the target, else lower-left
  let x = target ? target.getBoundingClientRect().left : 40;
  let y = target ? target.getBoundingClientRect().top - SIZE : window.innerHeight - SIZE - 40;
  let facing = 1;
  let frame = FRAME.sit;
  let animAcc = 0;
  let idle = 0;
  let asleep = false;
  let patrolDir = 1;

  const pointer = { x, y, moved: false };
  const onMove = (e) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = true; };
  if (behavior === 'chase') window.addEventListener('pointermove', onMove, { passive: true });

  function draw() {
    cat.style.transform =
      `translate3d(${Math.round(x)}px,${Math.round(y)}px,0) scaleX(${facing})`;
    cat.style.backgroundPositionX = `${-frame * SIZE}px`;
  }
  draw();

  // reduced motion: the cat sits, visibly, and does not move
  if (ctx.reducedMotion) {
    frame = FRAME.sit;
    draw();
    // still remove the (chase-only) listener bound above, or a reduced-motion
    // visitor leaks it, and the engine re-inits on every motion-setting change
    return { destroy() { window.removeEventListener('pointermove', onMove); population--; cat.remove(); } };
  }

  function wake() { if (asleep) { asleep = false; ctx.emit("neko:wake"); } idle = 0; }

  function step(dt) {
    let tx;
    let ty;
    if (behavior === 'chase') {
      tx = pointer.x - SIZE / 2;
      ty = pointer.y - SIZE / 2;
      if (pointer.moved) { wake(); pointer.moved = false; }
    } else if (behavior === 'patrol' && target) {
      const r = target.getBoundingClientRect();
      y = r.top - SIZE;
      tx = patrolDir > 0 ? r.right - SIZE : r.left;
      ty = y;
    } else { // sleepy, or patrol with no target
      tx = x;
      ty = y;
    }

    const dx = tx - x;
    const dy = ty - y;
    const dist = Math.hypot(dx, dy);

    if (dist > 6 && !(behavior === 'sleepy')) {
      // run toward the target
      const move = (speed * dt) / 1000;
      x += (dx / dist) * Math.min(move, dist);
      y += (dy / dist) * Math.min(move, dist);
      if (Math.abs(dx) > 2) facing = dx < 0 ? 1 : -1; // the run frames are drawn facing left; mirror only when heading right
      animAcc += dt;
      if (animAcc > 1000 / 6) { frame = frame === FRAME.run1 ? FRAME.run2 : FRAME.run1; animAcc = 0; }
      idle = 0;
    } else {
      // arrived: sit, then eventually sleep
      idle += dt;
      if (behavior === 'patrol') {
        if (idle > 900) { patrolDir *= -1; idle = 0; }
        frame = FRAME.sit;
      } else if (idle > 6000) {
        if (!asleep) { asleep = true; ctx.emit("neko:sleep"); }
        frame = FRAME.sleep;
      } else if (idle > 2500) {
        // a wash break before the nap: alternate sit and groom
        frame = Math.floor(idle / 700) % 2 ? FRAME.groom : FRAME.sit;
      } else {
        frame = FRAME.sit;
      }
    }
    draw();
  }

  const stop = ctx.ticker.add(step);

  return {
    pause() { /* the shared loop already parks when hidden/offscreen */ },
    resume() {},
    destroy() {
      stop();
      window.removeEventListener('pointermove', onMove);
      cat.remove();
      population--;
    },
  };
}

export default selfRegister({ id: 'neko', motion: 'decorative', pointer: 'any', factory });
