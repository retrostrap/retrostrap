// konami.js - the cheat code, and the party (docs/05). Loading this widget adds
// Retrostrap.konami.on(sequence, fn) and .trigger(). Declaring it on <body>
// arms the classic code (and any words in data-rs-konami-words): by default it
// starts a 30-second party (confetti snow,
// rainbow sparkle, a bouncing logo) that cleans up after itself; give it an
// href and it navigates to a secret page instead. Party mode composes only
// non-flashing widgets and stays within budget. Under reduced motion the party
// politely declines and leaves a little note instead.
import { selfRegister, safeUrl } from './_overlay.js';

const CLASSIC = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

// module-level so Retrostrap.konami works whether or not a host declared it
const listeners = [];
let bound = false;
let keyHandler = null;
const seqBuf = [];     // rolling buffer of the last few keys, for the classic code
let partying = false;
const running = new Set(); // teardowns for whatever the egg has on screen (party, notes)
// End it all, timers, listeners and guest widgets alike, so a host's destroy() (an SPA
// route change mid-party), an Esc, or a timer tears down every active piece. A Set, not
// one shared slot, so an overlapping note and party can't clobber each other's cleanup.
function stopParty() {
  for (const fn of [...running]) fn();
  running.clear();
  partying = false;
}
const cheatWords = ['xyzzy']; // typed secret words; xyzzy is always armed for the reference
let typed = '';        // a short rolling buffer of recent letters

function keyName(e) {
  if (e.key.startsWith('Arrow')) return e.key;
  return e.key.toLowerCase();
}

function bind() {
  if (bound || typeof document === 'undefined') return;
  bound = true;
  keyHandler = (e) => {
    // don't eat keystrokes meant for a form field
    const t = e.target;
    if (t && (t.isContentEditable || /^(?:input|textarea|select)$/i.test(t.tagName || ''))) return;
    const k = keyName(e);
    // rolling buffer: fires whenever the last ten keys are the code, extra presses and all
    seqBuf.push(k);
    if (seqBuf.length > CLASSIC.length) seqBuf.shift();
    if (seqBuf.length === CLASSIC.length && CLASSIC.every((v, i) => seqBuf[i] === v)) { seqBuf.length = 0; fireAll(); }
    // typed cheat words: a rolling buffer that fires when it ends in a registered word
    if (k.length === 1 && k >= 'a' && k <= 'z') {
      typed = (typed + k).slice(-24);
      for (const w of cheatWords) { if (w && typed.endsWith(w)) { typed = ''; fireAll(w); break; } }
    }
  };
  document.addEventListener('keydown', keyHandler);
}
// once the last egg unregisters (every host destroyed, every konami.on() off'd), stop listening
function unbind() {
  if (!bound || listeners.length) return;
  document.removeEventListener('keydown', keyHandler);
  keyHandler = null;
  bound = false;
}

function fireAll(word) {
  for (const fn of listeners) { try { fn(word); } catch { /* an egg never breaks the page */ } }
}

function on(_seq, fn) { listeners.push(fn); bind(); return () => { const i = listeners.indexOf(fn); if (i >= 0) listeners.splice(i, 1); unbind(); }; }
function trigger() { fireAll(); }

// attach the public API as soon as the module loads
const rs = typeof window !== 'undefined' && (window.Retrostrap || window.RS);
if (rs) rs.konami = { on, trigger, code: CLASSIC.join(' ') };

function party(ctx) {
  if (partying) return;
  partying = true;
  const RS = window.Retrostrap || window.RS;

  if (ctx.reducedMotion || !RS?.widget) {
    const note = document.createElement('div');
    note.className = 'rs-note';
    note.setAttribute('role', 'status');
    note.textContent = 'You found it! (party mode is resting, you asked for less motion)';
    note.style.cssText = 'position:fixed;inset-block-end:16px;inset-inline-start:50%;transform:translateX(-50%);z-index:var(--rs-z-fx,600)';
    document.body.appendChild(note);
    const t = setTimeout(stopParty, 6000);
    running.add(() => { clearTimeout(t); note.remove(); });
    return;
  }

  // bring only guests the page isn't already showing, and only ever clean up our own
  const spawn = (id, opts) => (RS.widget.get?.(document.body, id) ? null : RS.widget.init(id, document.body, opts));
  const guests = [
    spawn('snowfall', { glyph: 'confetti', density: 'blizzard' }),
    spawn('sparkle', { mode: 'ambient', palette: 'rainbow', zone: 'body' }),
    spawn('dvd', { text: '★ retrostrap ★', speed: 'fast' }),
  ].filter(Boolean);

  let timer;
  const onEsc = (e) => { if (e.key === 'Escape') stopParty(); };
  running.add(() => {
    clearTimeout(timer);
    document.removeEventListener('keydown', onEsc);
    for (const g of guests) g.destroy?.();
  });
  timer = setTimeout(stopParty, 30000); // the party runs half a minute, or until Esc
  document.addEventListener('keydown', onEsc);
}

// xyzzy is the oldest cheat there is, and the oldest answer to it, say so first,
// then throw the party anyway.
function nothingHappens(ctx) {
  const note = document.createElement('div');
  note.className = 'rs-note';
  note.setAttribute('role', 'status');
  note.textContent = 'Nothing happens.';
  note.style.cssText = 'position:fixed;inset-block-end:16px;inset-inline-start:50%;transform:translateX(-50%);z-index:var(--rs-z-fx,600)';
  document.body.appendChild(note);
  let t;
  const cleanup = () => { clearTimeout(t); note.remove(); };
  t = setTimeout(() => { running.delete(cleanup); note.remove(); party(ctx); }, 900);
  running.add(cleanup);
}

function factory(el, options, ctx) {
  bind();
  const href = typeof options.href === 'string' ? options.href : null;
  const off = on('classic', (word) => {
    if (word === 'xyzzy') { nothingHappens(ctx); return; }
    if (href) location.href = safeUrl(href); else party(ctx);
  });

  // extra triggers: type any of these secret words (data-rs-konami-words="xyzzy,gif")
  const words = typeof options.words === 'string' ? options.words.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean) : [];
  words.forEach((w) => cheatWords.push(w));

  // touch alternative: ten taps on the host (or Gif) within five seconds
  let taps = 0;
  let first = 0;
  const onTap = () => {
    const now = Date.now();
    if (now - first > 5000) { taps = 0; first = now; }
    if (++taps >= 10) { taps = 0; trigger(); }
  };
  el.addEventListener('pointerdown', onTap);

  return {
    destroy() {
      stopParty(); // an egg in flight outlives its trigger; end it with the host
      off();
      el.removeEventListener('pointerdown', onTap);
      words.forEach((w) => { const i = cheatWords.indexOf(w); if (i >= 0) cheatWords.splice(i, 1); });
    },
  };
}

export default selfRegister({ id: 'konami', motion: 'decorative', pointer: 'any', factory });
