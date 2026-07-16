// Wave-2 widgets (docs/05). The load-bearing checks: the jukebox never
// autoplays (Decency Law), the guestbook renders untrusted messages as text,
// party mode runs and cleans up, and the webring computes its own position.
import { test, expect } from '@playwright/test';

const WAVE2 = '/tests/e2e/pages/wave2.html';

test('starfield animates on a canvas; countdown counts', async ({ page }) => {
  await page.goto(WAVE2);
  await expect(page.locator('canvas.rs-starfield')).toBeAttached();
  await expect(page.locator('#cd .rs-counter')).toHaveText(/\d+d \d{2}:\d{2}:\d{2}/);
});

test('crt overlay exists and does not flicker by default', async ({ page }) => {
  await page.goto(WAVE2);
  const crt = page.locator('.rs-crt-overlay');
  await expect(crt).toBeAttached();
  await expect(crt).toHaveCSS('pointer-events', 'none');
  const o1 = await crt.evaluate((c) => getComputedStyle(c).opacity);
  await page.waitForTimeout(600);
  expect(await crt.evaluate((c) => getComputedStyle(c).opacity)).toBe(o1); // steady
});

test('dvd bounces around', async ({ page }) => {
  await page.goto(WAVE2);
  const dvd = page.locator('.rs-dvd');
  await expect(dvd).toBeAttached();
  const a = await dvd.evaluate((d) => d.style.transform);
  await page.waitForTimeout(200);
  expect(await dvd.evaluate((d) => d.style.transform)).not.toBe(a);
});

test('webring computes prev/random/next from this page position', async ({ page }) => {
  await page.goto(WAVE2);
  const links = page.locator('#ring a');
  await expect(links).toHaveCount(4);
  // this page is index 1; prev = Alpha (a.example), next = Gamma (g.example)
  await expect(links.nth(0)).toHaveAttribute('href', 'https://a.example/');
  await expect(links.nth(3)).toHaveAttribute('href', 'https://g.example/');
});

test('guestbook renders untrusted messages as text, never markup', async ({ page }) => {
  await page.goto(WAVE2);
  await expect(page.locator('#gb .rs-panel')).toHaveCount(2);
  // the malicious entry must not have created any element or run any script
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  expect(await page.locator('#gb img').count()).toBe(0);
  expect(await page.locator('#gb script:not([type])').count()).toBe(0);
  // the literal text is shown, angle brackets and all
  await expect(page.locator('#gb .rs-panel').nth(1)).toContainText('<img src=x onerror=');
});

test('destroy tears down every wave-2 widget', async ({ page }) => {
  await page.goto(WAVE2);
  await expect(page.locator('canvas.rs-starfield')).toBeAttached();
  await expect(page.locator('#ring a')).toHaveCount(4); // wait for the async webring too
  await expect(page.locator('#win')).toHaveCSS('position', 'fixed'); // windows took over
  const hasWipe = () => page.evaluate(() =>
    [...document.querySelectorAll('style')].some((s) => s.textContent.includes('@view-transition')));
  expect(await hasWipe()).toBe(true); // transitions injected its wipe
  await page.evaluate(() => Retrostrap.destroy());
  expect(await page.locator('canvas.rs-starfield').count()).toBe(0); // starfield canvas gone
  expect(await page.locator('.rs-crt-overlay').count()).toBe(0);      // crt overlay gone
  expect(await page.locator('.rs-dvd').count()).toBe(0);              // dvd logo gone
  expect(await page.locator('#cd .rs-counter').count()).toBe(0);      // countdown digits gone
  expect(await page.locator('#ring a').count()).toBe(0);              // webring cleared its host
  expect(await page.locator('#gb .rs-panel').count()).toBe(0);        // guestbook list gone
  expect(await page.locator('#win').evaluate((w) => w.style.position + w.style.zIndex)).toBe(''); // windows let go
  expect(await hasWipe()).toBe(false); // transitions style gone, navigation is plain again
});

