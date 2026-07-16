// A static reading of the five laws over an HTML string. The real auditor
// (src/js/core/audit.js) walks computed styles in a browser; here there's no
// DOM, so we read what a generator actually writes: inline `style=""` and
// `<style>` blocks. Same rules, same hint strings, so a machine can treat both
// reports the same way. It's a pre-flight, not a replacement, the in-browser
// audit still has the final word on the cascade (link underlines, inherited
// colors). See docs/09's feedback loop.

const CSS_WIDE = new Set([
  'transparent', 'inherit', 'initial', 'unset', 'revert', 'currentcolor', 'none', 'auto',
]);
// The 16 classic named colors (plus the two aliases). All live in the palette.
const LEGAL_NAMES = new Set([
  'black', 'silver', 'gray', 'grey', 'white', 'maroon', 'red', 'purple', 'fuchsia',
  'magenta', 'green', 'lime', 'olive', 'yellow', 'navy', 'blue', 'teal', 'aqua', 'cyan',
]);
// Named colors generators reach for that aren't on the cube. Not exhaustive,
// the hex/rgb checks below carry the load; this just catches the frequent slips.
const ILLEGAL_NAMES = new Set([
  'orange', 'gold', 'pink', 'salmon', 'tomato', 'crimson', 'coral', 'khaki', 'violet',
  'indigo', 'turquoise', 'orchid', 'tan', 'brown', 'plum', 'lavender', 'beige', 'ivory',
  'azure', 'chartreuse', 'hotpink', 'deeppink', 'skyblue', 'orangered', 'darkred',
  'lightblue', 'lightgreen', 'lightgray', 'lightgrey', 'darkgray', 'dimgray', 'wheat',
]);

const COLOR_PROPS = new Set([
  'color', 'background-color', 'border-color', 'border-top-color', 'border-right-color',
  'border-bottom-color', 'border-left-color', 'outline-color', 'caret-color', 'fill', 'stroke',
]);

