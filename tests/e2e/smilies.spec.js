// The smilies parser (docs/05): text nodes only, word boundaries, code-safe,
// and copy-paste faithful (alt = the original code).
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/smilies.html';

test('turns codes into images that carry the original code as alt', async ({ page }) => {
  await page.goto(PAGE);
  const imgs = page.locator('#greeting img.rs-smiley');
  await expect(imgs).toHaveCount(3);
  expect(await imgs.nth(0).getAttribute('alt')).toBe(':)');
  expect(await imgs.nth(1).getAttribute('alt')).toBe(';)');
  expect(await imgs.nth(2).getAttribute('alt')).toBe(':D');
  // the surrounding words are untouched
  await expect(page.locator('#greeting')).toContainText('Sign my guestbook');
});

test('respects word boundaries: "1998)" is not a smiley, a lone "8)" is', async ({ page }) => {
  await page.goto(PAGE);
  const imgs = page.locator('#mixed img.rs-smiley');
  // "1998)" → no smiley; "8) dollars" and "8) is cool" → two cool faces
  await expect(imgs).toHaveCount(2);
  expect(await imgs.first().getAttribute('alt')).toBe('8)');
  await expect(page.locator('#mixed')).toContainText('1998)'); // left as text
});

test('leaves code, kbd, and opted-out regions alone', async ({ page }) => {
  await page.goto(PAGE);
  expect(await page.locator('#code-safe img.rs-smiley').count()).toBe(0);
  await expect(page.locator('#code-safe code')).toHaveText(':)');
  expect(await page.locator('#opted-out img.rs-smiley').count()).toBe(0);
});

test('is idempotent and reverses cleanly on destroy', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#greeting img.rs-smiley')).toHaveCount(3);
  // re-init must not double-process (no smiley inside a smiley)
  await page.evaluate(() => Retrostrap.init());
  await expect(page.locator('#greeting img.rs-smiley')).toHaveCount(3);
  // destroy restores the typed text
  await page.evaluate(() => Retrostrap.destroy());
  await expect(page.locator('#greeting img.rs-smiley')).toHaveCount(0);
  await expect(page.locator('#greeting')).toContainText(':) Sign my guestbook ;)');
});

test('the cat face and the happy face convert too', async ({ page }) => {
  await page.goto(PAGE);
  const imgs = page.locator('#newcomers img.rs-smiley');
  await expect(imgs).toHaveCount(2);
  expect(await imgs.nth(0).getAttribute('alt')).toBe(':3');
  expect(await imgs.nth(1).getAttribute('alt')).toBe('^_^');
});

test('a :3 with a digit stuck to it is a time, not a cat', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#timey img.rs-smiley')).toHaveCount(0); // ":30" stays text
  await expect(page.locator('#timey')).toContainText(':30 sharp');
});

test('rs:content re-walks injected text (the docs/05 handshake)', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#greeting img.rs-smiley')).toHaveCount(3); // parser ran
  await page.evaluate(() => {
    const late = document.getElementById('late');
    late.textContent = 'freshly injected :) and :3';
    late.dispatchEvent(new CustomEvent('rs:content', { bubbles: true }));
  });
  const imgs = page.locator('#late img.rs-smiley');
  await expect(imgs).toHaveCount(2);
  expect(await imgs.nth(1).getAttribute('alt')).toBe(':3');
  // destroy still reverses everything, the late arrivals included
  await page.evaluate(() => Retrostrap.destroy());
  await expect(page.locator('#late img.rs-smiley')).toHaveCount(0);
  await expect(page.locator('#late')).toContainText('freshly injected :) and :3');
});
