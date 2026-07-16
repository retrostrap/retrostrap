// The informative widgets (docs/05): ticker, clock, last-updated, fortune,
// hit-counter. Informative means they keep their information under reduced
// motion and lose only the movement.
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/informative.html';

test('ticker scrolls its messages and pauses on hover', async ({ page }) => {
  await page.goto(PAGE);
  const track = page.locator('#ticker .rs-ticker__track');
  await expect(track).toContainText('Welcome to my page');
  const a = await track.evaluate((t) => t.style.transform);
  await page.waitForTimeout(200);
  const b = await track.evaluate((t) => t.style.transform);
  expect(a).not.toBe(b); // scrolling
  await page.locator('#ticker').dispatchEvent('pointerenter');
  const c = await track.evaluate((t) => t.style.transform);
  await page.waitForTimeout(150);
  expect(await track.evaluate((t) => t.style.transform)).toBe(c); // paused
});

test('ticker under reduced motion swaps text, never scrolls', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(PAGE);
  const ticker = page.locator('#ticker');
  await expect(ticker.locator('.rs-ticker__scroll')).toHaveText('Welcome to my page!!');
  await expect(ticker.locator('.rs-ticker__track')).toHaveCount(0); // no scrolling track
  await expect(ticker.locator('.rs-ticker__pause')).toBeVisible();  // still pausable
});

test('clock shows a live time and keeps an sr-only equivalent', async ({ page }) => {
  await page.goto(PAGE);
  const digits = page.locator('#clock .rs-counter');
  await expect(digits).toHaveText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(digits).toHaveAttribute('aria-hidden', 'true');
  await expect(page.locator('#clock time')).toHaveAttribute('datetime', /.+/);
});

test('last-updated prints a dated line', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#updated')).toContainText('Last updated:');
});

test('hit-counter: static pads to width, local increments across reloads', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#counter-static [aria-hidden]')).toHaveAttribute('data-rs-value', '004096');
  await expect(page.locator('#counter-static .rs-sr-only')).toContainText('visitor number 4,096');

  const first = await page.locator('#counter-local [aria-hidden]').getAttribute('data-rs-value');
  await page.reload();
  const second = await page.locator('#counter-local [aria-hidden]').getAttribute('data-rs-value');
  expect(Number(second)).toBe(Number(first) + 1); // local count grew by one
});

test('destroy tears down the informative widgets', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#ticker')).toHaveClass(/rs-ticker/); // mounted
  await expect(page.locator('#fortune .rs-fortune__quote')).not.toBeEmpty(); // fortune dealt one
  await page.evaluate(() => Retrostrap.destroy());
  await expect(page.locator('#ticker')).not.toHaveClass(/rs-ticker/);       // ticker
  await expect(page.locator('#clock')).not.toHaveClass(/rs-clock/);         // clock
  await expect(page.locator('#updated')).not.toHaveClass(/rs-last-updated/); // last-updated
  await expect(page.locator('#counter-static')).not.toHaveClass(/rs-counter/); // hit-counter
  await expect(page.locator('#fortune .rs-fortune__quote')).toHaveCount(0); // fortune, quote and
  await expect(page.locator('#fortune button')).toHaveCount(0);            // button both gone
});
