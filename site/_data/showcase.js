// The community showcase (docs/10 §showcase-gallery). Reads the committed
// site/data/showcase.json, sites join by pull request, so the wall is data,
// not code. Empty until the first site lands, and that's honest.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export default async function () {
  try {
    const path = fileURLToPath(new URL('../data/showcase.json', import.meta.url));
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return [];
  }
}
