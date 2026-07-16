// Smoke test for the kitchen sink: the page loads clean, looks like 1996,
// and behaves like 2026 when the viewport shrinks.
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/kitchen-sink.html';

test('loads without console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
  page.on('pageerror', (err) => errors.push(String(err)));
  await page.goto(PAGE);
  expect(errors).toEqual([]);
});

test('wears the classic theme', async ({ page }) => {
  await page.goto(PAGE);
  const body = page.locator('body');
  await expect(body).toHaveCSS('background-color', 'rgb(192, 192, 192)'); // silver
  const font = await body.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(font).toContain('Times');
  await expect(page.locator('a').first()).toHaveCSS('text-decoration-line', 'underline');
});

test('the container holds the 760px line on a big screen', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(PAGE);
  const box = await page.locator('.rs-page.rs-container').boundingBox();
  expect(box.width).toBeLessThanOrEqual(760);
  // centered: roughly equal air on both sides
  expect(Math.abs(box.x - (1280 - box.width - box.x))).toBeLessThanOrEqual(2);
});

test('the layout swings the nav out to the left from svga up', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto(PAGE);
  const nav = await page.locator('#layout-nav').boundingBox();
  const main = await page.locator('#layout-main').boundingBox();
  expect(nav.x).toBeLessThan(main.x); // side by side, nav left
});

test('everything stacks on a phone, nothing scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(PAGE);
  const nav = await page.locator('#layout-nav').boundingBox();
  const main = await page.locator('#layout-main').boundingBox();
  expect(nav.y).toBeGreaterThan(main.y); // stacked, content first
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});

test('buttons wear the bevel', async ({ page }) => {
  await page.goto(PAGE);
  const btn = page.locator('#btn-plain');
  await expect(btn).toHaveCSS('border-top-color', 'rgb(255, 255, 255)');
  await expect(btn).toHaveCSS('border-bottom-color', 'rgb(0, 0, 0)');
  await expect(btn).toHaveCSS('border-top-left-radius', '0px'); // the Shape Law, computed
});

test('blink blinks, until someone asks it not to', async ({ page }) => {
  await page.goto(PAGE);
  const name = (el) => getComputedStyle(el).animationName;
  expect(await page.locator('.rs-blink').first().evaluate(name)).toBe('rs-blink');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.locator('.rs-blink').first().evaluate(name)).toBe('none');
  await expect(page.locator('.rs-blink').first()).toHaveCSS('font-weight', '700');
});

test('menus and spoilers keep their secrets by default', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#menu-demo li > ul')).toBeHidden();
  await expect(page.locator('#spoiler-demo p')).toBeHidden();
  await page.locator('#spoiler-demo summary').click();
  await expect(page.locator('#spoiler-demo p')).toBeVisible();
});

test('the dialog renders its costume', async ({ page }) => {
  await page.goto(PAGE);
  const dialog = page.locator('#dialog-demo');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.rs-dialog__titlebar')).toHaveCSS('color', 'rgb(255, 255, 255)');
});
