// fortune.js - the fortune floppy: a little wisdom from the old web, one at a
// time, click for another (docs/05). The pick is seeded off the clock and then
// just steps forward, so it varies per visit and never needs Math.random.
// Custom lines via an inline <script type="application/json"> array.
import { selfRegister } from './_overlay.js';

const FORTUNES = [
  'The modem sings because it is glad to see you.',
  'A page that loads before the coffee is a page well made.',
  'Save early, save often. The lights flicker when you least expect them.',
  'Somewhere a webring is missing exactly your page.',
  'View source is the one tutorial that never lies.',
  'Refresh all you like. The counter believes in you.',
  'Under construction is a state of grace, not an apology.',
  'Every guestbook is a small act of faith.',
  'The cat on the masthead has been to more sites than you have.',
  'Every 404 was somebody\'s home page once.',
  'Every MIDI is performed live by your sound card, just for you.',
  'Beige is not a colour. Beige is a decade.',
  'The corner is coming. Keep the logo bouncing.',
  'You are visitor number one to your own heart.',
  'Best viewed with the phone off the hook.',
];

function factory(el, options, ctx) {
  let list = FORTUNES;
  const inline = el.querySelector('script[type="application/json"]');
  if (inline) { try { const p = JSON.parse(inline.textContent); if (Array.isArray(p) && p.length) list = p; } catch { /* keep defaults */ } }

  let i = Math.floor(Date.now() / 1000) % list.length; // seeded, no Math.random

  const quote = document.createElement('p');
  quote.className = 'rs-fortune__quote';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'rs-btn rs-btn--small';
  btn.textContent = 'another fortune';

  const show = () => { quote.textContent = list[i % list.length]; };
  const next = () => { i = (i + 1) % list.length; show(); ctx.emit('fortune:next'); };
  btn.addEventListener('click', next);

  el.append(quote, btn);
  show();

  return { destroy() { btn.removeEventListener('click', next); quote.remove(); btn.remove(); } };
}

export default selfRegister({ id: 'fortune', motion: 'informative', pointer: 'any', factory });
