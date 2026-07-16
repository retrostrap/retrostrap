// check-fonts.mjs, the build-time half of Font Law: sizes come from the seven-step scale.
// Retrostrap.audit() checks font *family* at runtime, but computed font-size is noisy
// (rem inheritance, user zoom, custom roots), so the size scale is enforced here instead,
// against the source. Rule: any `font-size` with an absolute length (px/rem/pt/…) must use
// a `--rs-font-size-*` token. Relative units (em, %, ch) and keywords scale a token and pass.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const CSS_ROOT = new URL('../src/css/', import.meta.url).pathname;
const ABSOLUTE = /\b\d*\.?\d+(px|rem|pt|pc|cm|mm|in|q)\b/i; // an absolute length anywhere in the value

const walk = (dir) => readdirSync(dir).flatMap((name) => {
  const p = join(dir, name);
  return statSync(p).isDirectory() ? walk(p) : p.endsWith('.css') ? [p] : [];
});

const offenders = [];
for (const file of walk(CSS_ROOT)) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    // both `font-size` and the `font` shorthand carry a size; match either (but never a
    // custom-property name or the other font-* longhands). A scale token has no absolute
    // length, so the rule is simply: any absolute length here is off the scale. That also
    // catches an absolute `var(--rs-font-size-3, 14px)` fallback and a shorthand size,
    // both of which slid past the old size-property-only, token-anywhere check.
    const m = line.match(/(^|[^-])font(-size)?\s*:\s*([^;}]+)/);
    if (!m) return;
    const value = m[3].trim();
    if (!ABSOLUTE.test(value)) return;      // token, relative unit, or keyword, fine
    offenders.push(`${file.replace(CSS_ROOT, 'src/css/')}:${i + 1}  font${m[2] || ''}: ${value}`);
  });
}

if (offenders.length) {
  console.error(`Font Law: ${offenders.length} font-size(s) off the seven-step scale (use a --rs-font-size-* token):`);
  for (const o of offenders) console.error(`  ${o}`);
  process.exit(1);
}
console.log('Font Law: every font-size uses the seven-step scale.');
