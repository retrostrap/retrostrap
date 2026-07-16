// Wave-1 widget behavior + the Toybox contract (docs/05): decoration is
// aria-hidden and pointer-transparent, respects reduced motion, and tears
// down cleanly.
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/widgets.html';

test('toybox loaded after core still registers and inits', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.widget.list().includes('cursor-trail'));
  expect(errors).toEqual([]);
  // the toybox registers every widget it ships; assert ours are among them
  const list = await page.evaluate(() => Retrostrap.widget.list());
  expect(list).toEqual(expect.arrayContaining(['cursor-trail', 'sparkle', 'snowfall']));
});

test('snowfall animates on a pointer-transparent canvas', async ({ page }) => {
  await page.goto(PAGE);
  const canvas = page.locator('canvas.rs-snowfall');
  await expect(canvas).toBeAttached();
  await expect(canvas).toHaveAttribute('aria-hidden', 'true');
  await expect(canvas).toHaveCSS('pointer-events', 'none');
  // the canvas content changes frame to frame
  const a = await canvas.evaluate((c) => c.getContext('2d').getImageData(0, 0, c.width, Math.min(40, c.height)).data.join(','));
  await page.waitForTimeout(200);
  const b = await canvas.evaluate((c) => c.getContext('2d').getImageData(0, 0, c.width, Math.min(40, c.height)).data.join(','));
  expect(a).not.toBe(b);
});

test('cursor-trail follows the pointer and its layer is inert', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelector('.rs-cursor-trail'));
  const layer = page.locator('.rs-cursor-trail');
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await expect(layer).toHaveCSS('pointer-events', 'none');
  // ten trailers requested, capped at 16, expect ten
  await expect(layer.locator('span')).toHaveCount(10);

  await page.mouse.move(200, 200);
  await page.mouse.move(400, 400);
  await page.waitForTimeout(100);
  const moved = await page.evaluate(() => {
    const s = document.querySelector('.rs-cursor-trail span');
    return s.style.transform.includes('translate3d');
  });
  expect(moved).toBe(true);
});

test('kugeln spheres trail the pointer and the layer is inert', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelector('.rs-kugeln'));
  const layer = page.locator('.rs-kugeln');
  await expect(layer).toHaveAttribute('aria-hidden', 'true');
  await expect(layer).toHaveCSS('pointer-events', 'none');
  // seven spheres requested (max 12); expect seven
  await expect(layer.locator('span')).toHaveCount(7);

  await page.mouse.move(180, 180);
  await page.mouse.move(360, 360);
  await page.waitForTimeout(100);
  const moved = await page.evaluate(() =>
    document.querySelector('.rs-kugeln span').style.transform.includes('translate3d'));
  expect(moved).toBe(true);
});

test('pixel-pet is a feedable, persistent companion', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelector('.rs-pixel-pet'));
  const pet = page.locator('.rs-pixel-pet button');
  await expect(pet).toHaveAttribute('aria-label', /Feed Blobby/);
  await pet.click(); // feed it
  const saved = await page.evaluate(() => localStorage.getItem('rs-pixel-pet'));
  expect(saved).toContain('Blobby');
  expect(saved).toContain('lastFed');
});

test('sparkle spawns twinkles and never blocks the page', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelector('.rs-sparkle-layer'));
  await expect(page.locator('.rs-sparkle-layer')).toHaveCSS('pointer-events', 'none');
  await page.mouse.move(150, 150);
  await page.mouse.down();
  await page.mouse.up();
  await expect(page.locator('.rs-sparkle-layer span').first()).toBeAttached();
});

test('reduced motion: no trail, no sparkle layer', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.widget.list().includes('snowfall'));
  await page.mouse.move(200, 200);
  await page.mouse.move(300, 300);
  await page.waitForTimeout(100);
  expect(await page.locator('.rs-cursor-trail').count()).toBe(0);
  expect(await page.locator('.rs-kugeln').count()).toBe(0);
  expect(await page.locator('.rs-sparkle-layer').count()).toBe(0);
  expect(await page.locator('canvas.rs-snowfall').count()).toBe(0); // canvas never mounts
  expect(await page.locator('.rs-pixel-pet').count()).toBe(1); // informative: the pet still shows, just static
});

test('coarse pointer: cursor-trail no-ops, sparkle still works', async ({ browser }) => {
  // a touch context reports a coarse pointer
  const ctx = await browser.newContext({ hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(PAGE);
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.widget.list().includes('snowfall'));
  await page.waitForTimeout(100);
  // fine-only cursor-trail and kugeln should not have built their layers
  expect(await page.locator('.rs-cursor-trail').count()).toBe(0);
  expect(await page.locator('.rs-kugeln').count()).toBe(0);
  await ctx.close();
});

test('destroy leaves nothing behind', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => document.querySelector('.rs-cursor-trail'));
  await page.evaluate(() => Retrostrap.destroy());
  expect(await page.locator('.rs-cursor-trail').count()).toBe(0);
  expect(await page.locator('.rs-kugeln').count()).toBe(0);
  expect(await page.locator('.rs-sparkle-layer').count()).toBe(0);
  expect(await page.locator('canvas.rs-snowfall').count()).toBe(0);
  expect(await page.locator('.rs-pixel-pet').count()).toBe(0);
});
