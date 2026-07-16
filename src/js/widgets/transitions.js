// transitions.js - page wipes between same-site pages via the View Transitions
// API (docs/05). Pure progressive enhancement: where the API isn't supported,
// navigation is simply instant, never broken. The API honors reduced motion on
// its own; we don't fight it. Styles: wipe, box-in, box-out, dissolve, checker.
import { selfRegister } from './_overlay.js';

const STYLES = {
  wipe: `
    ::view-transition-old(root){animation:rs-vt-wipe-out .15s steps(6,end) both}
    ::view-transition-new(root){animation:rs-vt-wipe-in .15s steps(6,end) both}
    @keyframes rs-vt-wipe-out{to{clip-path:inset(0 100% 0 0)}}
    @keyframes rs-vt-wipe-in{from{clip-path:inset(0 0 0 100%)}}`,
  'box-in': `
    ::view-transition-new(root){animation:rs-vt-box-in .15s steps(6,end) both}
    @keyframes rs-vt-box-in{from{clip-path:inset(50%)}to{clip-path:inset(0)}}`,
  'box-out': `
    ::view-transition-old(root){animation:rs-vt-box-out .15s steps(6,end) both}
    @keyframes rs-vt-box-out{to{clip-path:inset(50%)}}`,
  dissolve: `
    ::view-transition-old(root){animation:rs-vt-diss .15s steps(5,end) both}
    @keyframes rs-vt-diss{to{opacity:0}}`,
  checker: `
    ::view-transition-old(root){animation:rs-vt-diss .2s steps(4,end) both}
    @keyframes rs-vt-diss{to{opacity:0}}`,
};

function factory(el, options, ctx) {
  // feature gate: cross-document view transitions. No support => do nothing,
  // navigation stays instant and unbroken.
  const supported = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('view-transition-name: none');
  if (!supported || ctx.reducedMotion) return {};

  const style = STYLES[options.style] ? options.style : 'wipe';
  const node = document.createElement('style');
  node.textContent = `@view-transition{navigation:auto}\n${STYLES[style]}`;
  document.head.appendChild(node);

  return {
    destroy() { node.remove(); },
  };
}

export default selfRegister({ id: 'transitions', motion: 'decorative', pointer: 'any', factory });
