// neko, the cat's behaviors and its half of the Toybox contract (docs/05).
import { test, expect } from '@playwright/test';

test('chase: the cat runs toward the pointer', async ({ page }) => {
  await page.setContent(
    `<!doctype html><html lang="en"><head>
      <link rel="stylesheet" href="http://localhost:8098/dist/retrostrap.min.css"></head>
     <body data-rs-widgets="neko" data-rs-neko-behavior="chase" data-rs-neko-speed="fast">
      <div class="rs-page rs-container"><h1>cats</h1></div>
      <script src="http://localhost:8098/dist/retrostrap.min.js"></script>
      <script src="http://localhost:8098/dist/retrostrap-toybox.min.js"></script></body></html>`,
    { waitUntil: 'networkidle' }
  );
  const cat = page.locator('.rs-neko');
  await expect(cat).toBeAttached();
  await expect(cat).toHaveAttribute('aria-hidden', 'true');
  await expect(cat).toHaveCSS('pointer-events', 'none');

  await page.mouse.move(560, 100);
  const t1 = await cat.evaluate((c) => c.style.transform);
  await page.waitForTimeout(500);
  const t2 = await cat.evaluate((c) => c.style.transform);
  expect(t1).not.toBe(t2); // it moved
});

test('reduced motion: the cat stays, sitting, and does not move', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setContent(
    `<!doctype html><html lang="en"><head>
      <link rel="stylesheet" href="http://localhost:8098/dist/retrostrap.min.css"></head>
     <body data-rs-widgets="neko">
      <div class="rs-page rs-container"><h1>cats</h1></div>
      <script src="http://localhost:8098/dist/retrostrap.min.js"></script>
      <script src="http://localhost:8098/dist/retrostrap-toybox.min.js"></script></body></html>`,
    { waitUntil: 'networkidle' }
  );
  const cat = page.locator('.rs-neko');
  await expect(cat).toBeAttached(); // the cat is not motion, it stays
  const t1 = await cat.evaluate((c) => c.style.transform);
  await page.mouse.move(500, 100);
  await page.waitForTimeout(400);
  const t2 = await cat.evaluate((c) => c.style.transform);
  expect(t1).toBe(t2); // but it holds still
  // sitting frame = background-position-x 0
  expect(await cat.evaluate((c) => c.style.backgroundPositionX)).toBe('0px');
});

test('skin option loads the matching sprite, and two cats is the limit', async ({ page }) => {
  await page.setContent(
    `<!doctype html><html lang="en"><head>
      <link rel="stylesheet" href="http://localhost:8098/dist/retrostrap.min.css"></head>
     <body>
      <div data-rs-widgets="neko" data-rs-neko-skin="calico"></div>
      <div data-rs-widgets="neko" data-rs-neko-skin="void"></div>
      <div data-rs-widgets="neko" data-rs-neko-skin="gif"></div>
      <script src="http://localhost:8098/dist/retrostrap.min.js"></script>
      <script src="http://localhost:8098/dist/retrostrap-toybox.min.js"></script></body></html>`,
    { waitUntil: 'networkidle' }
  );
  const cats = page.locator('.rs-neko');
  await expect(cats).toHaveCount(2); // third refused (docs/05)
  const bg = await cats.first().evaluate((c) => c.style.backgroundImage);
  expect(bg).toContain('neko-calico.png');
});

test('destroy removes the cat and frees its slot', async ({ page }) => {
  await page.setContent(
    `<!doctype html><html lang="en"><head>
      <link rel="stylesheet" href="http://localhost:8098/dist/retrostrap.min.css"></head>
     <body data-rs-widgets="neko" data-rs-neko-behavior="chase">
      <div class="rs-page rs-container"><h1>cats</h1></div>
      <script src="http://localhost:8098/dist/retrostrap.min.js"></script>
      <script src="http://localhost:8098/dist/retrostrap-toybox.min.js"></script></body></html>`,
    { waitUntil: 'networkidle' }
  );
  await expect(page.locator('.rs-neko')).toBeAttached();
  await page.evaluate(() => Retrostrap.destroy());
  expect(await page.locator('.rs-neko').count()).toBe(0);
  // the population slot was released, so a fresh init mounts a cat again
  await page.evaluate(() => Retrostrap.init());
  await expect(page.locator('.rs-neko')).toHaveCount(1);
});
