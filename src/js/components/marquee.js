// marquee.js - seamless looping, a pause button, and three sane speeds.
// The CSS already pauses on hover and focus; this adds the clone that makes
// the loop seamless and a real control for people who don't hover.
import { emit } from '../core/events.js';
import { reduced, onChange } from '../core/motion.js';

const SPEEDS = { slow: 30, normal: 60, fast: 120 }; // px per second (docs/02)

function enhance(el, options) {
  const track = el.querySelector('.rs-marquee__content');
  if (!track) return {};

  let speedName = SPEEDS[options.speed] ? options.speed : 'normal';
  let clone = null;
  let btn = null;
  const onClick = () => (el.hasAttribute('data-rs-paused') ? resume() : pause());

  function applySpeed(name) {
    // duration = distance / speed; each copy travels two of its own widths
    // per loop (+100% to -100%), so this keeps the real speed at 30/60/120
    const px = SPEEDS[name];
    const distance = 2 * track.scrollWidth;
    el.style.setProperty('--rs-marquee-duration', `${distance / px}s`);
  }
  function pause() {
    if (!clone) return; // reduced motion: nothing is scrolling to pause
    el.setAttribute('data-rs-paused', '');
    btn.textContent = 'Resume the scrolling banner';
    emit(el, 'marquee:pause');
  }
  function resume() {
    if (!clone) return;
    el.removeAttribute('data-rs-paused');
    btn.textContent = 'Pause the scrolling banner';
    emit(el, 'marquee:resume');
  }

  // The moving parts, the seamless-loop clone and the keyboard-reachable pause control, only
  // make sense while motion is welcome. Build them when it is, tear them down if the preference
  // flips to reduced (the CSS drops to static wrapped text, so a leftover clone would double it).
  function build() {
    if (clone) return;
    applySpeed(speedName);
    // a seamless loop needs a second copy running half a phase behind;
    // the clone class parks it over the original and applies the offset
    clone = track.cloneNode(true);
    clone.classList.add('rs-marquee__content--clone');
    clone.setAttribute('aria-hidden', 'true');
    // restart the original as the clone lands: the half-phase offset counts
    // from a shared starting line, not from stylesheet load, or the copies
    // sit short of one width apart and the seams overlap by the boot delay
    track.style.animation = 'none';
    void track.offsetWidth;
    track.style.animation = '';
    el.appendChild(clone);
    // rs-btn gives it lawful chrome (a bare button carries an off-palette UA background);
    // rs-sr-only keeps it out of the way until a keyboard reaches it
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'rs-btn rs-marquee__pause rs-sr-only';
    btn.textContent = 'Pause the scrolling banner';
    el.appendChild(btn);
    btn.addEventListener('click', onClick);
  }
  function teardown() {
    if (!clone) return;
    btn.removeEventListener('click', onClick);
    btn.remove(); btn = null;
    clone.remove(); clone = null;
    el.removeAttribute('data-rs-paused');
    el.style.removeProperty('--rs-marquee-duration');
  }

  if (!reduced()) build();
  const offMotion = onChange((isReduced) => (isReduced ? teardown() : build()));

  return {
    pause,
    resume,
    setSpeed(name) {
      if (!SPEEDS[name]) return;
      speedName = name; // remembered, so a rebuild after a reduced-motion flip keeps the chosen speed
      if (clone) applySpeed(name);
    },
    destroy() {
      offMotion();
      teardown();
    },
  };
}

export default { name: 'marquee', selector: '.rs-marquee', enhance };
