// Accessibility is a core promise, so it gets a core gate (docs/08). axe-core
// runs over the kitchen sink and every demo; any violation fails the build. The
// rules that matter most for us are called out in docs/08, we run the full
// WCAG 2.1 A/AA set and let it find anything.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PAGES = [
  '/tests/e2e/pages/kitchen-sink.html',
  '/demos/homepage-classic/index.html',
  '/demos/homepage-classic/guestbook.html',
  '/demos/smallbiz/index.html',
  '/demos/app-todo/index.html',
  '/demos/dashboard/index.html',
  '/demos/button-maker/index.html',
  '/demos/ascii-maker/index.html',
  '/demos/userbar-maker/index.html',
  '/demos/patterns/index.html',
  '/demos/builder/index.html',
  '/demos/portal/index.html',
  '/demos/band/index.html',
  '/demos/store/index.html',
  '/demos/webcomic/index.html',
  '/demos/tutorial/index.html',
  '/demos/clan/index.html',
  '/demos/fanfic/index.html',
  '/demos/adoptables/index.html',
  '/demos/radio/index.html',
  '/demos/webcam/index.html',
  '/demos/recipes/index.html',
  '/demos/ezine/index.html',
  '/demos/corporate/index.html',
  '/demos/awards/index.html',
  '/demos/freelancer/index.html',
  '/demos/notfound/index.html',
  '/demos/notfound/guestbook.html',
  '/demos/retrospace/index.html',
  '/demos/fanpage/index.html',
  '/demos/whats-new/index.html',
  '/demos/desktop/index.html',
  '/demos/gazette/index.html',
  '/demos/text-only/index.html',
  '/demos/webring/index.html',
  '/demos/quiz/index.html',
  '/demos/downloads/index.html',
  '/demos/index.html',
];

for (const url of PAGES) {
  test(`axe: ${url}`, async ({ page }) => {
    await page.goto(url);
    await page.waitForFunction(() => window.Retrostrap).catch(() => {});
    // fanpage opens with a splash; enter it so axe sees the real page
    const enter = page.locator('.rs-splash__enter');
    if (await enter.count()) { await enter.click(); await page.waitForTimeout(200); }

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // surface the specifics on failure, id, impact, and where
    const summary = results.violations.map((v) =>
      `${v.id} (${v.impact}), ${v.nodes.length}×: ${v.nodes[0]?.target?.join(' ')}`).join('\n');
    expect(results.violations, summary).toEqual([]);
  });
}
