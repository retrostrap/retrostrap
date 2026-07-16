// shots.mjs - grabs each demo at the three canonical viewports into
// site/assets/shots/ (docs/10). The screenshots are committed so the docs
// site builds without running a browser. Demos that honor ?rs-freeze=1 render
// deterministically; the rest just get a short settle.
import { chromium } from '@playwright/test';
import { readdir, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from './serve.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(ROOT, 'site', 'assets', 'shots');
const PORT = 8083;
const VIEWPORTS = [[375, 667], [800, 600], [1280, 800]];

async function demos() {
  const dir = join(ROOT, 'demos');
  const names = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    try {
      await access(join(dir, entry.name, 'index.html'));
      names.push(entry.name);
    } catch { /* no index.html, skip */ }
  }
  return names;
}

const names = await demos();
if (!names.length) { console.log('shots: no demos yet'); process.exit(0); }

await mkdir(OUT, { recursive: true });
const server = serve(PORT);
const browser = await chromium.launch();

for (const name of names) {
  for (const [w, h] of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    await page.goto(`http://localhost:${PORT}/demos/${name}/index.html?rs-freeze=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, `${name}--${w}.png`) });
    await page.close();
  }
  console.log(`shots: ${name} (${VIEWPORTS.map((v) => v[0]).join('/')})`);
}

await browser.close();
server.close();
console.log(`shots: ${names.length} demos → site/assets/shots/`);
