// check-pack.mjs - the last look in the box before it ships.
// Asks `npm pack --dry-run` what would go to the registry, then checks the
// good stuff is in and the private stuff is out. Assumes dist/ is built.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

if (!existsSync(join(root, 'dist', 'retrostrap.min.css'))) {
  console.error('check-pack: dist/ is missing or empty, run `npm run build` first.');
  process.exit(1);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const out = execFileSync('npm', ['pack', '--dry-run', '--json'], {
  cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
});
const files = new Set(JSON.parse(out)[0].files.map((f) => f.path));

// what a consumer needs: the built CSS/JS, the types, the license, the README
const mustShip = [
  'dist/retrostrap.css',
  'dist/retrostrap.min.css',
  'dist/retrostrap-patterns.css',
  'dist/retrostrap.js',
  'dist/retrostrap.min.js',
  'dist/retrostrap.esm.js',
  'dist/retrostrap-toybox.min.js',
  'dist/retrostrap.d.ts',
  'dist/manifest.json',
  'dist/guardrails.json',
  'dist/llms.txt',
  'dist/cheatsheet.md',
  'dist/prompt.txt',
  'README.md',
  'LICENSE',
  'package.json',
];
for (const f of mustShip) if (!files.has(f)) problems.push(`missing from the tarball: ${f}`);

const themes = [...files].filter((f) => /^dist\/themes\/[^/]+\.css$/.test(f));
if (themes.length < 9) problems.push(`expected at least 9 theme stylesheets, found ${themes.length}`);

const widgets = [...files].filter((f) => /^dist\/widgets\/[^/]+\.js$/.test(f));
if (widgets.length < 20) problems.push(`expected at least 20 widget files, found ${widgets.length}`);

if (![...files].some((f) => /^dist\/assets\/.+\.png$/.test(f))) {
  problems.push('no pixel-art assets in the tarball (dist/assets/*.png)');
}

// the box holds exactly what the whitelist promises; anything else stays home
const allowed = (f) =>
  (f.startsWith('dist/') && !f.startsWith('dist/retrospace/'))
  || f.startsWith('templates/')
  || ['package.json', 'README.md', 'LICENSE', 'CHANGELOG.md', 'MIGRATIONS.md'].includes(f);
for (const f of files) {
  if (!allowed(f)) problems.push(`stray path in the tarball: ${f}`);
}

// every exports-map target must actually be in the box (globs: one match will do)
const targets = [pkg.types, pkg.main, pkg.module, pkg.style];
for (const value of Object.values(pkg.exports ?? {})) {
  if (typeof value === 'string') targets.push(value);
  else for (const t of Object.values(value)) targets.push(t);
}
for (const t of targets) {
  if (!t) continue;
  const path = t.replace(/^\.\//, '');
  if (path.includes('*')) {
    const re = new RegExp(`^${path.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]+')}$`);
    if (![...files].some((f) => re.test(f))) problems.push(`exports glob matches nothing: ${t}`);
  } else if (!files.has(path)) {
    problems.push(`exports map points at a file not in the tarball: ${t}`);
  }
}

// package.json and the built bundle must agree on the version, or the release
// ships a bundle that introduces itself by the wrong number
const { default: Retrostrap } = await import(join(root, 'dist', 'retrostrap.esm.js'));
if (Retrostrap.version !== pkg.version) {
  problems.push(`version mismatch: package.json says ${pkg.version}, the bundle says ${Retrostrap.version} (src/js/index.js)`);
}

if (problems.length) {
  for (const p of problems) console.error(`check-pack: ${p}`);
  console.error(`check-pack: ${problems.length} problem(s), the tarball is not fit to ship.`);
  process.exit(1);
}
console.log(`check-pack: ${files.size} files, themes ${themes.length}, widgets ${widgets.length}, nothing private. Fit to ship.`);
