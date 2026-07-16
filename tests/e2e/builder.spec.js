// The builder is a real app, so it gets real coverage: the catalog drives the
// palette, blocks compose and reorder, the page settings reach both the canvas
// and the export, preview runs a widget and edit tears it down, and projects
// round-trip through localStorage.
import { test, expect } from '@playwright/test';

const PAGE = '/demos/builder/index.html';
const canvas = (page) => page.frames().find((f) => f.url().includes('canvas.html'));
const blocks = (page) => canvas(page).locator('.bx-block');

async function ready(page) {
  await page.goto(PAGE);
  await page.waitForSelector('.bx-pal');
}

test('palette is generated from the catalog (basics + components)', async ({ page }) => {
  await ready(page);
  expect(await page.locator('.bx-pal').count()).toBeGreaterThan(20);
  await expect(page.locator('.bx-pal[data-id="text-heading"]')).toHaveCount(1);
  await expect(page.locator('.bx-pal[data-id="panel"]')).toHaveCount(1);
});

test('adds and deletes blocks; export is a full standalone document', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.locator('.bx-pal[data-id="panel"]').click();
  await expect(blocks(page)).toHaveCount(2);
  // blocks are editable in place
  await expect(canvas(page).locator('.bx-block h2').first()).toHaveAttribute('contenteditable', 'true');

  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).toContain('<!DOCTYPE html>');
  expect(html).toContain('rs-page rs-container');
  expect(html).toContain('rs-panel');
  expect(html).toContain('retrostrap.min.js'); // core script ships even with no widgets
  await page.locator('#bx-drawer-close').click();

  await page.locator('#bx-undo').click();
  await expect(blocks(page)).toHaveCount(1);
});

test('theme, wallpaper, and toybox reach the canvas and the export', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.keyboard.press('Escape'); // deselect → page settings
  await page.locator('#bx-inspector select[aria-label="Theme"]').selectOption('midnight');
  await page.locator('#bx-inspector select[aria-label="Wallpaper"]').selectOption('stars');
  await page.locator('#bx-inspector input[type="checkbox"]').first().check(); // kugeln

  await expect.poll(() => canvas(page).evaluate(() => document.documentElement.getAttribute('data-rs-theme'))).toBe('midnight');

  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).toContain('data-rs-theme="midnight"');
  expect(html).toContain('rs-tile-stars');
  expect(html).toContain('data-rs-widgets="kugeln"');
  expect(html).toContain('retrostrap-toybox.min.js');
});

test('preview runs a widget; returning to edit tears it down', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.keyboard.press('Escape');
  await page.locator('#bx-inspector input[type="checkbox"]').first().check(); // kugeln
  await page.locator('#bx-preview').click();
  await page.mouse.move(520, 300);
  await page.mouse.move(660, 400);
  await expect(canvas(page).locator('.rs-kugeln')).toHaveCount(1);
  await page.locator('#bx-preview').click();
  await expect(canvas(page).locator('.rs-kugeln')).toHaveCount(0);
});

test('dragging a component from the palette drops it at the pointer', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.locator('.bx-pal[data-id="text-para"]').click();
  await expect(blocks(page)).toHaveCount(2);

  const item = page.locator('.bx-pal[data-id="panel"]');
  await item.scrollIntoViewIfNeeded();
  const pal = await item.boundingBox();
  const fr = await page.locator('#bx-canvas').boundingBox();
  await page.mouse.move(pal.x + pal.width / 2, pal.y + pal.height / 2);
  await page.mouse.down();
  await page.mouse.move(pal.x + pal.width / 2 + 30, pal.y + pal.height / 2 + 10, { steps: 4 });
  await expect(page.locator('.bx-ghost')).toHaveCount(1); // a ghost follows the pointer
  await page.mouse.move(fr.x + fr.width / 2, fr.y + 50, { steps: 12 }); // over the canvas, near the top
  await page.mouse.up();

  await expect(blocks(page)).toHaveCount(3);
  const idx = await canvas(page).evaluate(() =>
    [...document.querySelectorAll('.bx-block')].findIndex((b) => b.querySelector('.rs-panel')));
  expect(idx).toBe(0); // dropped near the top → placed first

  // a click right after a drag must still add, the drag guard must not swallow it
  await page.locator('.bx-pal[data-id="text-para"]').click();
  await expect(blocks(page)).toHaveCount(4);
});

test('projects round-trip through localStorage', async ({ page }) => {
  await ready(page);
  page.on('dialog', (d) => d.accept()); // Delete now confirms; this test intends it
  await page.locator('.bx-pal[data-id="panel"]').click();
  await page.locator('#bx-name').fill('t1');
  await page.locator('#bx-save').click();
  await page.locator('#bx-new').click();
  await expect(blocks(page)).toHaveCount(0);
  await page.locator('#bx-projects').selectOption('t1');
  await page.locator('#bx-load').click();
  await expect(blocks(page)).toHaveCount(1);
});

