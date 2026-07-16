// The design laws (docs/02), enforced as tests over the CSS source.
// If one of these fails, the change is wrong, not the test.
import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CSS_ROOT = fileURLToPath(new URL('../../src/css', import.meta.url));
const DIST_CSS = fileURLToPath(new URL('../../dist/retrostrap.css', import.meta.url));

function cssFiles(dir = CSS_ROOT) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? cssFiles(join(dir, entry.name)) : entry.name.endsWith('.css') ? [join(dir, entry.name)] : []
  );
}

// strip /* comments */, they legitimately mention off-palette colors we
// deliberately avoid, and comments ship nothing
const decomment = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

const sources = cssFiles().map((file) => ({
  file: file.slice(CSS_ROOT.length + 1),
  css: decomment(readFileSync(file, 'utf8')),
}));

// The 216 web-safe colors plus the 8 named colors that live off the cube.
const STEPS = ['00', '33', '66', '99', 'CC', 'FF'];
const LEGAL = new Set();
for (const r of STEPS) for (const g of STEPS) for (const b of STEPS) LEGAL.add(`#${r}${g}${b}`);
for (const named of ['#C0C0C0', '#808080', '#800000', '#800080', '#008000', '#808000', '#000080', '#008080']) {
  LEGAL.add(named);
}

const expand = (hex) =>
  hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;

function paletteOffenders(file, css) {
  const offenders = [];
  for (const raw of css.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []) {
    if (raw.length === 5 || raw.length === 9) {
      offenders.push(`${file}: ${raw} carries alpha, UI colors are opaque`);
    } else if (!LEGAL.has(expand(raw).toUpperCase())) {
      offenders.push(`${file}: ${raw} is off the palette`);
    }
  }
  return offenders;
}

describe('the palette law', () => {
  it('every hex color in the source is one of the 224 legal colors', () => {
    expect(sources.flatMap(({ file, css }) => paletteOffenders(file, css))).toEqual([]);
  });

  it('the built stylesheet stays on the palette too', () => {
    // the build could in theory rewrite colors; trust, but verify
    if (!existsSync(DIST_CSS)) return; // fresh checkout, the source check above still ran
    expect(paletteOffenders('dist/retrostrap.css', decomment(readFileSync(DIST_CSS, 'utf8')))).toEqual([]);
  });
});

describe('the shape law', () => {
  it('border-radius never leaves zero', () => {
    // the whitespace lives inside the lookahead, or the engine backtracks
    // around it and flags a literal `border-radius: 0` as an offender
    const offenders = sources.filter(({ css }) => /border-radius\s*:(?!\s*0\s*[;}])/.test(css));
    expect(offenders.map((s) => s.file)).toEqual([]);
  });

  it('shadows have no blur', () => {
    // three consecutive lengths where the third (blur) is non-zero
    const blurry = /(box-shadow|text-shadow|--rs-shadow[\w-]*)\s*:[^;]*-?\d[\d.]*(px|em|rem)\s+-?\d[\d.]*(px|em|rem)\s+(?!0[\s,;])[\d.]+(px|em|rem)/;
    const offenders = sources.filter(({ css }) => blurry.test(css));
    expect(offenders.map((s) => s.file)).toEqual([]);
  });
});

describe('the motion law', () => {
  it('only linear and steps() easing exist', () => {
    const eased = /(transition|animation)[^;{]*\b(ease(-in|-out|-in-out)?|cubic-bezier)\b/;
    const offenders = sources.filter(({ css }) => eased.test(css));
    expect(offenders.map((s) => s.file)).toEqual([]);
  });
});

describe('the tokens file', () => {
  const tokens = sources.find((s) => s.file === '00-tokens.css').css;

  it('declares the full theme contract', () => {
    const required = [
      '--rs-bg-page', '--rs-tile-page', '--rs-bg-content', '--rs-text', '--rs-text-muted',
      '--rs-heading', '--rs-link', '--rs-link-visited', '--rs-link-active',
      '--rs-accent', '--rs-accent-2', '--rs-good', '--rs-warn', '--rs-bad',
      '--rs-bevel-face', '--rs-bevel-light', '--rs-bevel-shadow', '--rs-bevel-dark',
      '--rs-titlebar-bg', '--rs-titlebar-bg-2', '--rs-titlebar-text', '--rs-border-color',
      '--rs-selection-bg', '--rs-selection-text', '--rs-focus-color',
      '--rs-font-body', '--rs-font-heading', '--rs-font-size-body',
    ];
    const missing = required.filter((token) => !tokens.includes(`${token}:`));
    expect(missing).toEqual([]);
  });

  it('declares the scales', () => {
    for (let i = 1; i <= 7; i++) expect(tokens).toContain(`--rs-font-size-${i}:`);
    for (let i = 0; i <= 5; i++) expect(tokens).toContain(`--rs-space-${i}:`);
    for (const band of ['raised', 'sticky', 'menu', 'window', 'dialog', 'splash', 'fx']) {
      expect(tokens).toContain(`--rs-z-${band}:`);
    }
  });

  it('links stay underlined and visited stays purple', () => {
    const base = sources.find((s) => s.file === '02-base.css').css;
    expect(base).toMatch(/a\s*{[^}]*text-decoration:\s*underline/);
    expect(base).toMatch(/a:visited\s*{[^}]*var\(--rs-link-visited\)/);
  });
});
