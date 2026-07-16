// Visual regression (roadmap P3-11). Golden screenshots of the reference pages,
// committed to the repo. A refactor that shifts a pixel it shouldn't turns the
// diff red. The Palette Law means flat, web-safe colors that compress well and
// diff cleanly; a small tolerance absorbs sub-pixel font hinting.
import { test, expect } from '@playwright/test';

const OPTS = { maxDiffPixelRatio: 0.02, animations: 'disabled' };

test.use({ viewport: { width: 1000, height: 800 } });

test('kitchen sink, classic', async ({ page }) => {
  await page.goto('/tests/e2e/pages/kitchen-sink.html');
  await page.waitForFunction(() => window.Retrostrap);
  await expect(page).toHaveScreenshot('kitchen-sink-classic.png', { ...OPTS, fullPage: true });
});

for (const demo of ['homepage-classic', 'smallbiz', 'app-todo']) {
  test(`demo, ${demo}`, async ({ page }) => {
    await page.goto(`/demos/${demo}/index.html`);
    await page.waitForFunction(() => window.Retrostrap);
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot(`demo-${demo}.png`, OPTS);
  });
}
