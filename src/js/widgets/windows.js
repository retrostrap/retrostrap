// windows.js - the draggable window manager (docs/05). It takes over every
// rs-window marked data-rs-window="floating": drag by the titlebar (mouse,
// touch, or keyboard arrows), click to bring to front, and a cap of five so a
// page can't bury itself. Below the svga breakpoint dragging is off, dragging
// a 16px titlebar with a thumb is misery, and the windows render in flow.
import { selfRegister } from './_overlay.js';

const MAX = 5;
const BASE_Z = 300; // the --rs-z-window band

function factory(root, options, ctx) {
  const coarseSmall = window.matchMedia('(max-width: 799px)').matches;
  // scope to the host (usually <body>), so two managers don't fight over one set
  const scope = root.querySelectorAll ? root : document;
  const wins = [...scope.querySelectorAll('.rs-window[data-rs-window="floating"]')].slice(0, MAX);
  if (!wins.length) return {};

  let top = BASE_Z;
  const cleanups = [];

  wins.forEach((win) => {
    const bar = win.querySelector('.rs-window__titlebar');
    if (!bar) return;
    win.style.position = coarseSmall ? '' : 'fixed';
    win.style.zIndex = coarseSmall ? '' : String(++top);

    const raise = () => { if (!coarseSmall) win.style.zIndex = String(++top); ctx.emit('window:focus', {}); };
    win.addEventListener('pointerdown', raise);
    // taskbars and desktop icons lift a buried window by dispatching this;
    // pointerdown alone can't reach one that sits behind another
    win.addEventListener('rs:window:raise', raise);
    cleanups.push(() => {
      win.removeEventListener('pointerdown', raise);
      win.removeEventListener('rs:window:raise', raise);
    });

    if (coarseSmall) return; // no dragging on small screens

    // pointer drag
    let dragging = false;
    let ox = 0;
    let oy = 0;
    const down = (e) => {
      if (e.target.closest('.rs-window__controls')) return; // don't drag off the buttons
      dragging = true;
      const r = win.getBoundingClientRect();
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      bar.setPointerCapture?.(e.pointerId);
      bar.style.cursor = 'grabbing';
    };
    const move = (e) => {
      if (!dragging) return;
      const x = Math.max(0, Math.min(window.innerWidth - win.offsetWidth, e.clientX - ox));
      const y = Math.max(0, Math.min(window.innerHeight - win.offsetHeight, e.clientY - oy));
      win.style.left = `${Math.round(x)}px`; win.style.top = `${Math.round(y)}px`; win.style.right = 'auto';
    };
    const up = () => { dragging = false; bar.style.cursor = ''; };
    bar.style.cursor = 'grab';
    bar.style.touchAction = 'none';
    bar.addEventListener('pointerdown', down);
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', up);

    // keyboard drag: focus the titlebar, arrow to move
    bar.tabIndex = bar.tabIndex < 0 ? 0 : bar.tabIndex;
    const key = (e) => {
      const step = e.shiftKey ? 2 : 16;
      const r = win.getBoundingClientRect();
      let nx = r.left;
      let ny = r.top;
      if (e.key === 'ArrowLeft') nx -= step; else if (e.key === 'ArrowRight') nx += step;
      else if (e.key === 'ArrowUp') ny -= step; else if (e.key === 'ArrowDown') ny += step;
      else if (e.key === 'Home') { nx = 0; ny = 0; } else return;
      e.preventDefault();
      win.style.left = `${Math.max(0, Math.min(window.innerWidth - win.offsetWidth, nx))}px`;
      win.style.top = `${Math.max(0, Math.min(window.innerHeight - win.offsetHeight, ny))}px`;
      win.style.right = 'auto';
    };
    bar.addEventListener('keydown', key);

    cleanups.push(() => {
      bar.removeEventListener('pointerdown', down);
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', up);
      bar.removeEventListener('keydown', key);
      bar.style.cursor = ''; win.style.position = ''; win.style.zIndex = '';
    });
  });

  return { destroy() { cleanups.forEach((fn) => fn()); } };
}

export default selfRegister({ id: 'windows', motion: 'informative', pointer: 'any', factory });