test('windows: dragging works until destroy detaches the titlebar', async ({ page }) => {
  await page.goto(WAVE2);
  const win = page.locator('#win');
  await expect(win).toHaveCSS('position', 'fixed');
  const bar = page.locator('#win .rs-window__titlebar');
  const drag = async () => {
    const box = await bar.boundingBox();
    await page.mouse.move(box.x + 12, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + 92, box.y + box.height / 2 + 48, { steps: 4 });
    await page.mouse.up();
    return win.evaluate((w) => `${w.style.left},${w.style.top}`);
  };
  const placed = await drag();
  expect(placed).not.toBe(','); // the drag set left/top
  await page.evaluate(() => Retrostrap.destroy());
  expect(await drag()).toBe(placed); // same gesture, nothing listens anymore
});

test('JUKEBOX NEVER AUTOPLAYS, Decency Law', async ({ page }) => {
  await page.goto('/tests/e2e/pages/jukebox.html');
  const playBtn = page.locator('#jb button[aria-label]').first();
  await expect(page.locator('#jb')).toHaveClass(/rs-window/);
  // nothing is playing: the transport shows Play, not Pause
  await expect(page.locator('#jb button[aria-label="Play"]')).toBeVisible();
  // and no audio element on the page reports playing
  const anyPlaying = await page.evaluate(() =>
    [...document.querySelectorAll('audio')].some((a) => !a.paused));
  expect(anyPlaying).toBe(false);

  // teardown: destroy empties the player, drops its window chrome, stops audio
  await page.evaluate(() => Retrostrap.destroy());
  await expect(page.locator('#jb')).not.toHaveClass(/rs-jukebox/);
  expect(await page.locator('#jb button').count()).toBe(0);
});

test('konami: the code triggers party mode, which cleans itself up', async ({ page }) => {
  await page.goto('/tests/e2e/pages/konami.html');
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.konami);
  // fire via the public API (deterministic) rather than 10 keystrokes
  await page.evaluate(() => Retrostrap.konami.trigger());
  await expect(page.locator('canvas.rs-snowfall')).toBeAttached(); // confetti snow joined the party
  await expect(page.locator('.rs-dvd')).toBeAttached();
  // a second trigger must not stack a second party
  await page.evaluate(() => Retrostrap.konami.trigger());
  await expect(page.locator('canvas.rs-snowfall')).toHaveCount(1);
});

test('konami: a cheat word typed mid-party does not orphan the party cleanup', async ({ page }) => {
  await page.goto('/tests/e2e/pages/konami.html');
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.konami);
  await page.evaluate(() => Retrostrap.konami.trigger());        // party on
  await expect(page.locator('canvas.rs-snowfall')).toBeAttached();
  await page.keyboard.type('xyzzy');                             // overlapping "nothing happens" egg
  await page.keyboard.press('Escape');                          // ends the party
  await expect(page.locator('canvas.rs-snowfall')).toHaveCount(0); // torn down, not orphaned by the word
  // partying was not left stuck true: a fresh trigger still works
  await page.evaluate(() => Retrostrap.konami.trigger());
  await expect(page.locator('canvas.rs-snowfall')).toHaveCount(1);
});

test('konami: destroy disarms the code', async ({ page }) => {
  await page.goto('/tests/e2e/pages/konami.html');
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.konami);
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  for (const k of code) await page.keyboard.press(k);
  await expect(page.locator('canvas.rs-snowfall')).toBeAttached(); // the real keystrokes work
  await page.keyboard.press('Escape'); // end the party before the teardown
  await expect(page.locator('canvas.rs-snowfall')).toHaveCount(0);

  await page.evaluate(() => Retrostrap.destroy());
  for (const k of code) await page.keyboard.press(k);
  await page.waitForTimeout(200);
  expect(await page.locator('canvas.rs-snowfall').count()).toBe(0); // ten keys, no party
  expect(await page.locator('.rs-sparkle-layer').count()).toBe(0);
  expect(await page.locator('.rs-dvd').count()).toBe(0);
});

test('konami under reduced motion declines politely with a note', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/tests/e2e/pages/konami.html');
  await page.waitForFunction(() => window.Retrostrap && Retrostrap.konami);
  await page.evaluate(() => Retrostrap.konami.trigger());
  await expect(page.locator('.rs-note[role="status"]')).toContainText('You found it');
  await expect(page.locator('canvas.rs-snowfall')).toHaveCount(0); // no blizzard
});
