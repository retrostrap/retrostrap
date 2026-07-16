// pixel-pet.js - the desktop pet in the corner, in the virtual-pet lineage (docs/05).
// Feed it and it perks up; ignore it and it gets hungry, then naps. It
// remembers its name, coat, and last meal in localStorage, so it's still there
// next visit. Interactive, not decoration: it's a real labelled button, it
// shows up under reduced motion (just without idle fidget), and it works on a
// touch screen. One pet to a page.
import { selfRegister, assetBase } from './_overlay.js';

const SKINS = new Set(['green', 'blue', 'pink', 'gold']);
const FRAME = { idle: 0, happy: 1, hungry: 2, sleep: 3 };
const SPRITE = 16;
const SCALE = 3;
const SIZE = SPRITE * SCALE; // a 48px pet
const STORE = 'rs-pixel-pet';

let population = 0; // one pet is plenty

function factory(el, options, ctx) {
  if (population >= 1) { ctx.log('pixel-pet: one pet is plenty'); return {}; }

  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { saved = {}; }
  const name = (typeof saved.name === 'string' && saved.name) || (typeof options.name === 'string' && options.name) || 'Blobby';
  // a pet you keep for a week earns its gold coat, a quiet reward for the loyal
  const firstSeen = Number(saved.firstSeen) || Date.now();
  const earnedGold = Date.now() - firstSeen >= 7 * 24 * 60 * 60 * 1000;
  const coat = earnedGold ? 'gold' : (SKINS.has(saved.skin) ? saved.skin : (SKINS.has(options.color) ? options.color : 'green'));
  let celebrated = !!saved.goldSeen; // has the gold coat already had its one sentence?
  const hungryMs = (Number(options.pace) > 0 ? Number(options.pace) : 300) * 1000;
  const happyMs = Math.min(4000, hungryMs / 3); // the "just fed" glow scales with the cycle, so a fast pace can't jam it
  let lastFed = Number(saved.lastFed) || Date.now();
  let lastPoke = Date.now();
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify({ name, skin: coat, lastFed, firstSeen, goldSeen: celebrated })); } catch (e) { /* private mode */ } };

  const box = document.createElement('aside');
  box.className = 'rs-pixel-pet';
  box.setAttribute('aria-label', `${name}, your desktop pet`);
  box.style.cssText =
    'position:fixed;inset-block-end:8px;inset-inline-end:8px;z-index:100;' + // above content, below the chrome bands (menu/window/dialog) so it never blocks them

    'display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px 6px;max-inline-size:132px;' +
    'text-align:center;background:var(--rs-bevel-face,#C0C0C0);color:var(--rs-text,#000000);' +
    'border:2px solid var(--rs-bevel-light,#FFFFFF);' +
    'border-inline-end-color:var(--rs-bevel-dark,#000000);border-block-end-color:var(--rs-bevel-dark,#000000);' +
    'font:var(--rs-font-size-1,10px)/1.25 var(--rs-font-narrow,Tahoma,sans-serif);';

  const pet = document.createElement('button');
  pet.type = 'button';
  pet.className = 'rs-pixel-pet__body';
  pet.setAttribute('aria-label', `Feed ${name}`);
  pet.style.cssText =
    `inline-size:${SIZE}px;block-size:${SIZE}px;padding:0;border:0;cursor:pointer;image-rendering:pixelated;` +
    `background:transparent url("${assetBase()}/pixel-pet-${coat}.png") 0 0 no-repeat;` +
    `background-size:${SIZE * 4}px ${SIZE}px;`;

  const nameEl = document.createElement('strong');
  nameEl.textContent = name;
  nameEl.setAttribute('aria-hidden', 'true'); // the aside label already names it

  const status = document.createElement('span');
  status.className = 'rs-pixel-pet__status';

  // announces feeding only, NOT the ambient hunger ticks, which would chatter
  const live = document.createElement('span');
  live.className = 'rs-sr-only';
  live.setAttribute('aria-live', 'polite');

  box.append(pet, nameEl, status, live);
  document.body.appendChild(box);
  population++;
  save(); // stamp firstSeen on the first visit so the week can start counting
  if (earnedGold) ctx.emit('pixel-pet:gold');

  // the gold coat gets one quiet sentence, the first time it is earned, then never
  const goldGreeting = earnedGold && !celebrated;
  if (goldGreeting) { celebrated = true; save(); }

  const LINES = {
    idle: `${name} blinks at you, slowly, with approval.`,
    happy: `${name}: nom nom nom!`,
    hungry: `${name} is looking at your cursor the way you look at snacks...`,
    sleep: `${name} is napping. Zzz.`,
  };
  function mood() {
    const now = Date.now();
    if (now - lastFed < happyMs) return 'happy';
    if (now - lastFed >= hungryMs) return 'hungry';
    if (now - lastPoke > 30000 && now - lastFed < hungryMs / 2) return 'sleep';
    return 'idle';
  }
  function draw() {
    const m = mood();
    pet.style.backgroundPositionX = `${-FRAME[m] * SIZE}px`;
    status.textContent = LINES[m];
  }
  draw();
  if (goldGreeting) {
    // set after the first draw() so the mood line doesn't clobber it
    status.textContent = `${name} turned gold overnight. Seven days of showing up will do that.`;
    live.textContent = status.textContent;
  }

  function feed() { lastFed = Date.now(); lastPoke = Date.now(); save(); draw(); live.textContent = LINES.happy; ctx.emit('pixel-pet:fed'); }
  pet.addEventListener('click', feed);
  const poke = () => { lastPoke = Date.now(); };
  window.addEventListener('pointermove', poke, { passive: true });

  // a slow poll re-reads hunger; pause it while the tab is hidden (contract law 2);
  // mood is derived from Date.now(), so nothing is lost by parking it
  let timer = setInterval(draw, 3000);
  const onVisibility = () => {
    clearInterval(timer);
    if (!document.hidden) { draw(); timer = setInterval(draw, 3000); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return {
    destroy() {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pointermove', poke);
      pet.removeEventListener('click', feed);
      box.remove();
      population--;
    },
  };
}

export default selfRegister({ id: 'pixel-pet', motion: 'informative', pointer: 'any', factory });
