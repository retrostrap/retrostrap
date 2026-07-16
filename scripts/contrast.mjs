// contrast.mjs - recompute the WCAG 2.1 contrast matrix from the theme token
// files and fail if any body-text pair drops below AA (docs/08). The themes
// live inside a small legal palette; this keeps us honest inside it.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const THEMES = join(ROOT, 'src', 'css', 'themes');

// WCAG relative luminance and contrast ratio (docs/08)
const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const L = (hex) => {
  const [r, g, b] = [0, 2, 4].map((i) => lin(parseInt(hex.slice(i + 1, i + 3), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [L(a), L(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// the 16 classic named colors, so a token set to `navy` or `white` is measured
// rather than silently skipped (they are all legal, docs/02).
const NAMED = {
  black: '#000000', silver: '#C0C0C0', gray: '#808080', white: '#FFFFFF',
  maroon: '#800000', red: '#FF0000', purple: '#800080', fuchsia: '#FF00FF',
  green: '#008000', lime: '#00FF00', olive: '#808000', yellow: '#FFFF00',
  navy: '#000080', blue: '#0000FF', teal: '#008080', aqua: '#00FFFF',
};

// Resolve a raw token value to a #RRGGBB, following `var(--other, fallback)`
// chains and named colors. Returns null for anything not a color (sizes, fonts).
// Without this, a token written as var() or a named color slips the gate unseen.
function toHex(val, raw, depth = 0) {
  if (val == null || depth > 12) return null;
  const v = String(val).trim();
  const six = v.match(/^#([0-9A-Fa-f]{6})$/);
  if (six) return `#${six[1].toUpperCase()}`;
  const three = v.match(/^#([0-9A-Fa-f]{3})$/);
  if (three) return `#${[...three[1]].map((c) => c + c).join('').toUpperCase()}`;
  if (NAMED[v.toLowerCase()]) return NAMED[v.toLowerCase()];
  const ref = v.match(/^var\(\s*(--rs-[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (ref) return toHex(raw[ref[1]], raw, depth + 1) ?? (ref[2] ? toHex(ref[2], raw, depth + 1) : null);
  return null;
}

// classic lives in the base tokens; read it from there
async function readTokens(file) {
  const css = await readFile(file, 'utf8');
  // read every token in the file (last write wins, matching the cascade within one
  // sheet), not just the first brace block: a slice to the first `}` dropped tokens
  // in later rules, so a failing pair could pass the gate unseen
  const raw = {};
  for (const m of css.matchAll(/(--rs-[\w-]+):\s*([^;]+);/g)) raw[m[1]] = m[2].trim();
  const tokens = {};
  for (const key of Object.keys(raw)) { const hex = toHex(raw[key], raw); if (hex) tokens[key] = hex; }
  return tokens;
}

// the pairs that carry meaning: [foreground token, background token, role, large?].
// Body text and links render on content surfaces (panels, windows, the content
// sheet), never straight on the raw --rs-bg-page backdrop, so those are the pairs
// held to AA. A theme that DOES tint text for the page backdrop (kawaii's
// --rs-link-tinted) carries its own surface token; checking that per-theme swap
// wants a surface map, not a generic pair (backlog: contrast on tinted surfaces).
const PAIRS = [
  ['--rs-text', '--rs-bg-content', 'body text', false],
  ['--rs-text-muted', '--rs-bg-content', 'muted text', false],
  ['--rs-link', '--rs-bg-content', 'link', false],
  ['--rs-link-visited', '--rs-bg-content', 'visited link', false],
  ['--rs-heading', '--rs-bg-content', 'heading', true],
  ['--rs-titlebar-text', '--rs-titlebar-bg', 'titlebar text', false],
];

const AA = 4.5;
const AA_LARGE = 3;

// classic is the base token set; every theme inherits it and overrides some, so
// merge base under each theme (theme wins) to resolve tokens a theme doesn't restate
const base = await readTokens(join(ROOT, 'src', 'css', '00-tokens.css'));
const themeFiles = [
  { name: 'classic', tokens: base },
  ...await Promise.all((await readdir(THEMES)).filter((f) => f.endsWith('.css')).map(async (f) => ({
    name: f.replace('.css', ''),
    tokens: { ...base, ...await readTokens(join(THEMES, f)) },
  }))),
];

let failed = false;
const table = [];

for (const { name, tokens: t } of themeFiles) {
  for (const [fg, bg, role, large] of PAIRS) {
    if (!t[fg] || !t[bg]) continue; // token genuinely unset even after base merge
    const r = ratio(t[fg], t[bg]);
    const need = large ? AA_LARGE : AA;
    const pass = r >= need;
    if (!pass) failed = true;
    table.push({
      theme: name, role, fg: t[fg], bg: t[bg],
      ratio: r.toFixed(2), verdict: pass ? (r >= 7 ? 'AAA' : 'AA') : (large ? 'FAIL(large)' : 'FAIL'),
    });
  }
}

console.table(table);
if (failed) {
  console.error('contrast: at least one meaningful pair is below its WCAG threshold.');
  process.exit(1);
}
console.log(`contrast: ${themeFiles.length} themes, every measured pair passes.`);
