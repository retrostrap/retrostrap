// spoiler.js - the spoiler is a native <details>, so reveal/hide already
// work for keyboard, screen readers, and the no-JS crowd. All we add is the
// rs:spoiler:toggle event and a programmatic handle.
import { emit } from '../core/events.js';

function enhance(el) {
  const onToggle = () => emit(el, 'spoiler:toggle', { revealed: el.open });
  el.addEventListener('toggle', onToggle);

  return {
    reveal() { el.open = true; },
    hide() { el.open = false; },
    toggle() { el.open = !el.open; },
    destroy() { el.removeEventListener('toggle', onToggle); },
  };
}

export default { name: 'spoiler', selector: '.rs-spoiler', enhance };
