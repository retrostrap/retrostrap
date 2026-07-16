// smilies.js - type :) and see a face (docs/05). The parser walks text nodes
// only, skips code and form fields, fires on word boundaries so "8)" inside
// "1998)" stays text, is idempotent, and sets each image's alt to the original
// typed code, so copy-paste and screen readers get ":)" back, exactly as it
// went in. The sprite is cropped from one sheet with object-position.
import { selfRegister, assetBase } from './_overlay.js';

// code -> frame index in dist/assets/smilies.png
const CODES = {
  ':)': 0, ':-)': 0, ':(': 1, ':-(': 1, ';)': 2, ';-)': 2,
  ':D': 3, ':-D': 3, ':P': 4, ':-P': 4, ':p': 4,
  ':o': 5, ':O': 5, ':-o': 5, '8)': 6, '8-)': 6, 'B)': 6,
  ':|': 7, ':-|': 7, 'xD': 8, 'XD': 8, '<3': 9,
  ':3': 10, '^_^': 11,
};
const SIZE = 15;
const SKIP = new Set(['PRE', 'CODE', 'KBD', 'SAMP', 'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'A', 'BUTTON']);

// longest codes first so ":-)" wins over ":)"
const pattern = Object.keys(CODES)
  .sort((a, b) => b.length - a.length)
  .map((c) => c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  .join('|');

function factory(el, options, ctx) {
  const scope = (typeof options.scope === 'string' && document.querySelector(options.scope)) || el;
  const base = assetBase();
  const re = new RegExp(`(?:${pattern})`, 'g'); // for iterating matches
  const testRe = new RegExp(`(?:${pattern})`);  // separate, no lastIndex state

  const made = []; // for teardown: [img, originalTextNode-ish]
  const touched = []; // {parent, before} to restore

  function skip(node) {
    for (let p = node.parentNode; p && p.nodeType === 1; p = p.parentNode) {
      if (SKIP.has(p.tagName) || p.classList.contains('rs-smiley') || p.hasAttribute('data-rs-no-smilies')) return true;
    }
    return false;
  }

  function img(code) {
    const frame = CODES[code];
    const el2 = document.createElement('img');
    el2.className = 'rs-smiley';
    el2.src = options.src || `${base}/smilies.png`;
    el2.alt = code; // the original code, verbatim
    el2.width = SIZE;
    el2.height = SIZE;
    // size in the style too: the reset's img { height: auto } otherwise
    // squashes the 15px crop to the sheet's aspect ratio (a 1.5px smear)
    el2.style.cssText =
      `inline-size:${SIZE}px;block-size:${SIZE}px;` +
      `object-fit:none;object-position:-${frame * SIZE}px 0;image-rendering:pixelated;vertical-align:-3px`;
    return el2;
  }

  function walk(root = scope) {
    const nodes = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.nodeValue && testRe.test(n.nodeValue) && !skip(n) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
    });
    while (tw.nextNode()) nodes.push(tw.currentNode);

    for (const node of nodes) {
      const text = node.nodeValue;
      const frag = document.createDocumentFragment();
      let last = 0;
      re.lastIndex = 0;
      let m;
      let any = false;
      while ((m = re.exec(text))) {
        const before = text[m.index - 1];
        if (before && /[A-Za-z0-9]/.test(before)) continue; // word boundary: "1998)" stays text
        const after = text[m.index + m[0].length];
        if (after && /[A-Za-z0-9]/.test(after)) continue;   // and ":30" is a time, not a cat
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        const image = img(m[0]);
        frag.appendChild(image);
        made.push(image);
        last = m.index + m[0].length;
        any = true;
      }
      if (!any) continue;
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.parentNode.replaceChild(frag, node);
    }
  }

  walk();

  // the rs:content handshake (docs/05): anything that injects text after our
  // first pass (the guestbook's entries, a demo's own script) announces it
  // with a bubbling rs:content event, and we re-walk just that subtree
  const onContent = (e) => {
    const t = e.target;
    if (t && t.nodeType === 1 && scope.contains(t)) walk(t);
  };
  document.addEventListener('rs:content', onContent);

  return {
    destroy() {
      document.removeEventListener('rs:content', onContent);
      // put the code text back where each image sits
      for (const image of made) {
        if (image.parentNode) image.replaceWith(document.createTextNode(image.alt));
      }
      // merge adjacent text nodes so the DOM reads as it started
      scope.normalize();
    },
  };
}

export default selfRegister({ id: 'smilies', motion: 'informative', pointer: 'any', factory });