test('widget options are generated from the catalog and reach the export', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.keyboard.press('Escape');
  await page.locator('#bx-inspector input[type="checkbox"]').first().check(); // kugeln
  await expect(page.locator('#bx-inspector select[aria-label="kugeln mode"]')).toHaveCount(1);
  await page.locator('#bx-inspector select[aria-label="kugeln mode"]').selectOption('orbit');
  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).toContain('data-rs-kugeln-mode="orbit"');
  expect(html).not.toContain('data-rs-kugeln-colors'); // rainbow is the default → omitted
});

test('imports a pasted page back into the model', async ({ page }) => {
  await ready(page);
  const paste = '<!DOCTYPE html><html lang="en" data-rs-theme="phosphor"><head><title>P</title></head>'
    + '<body class="rs-tile-grid" data-rs-widgets="snowfall" data-rs-snowfall-density="blizzard">'
    + '<div class="rs-page rs-container"><h2 class="rs-font-5">Imported heading</h2>'
    + '<section class="rs-panel"><p>hi there</p></section></div></body></html>';
  await page.locator('#bx-import').click();
  await page.locator('#bx-export-out').fill(paste);
  await page.locator('#bx-import-load').click();
  await expect(blocks(page)).toHaveCount(2);
  await expect.poll(() => canvas(page).evaluate(() => document.documentElement.getAttribute('data-rs-theme'))).toBe('phosphor');
  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).toContain('Imported heading');
  expect(html).toContain('data-rs-snowfall-density="blizzard"');
  expect(html).toContain('rs-tile-grid');
});

test('a link block gets an href field that edits the markup', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="text-link"]').click(); // adds and selects the link
  const href = page.locator('#bx-inspector input[aria-label="Link URL (href)"]');
  await expect(href).toHaveCount(1);
  await href.fill('https://example.com/space');
  await href.dispatchEvent('change');
  await expect.poll(() => canvas(page).evaluate(() => {
    const a = document.querySelector('.bx-block a');
    return a && a.getAttribute('href');
  })).toBe('https://example.com/space');
});

test('editing text then a structural op keeps both changes (no debounce desync)', async ({ page }) => {
  await ready(page);
  await page.locator('.bx-pal[data-id="panel"]').click(); // panel: editable text + a variant chip
  const p = canvas(page).locator('.bx-block .rs-panel p').first();
  await p.click();
  await page.keyboard.type('ZZ');
  await page.locator('#bx-inspector .bx-chip').first().click(); // toggle a variant immediately after typing
  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).toContain('ZZ'); // the inline edit survived
  expect(html).toMatch(/rs-panel--/); // and so did the variant toggle
});

test('a hostile theme from import cannot inject script into the export', async ({ page }) => {
  await ready(page);
  const paste = `<!DOCTYPE html><html data-rs-theme='x"><script>alert(1)</script>'><head><title>p</title></head>`
    + `<body class="rs-page"><div class="rs-page rs-container"><p>hi</p></div></body></html>`;
  await page.locator('#bx-import').click();
  await page.locator('#bx-export-out').fill(paste);
  await page.locator('#bx-import-load').click();
  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).not.toContain('<script>alert(1)'); // no injected script
  expect(html).not.toContain('data-rs-theme="x'); // the unknown theme was dropped
});

test('import neutralizes action=javascript:, ping, and off-origin widget src', async ({ page }) => {
  await ready(page);
  const paste = `<body class="rs-page" data-rs-widgets="hit-counter" data-rs-hit-counter-src="https://evil.example/c">`
    + `<div class="rs-page rs-container">`
    + `<form action="javascript:alert(1)"><button>go</button></form>`
    + `<p><a href="/ok" ping="https://evil.example/collect">x</a></p>`
    + `</div></body>`;
  await page.locator('#bx-import').click();
  await page.locator('#bx-export-out').fill(paste);
  await page.locator('#bx-import-load').click();
  await page.locator('#bx-export').click();
  const html = await page.locator('#bx-export-out').inputValue();
  expect(html).not.toContain('javascript:');  // form action neutralized to #
  expect(html).not.toContain('ping=');         // the tracking beacon attribute is dropped
  expect(html).not.toContain('evil.example');  // off-origin widget src and ping target are gone
});

test('New exits preview instead of leaving widgets running', async ({ page }) => {
  await ready(page);
  page.on('dialog', (d) => d.accept()); // New now confirms when the page has blocks
  await page.locator('.bx-pal[data-id="text-heading"]').click();
  await page.keyboard.press('Escape');
  await page.locator('#bx-inspector input[type="checkbox"]').first().check(); // kugeln
  await page.locator('#bx-preview').click();
  await expect(page.locator('#bx-preview')).toHaveAttribute('aria-pressed', 'true');
  await expect(canvas(page).locator('.rs-kugeln')).toHaveCount(1);
  await page.locator('#bx-new').click();
  await expect(page.locator('#bx-preview')).toHaveAttribute('aria-pressed', 'false');
  await expect(canvas(page).locator('.rs-kugeln')).toHaveCount(0);
});
