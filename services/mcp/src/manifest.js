// The manifest is the whole catalog as one file (docs/09). This server is a
// thin conversational skin over it, load it once, answer from memory.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

// Three homes: an explicit override (used unconditionally, so a typo'd path
// fails loudly instead of answering from the wrong catalog), the copy that
// ships in the npm package (prepack drops it beside src/, postpack removes it
// from a checkout), or the repo's built dist.
const bundled = join(HERE, '..', 'manifest.json');
const repoDist = join(HERE, '..', '..', '..', 'dist', 'manifest.json');

export const DEFAULT_MANIFEST =
  process.env.RETROSTRAP_MANIFEST || (existsSync(bundled) ? bundled : repoDist);

/** Read and parse a built manifest. Throws if the chosen home has none. */
export function loadManifest(path = DEFAULT_MANIFEST) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Every catalog entry in one flat list, each still carrying its `kind`. */
export function allEntries(manifest) {
  return [...manifest.components, ...manifest.widgets, ...manifest.themes];
}
