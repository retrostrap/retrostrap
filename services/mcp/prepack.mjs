// prepack.mjs, runs on npm pack/publish: bundle the built manifest into the
// package, but refuse a stale one (a bumped framework that nobody rebuilt).
import { readFileSync, copyFileSync } from 'node:fs';

let manifest, root;
try {
  manifest = JSON.parse(readFileSync('../../dist/manifest.json', 'utf8'));
  root = JSON.parse(readFileSync('../../package.json', 'utf8'));
} catch {
  console.error('prepack: no ../../dist/manifest.json; run npm run build at the repo root first');
  process.exit(1);
}
if (manifest.version !== root.version) {
  console.error(`prepack: dist/manifest.json says ${manifest.version}, the framework says ${root.version}; rebuild first`);
  process.exit(1);
}
copyFileSync('../../dist/manifest.json', 'manifest.json');
console.log(`prepack: bundled manifest ${manifest.version} (${manifest.components.length} components)`);
