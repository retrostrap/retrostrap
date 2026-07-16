// sizes.mjs - the budget gate (docs/08). Sizes are gzipped, limits are law,
// and the build goes red long before the framework gets heavy.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

const BUDGETS = {
  'dist/retrostrap.min.css': 25 * 1024,
  'dist/retrostrap.min.js': 12 * 1024,
  'dist/retrostrap.esm.js': 12 * 1024,
  'dist/retrostrap-patterns.css': 15 * 1024,
  'dist/retrostrap-toybox.min.js': 30 * 1024,
};
// each theme and each widget answers to the docs/08 table too: 6KB apiece
try {
  for (const f of await readdir(join(ROOT, 'dist/themes'))) BUDGETS[`dist/themes/${f}`] = 6 * 1024;
  for (const f of await readdir(join(ROOT, 'dist/widgets'))) BUDGETS[`dist/widgets/${f}`] = 6 * 1024;
} catch {
  console.error('sizes: dist/ is incomplete, run the build first');
  process.exit(1);
}

let failed = false;

for (const [file, budget] of Object.entries(BUDGETS)) {
  let size;
  try {
    size = gzipSync(await readFile(join(ROOT, file))).length;
  } catch {
    console.error(`sizes: ${file} is missing, run the build first`);
    process.exit(1);
  }
  const line = `${file}  ${(size / 1024).toFixed(1)}KB gz of ${(budget / 1024).toFixed(0)}KB (${Math.round((size / budget) * 100)}%)`;
  if (size > budget) {
    failed = true;
    console.error('OVER  ' + line);
  } else {
    console.log('ok    ' + line);
  }
}

// the zero-runtime-dependency invariant is law (docs/03); enforce it, don't just claim it
const pkg = JSON.parse(await readFile(join(ROOT, 'package.json'), 'utf8'));
const deps = Object.keys(pkg.dependencies || {});
if (deps.length) {
  failed = true;
  console.error(`deps  runtime dependencies must be empty, found: ${deps.join(', ')}`);
} else {
  console.log('ok    dependencies: {} (zero runtime deps)');
}

process.exit(failed ? 1 : 0);