function buildLaws(laws) {
  const hex = new Set(laws.palette.colors.map((c) => c.toUpperCase()));
  const rgb = new Set(laws.palette.colors.map((c) => {
    const n = c.slice(1);
    return `${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)}`;
  }));
  // Every family named anywhere in the nine stacks, plus the generics.
  const fonts = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy']);
  for (const stack of Object.values(laws.fonts.stacks)) {
    for (const fam of stack.split(',')) fonts.add(fam.trim().replace(/^["']|["']$/g, '').toLowerCase());
  }
  const easing = new Set(laws.motion.easing); // linear, steps, step-start, step-end
  return { hex, rgb, fonts, easing };
}

const snap = (n) => [0, 51, 102, 153, 204, 255].reduce((a, b) => (Math.abs(b - n) < Math.abs(a - n) ? b : a));
const hex2 = (n) => n.toString(16).padStart(2, '0').toUpperCase();
const nearestHint = (r, g, b) => `off palette; nearest legal is #${hex2(snap(r))}${hex2(snap(g))}${hex2(snap(b))}`;

// The blur is the third length; mirror the runtime auditor exactly. The length
// cap and the non-overlapping number pattern keep a `box-shadow:999…9` digit run
// from backtracking quadratically, a real shadow value is never this long.
function shadowBlur(value) {
  if (!value || value === 'none' || value.length > 2000) return 0;
  let max = 0;
  for (const part of value.split(/,(?![^(]*\))/)) {
    const lengths = part.match(/-?(?:\d+(?:\.\d+)?|\.\d+)px/g);
    if (lengths && lengths[2]) max = Math.max(max, parseFloat(lengths[2]));
  }
  return max;
}

function parseHex(tok) {
  let s = tok.slice(1);
  if (s.length === 3) s = s.split('').map((ch) => ch + ch).join('');
  else if (s.length === 4) s = s.slice(0, 3).split('').map((ch) => ch + ch).join('') + s[3] + s[3];
  if (s.length !== 6 && s.length !== 8) return null;
  const r = parseInt(s.slice(0, 2), 16);
  const g = parseInt(s.slice(2, 4), 16);
  const b = parseInt(s.slice(4, 6), 16);
  const a = s.length === 8 ? parseInt(s.slice(6, 8), 16) / 255 : 1;
  return { r, g, b, a };
}

function parseRgb(tok) {
  const m = tok.match(/rgba?\(([^)]+)\)/i);
  if (!m) return null;
  const parts = m[1].replace(/\//g, ' ').replace(/,/g, ' ').split(/\s+/).filter(Boolean);
  const chan = (x) => (x.endsWith('%') ? Math.round(parseFloat(x) * 2.55) : parseFloat(x));
  const r = chan(parts[0]); const g = chan(parts[1]); const b = chan(parts[2]);
  let a = 1;
  if (parts[3] != null) a = parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
  return { r, g, b, a };
}

// Check one color object against the palette; return a violation part or null.
function judgeColor(col, raw, L) {
  if (col.a === 0) return null;             // fully transparent is absence, not color
  if (col.a < 1) return { rule: 'translucent-ui', hint: 'UI colors are opaque (alpha 1)' };
  if (L.rgb.has(`${col.r},${col.g},${col.b}`)) return null;
  return { rule: 'palette', hint: nearestHint(col.r, col.g, col.b) };
}

function checkColors(prop, value, L, add) {
  for (const tok of value.match(/#[0-9a-fA-F]{3,8}\b/g) || []) {
    const col = parseHex(tok);
    if (!col) continue;
    const v = judgeColor(col, tok, L);
    if (v) add(v.rule, tok, v.hint);
  }
  for (const tok of value.match(/rgba?\([^)]*\)/gi) || []) {
    const col = parseRgb(tok);
    if (!col || Number.isNaN(col.r)) continue;
    const v = judgeColor(col, tok, L);
    if (v) add(v.rule, tok, v.hint);
  }
  // Bare keyword on a color property (color: orange).
  if (COLOR_PROPS.has(prop)) {
    const kw = value.trim().toLowerCase();
    if (/^[a-z]+$/.test(kw) && !CSS_WIDE.has(kw) && !LEGAL_NAMES.has(kw) && ILLEGAL_NAMES.has(kw)) {
      add('palette', value.trim(), `"${kw}" is not one of the 16 legal named colors; use a web-safe hex`);
    }
  }
}

function checkDecls(decls, selector, tag, L, violations) {
  const add = (rule, value, hint) => violations.push({ rule, selector, value, hint });
  for (const { prop, value } of decls) {
    checkColors(prop, value, L, add);

    if (prop === 'border-radius' || /^border-(top|bottom)-(left|right)-radius$/.test(prop) ||
        prop === 'border-start-start-radius' || prop === 'border-start-end-radius' ||
        prop === 'border-end-start-radius' || prop === 'border-end-end-radius') {
      const nums = value.match(/-?\d*\.?\d+/g) || [];
      if (nums.some((n) => parseFloat(n) !== 0)) add('radius', value, 'border-radius must be 0 (Shape Law)');
    }

    if (prop === 'box-shadow' || prop === 'text-shadow') {
      if (shadowBlur(value) > 0) add('shadow-blur', value, `${prop} blur must be 0; use a hard offset or a bevel`);
    }

    if (prop === 'transition-timing-function' || prop === 'animation-timing-function') {
      for (const fn of value.split(',')) {
        const f = fn.trim().replace(/\([^)]*\)/, '').toLowerCase();
        if (f && !L.easing.has(f)) add('easing', fn.trim(), `${prop.split('-')[0]} easing must be linear or steps() (Motion Law)`);
      }
    }
    if (prop === 'transition' || prop === 'animation') {
      if (/\bcubic-bezier\s*\(/i.test(value) || /\bease(-in|-out|-in-out)?\b/i.test(value)) {
        add('easing', value, `${prop} easing must be linear or steps() (Motion Law)`);
      }
    }

    if (prop === 'font-family') {
      const first = value.split(',')[0].trim().replace(/^["']|["']$/g, '').toLowerCase();
      if (first && !L.fonts.has(first)) add('font', value, 'use one of the nine era font stacks (Font Law)');
    }

    if (tag === 'a' && (prop === 'text-decoration' || prop === 'text-decoration-line') && /\bnone\b/.test(value)) {
      add('link-underline', value, 'content links are always underlined');
    }
  }
}

function parseDeclString(str) {
  const out = [];
  for (const chunk of str.split(';')) {
    const i = chunk.indexOf(':');
    if (i < 0) continue;
    const prop = chunk.slice(0, i).trim().toLowerCase();
    const value = chunk.slice(i + 1).trim();
    if (prop && value) out.push({ prop, value });
  }
  return out;
}

/**
 * Statically audit an HTML string against the design laws.
 * @param {string} html
 * @param {object} laws  the manifest's `laws` block
 * @returns {{ ok: boolean, violations: object[], stats: object }}
 */
export function auditHtml(html, laws) {
  const L = buildLaws(laws);
  const violations = [];
  // Audit generated pages, not blobs. The cap bounds every scan below so a
  // pathological input can't hang the (single-threaded) server.
  const whole = String(html);
  const src = whole.length > 500000 ? whole.slice(0, 500000) : whole;

  // 1) inline style="" (both quote styles), tag name in hand for the <a> rule.
  const inline = /<([a-zA-Z][\w-]*)\b[^>]{0,300}?\sstyle\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let m;
  let inlineCount = 0;
  while ((m = inline.exec(src))) {
    inlineCount += 1;
    const tag = m[1].toLowerCase();
    checkDecls(parseDeclString(m[2] ?? m[3] ?? ''), `${tag}[inline]`, tag, L, violations);
  }

  // 2) <style> blocks: strip comments, then walk `selector { decls }` rules in a
  // single forward pass. A greedy `[^{}]+\{…\}` regex here backtracks
  // quadratically on a brace-free run, an easy hang on generated CSS.
  // linear scan for <style> blocks: the lazy `[\s\S]{0,50000}?<\/style>` regex backtracks
  // quadratically on unclosed <style> spam (an easy stall on hostile input); indexOf stays O(n)
  const blocks = [];
  {
    const lc = src.toLowerCase();
    let p = 0;
    while (blocks.length < 1000) {
      const open = lc.indexOf('<style', p);
      if (open < 0) break;
      const c = lc[open + 6];
      if (c && !/[\s/>]/.test(c)) { p = open + 6; continue; } // <style-switcher> and the like are not style blocks
      const gt = src.indexOf('>', open);
      if (gt < 0) break;
      const end = lc.indexOf('</style', gt + 1);
      blocks.push(src.slice(gt + 1, end < 0 ? src.length : end));
      p = end < 0 ? src.length : end + 7;
    }
  }
  let ruleCount = 0;
  for (const block of blocks) {
    const css = block.replace(/\/\*[\s\S]*?\*\//g, '');
    let pos = 0;
    while (pos < css.length) {
      const open = css.indexOf('{', pos);
      if (open < 0) break;
      const close = css.indexOf('}', open + 1);
      if (close < 0) break;
      const selector = css.slice(pos, open).trim().replace(/\s+/g, ' ');
      const body = css.slice(open + 1, close);
      pos = close + 1;
      if (!selector) continue;
      ruleCount += 1;
      const tag = /^a\b|(?:^|,)\s*a\b/.test(selector) ? 'a' : null;
      checkDecls(parseDeclString(body), selector, tag, L, violations);
    }
  }

  return {
    ok: violations.length === 0,
    violations,
    stats: { inlineStyles: inlineCount, cssRules: ruleCount, violations: violations.length },
  };
}
