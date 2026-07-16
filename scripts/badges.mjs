// badges.mjs - renders the "made with retrostrap" 88x31 buttons through the
// framework itself and writes them to .github/badges/ (for the README) and to
// dist/assets/badges/ (for early adopters to hotlink-free download). Every
// colorway uses only legal palette colors, they are retrostrap buttons.
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));

// [file, background, textColor, border, line1, line2]
const BADGES = [
  ['made-with-retrostrap', '#000080', '#FFFFFF', '#000000', 'made with', 'retrostrap'],
  ['made-with-retrostrap-crt', '#000000', '#33FF33', '#33FF33', 'made with', 'retrostrap'],
  ['made-with-retrostrap-kawaii', '#FFCCFF', '#CC0066', '#CC0066', 'made with', 'retrostrap'],
];

const badgeHtml = (bg, fg, border, l1, l2) => `<!doctype html><meta charset=utf-8>
<style>
  * { margin:0; box-sizing:border-box; }
  body { width:88px; height:31px; }
  .b {
    width:88px; height:31px; display:flex; flex-direction:column;
    align-items:center; justify-content:center; overflow:hidden;
    background:${bg}; color:${fg}; border:1px solid ${border};
    font:bold 10px/10px Verdana, sans-serif; text-align:center; letter-spacing:0;
    image-rendering:pixelated;
  }
  .b i { font-style:normal; font-size:8px; opacity:1; }
</style>
<div class="b"><i>${l1}</i>${l2}</div>`;

const out1 = join(ROOT, '.github', 'badges');
const out2 = join(ROOT, 'dist', 'assets', 'badges');
await mkdir(out1, { recursive: true });
await mkdir(out2, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 88, height: 31 }, deviceScaleFactor: 1 });

for (const [file, bg, fg, border, l1, l2] of BADGES) {
  await page.setContent(badgeHtml(bg, fg, border, l1, l2));
  const clip = { x: 0, y: 0, width: 88, height: 31 };
  await page.screenshot({ path: join(out1, `${file}.png`), clip });
  await page.screenshot({ path: join(out2, `${file}.png`), clip });
  console.log(`badge: ${file}.png`);
}

await browser.close();
console.log('badges: rendered to .github/badges/ and dist/assets/badges/');
