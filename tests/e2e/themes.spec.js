// Theme smoke tests. The subtle failure mode here is a tiled background whose
// url() resolves to the wrong place and 404s (custom-property url resolution
// is relative to the using stylesheet, not the defining one). So we watch the
// network, not just the pixels.
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/kitchen-sink.html';
const THEMES = ['midnight', 'bevel', 'phosphor', 'highcontrast', 'cosmic', 'newspaper', 'bubble'];

for (const theme of THEMES) {
  test(`${theme}: applies, loads every asset, and passes audit`, async ({ page }) => {
    const failures = [];
    page.on('response', (r) => {
      if (r.status() >= 400) failures.push(`${r.url()} -> ${r.status()}`);
    });

    await page.goto(PAGE);
    await page.waitForFunction(() => window.Retrostrap);
    // apply the theme the way the docs say to
    await page.evaluate((t) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = `/dist/themes/${t}.css`;
      document.head.appendChild(link);
      Retrostrap.theme.set(t);
    }, theme);
    await page.waitForLoadState('networkidle');

    expect(failures, failures.join('\n')).toEqual([]);
    expect(await page.evaluate(() => Retrostrap.theme.get())).toBe(theme);
    const report = await page.evaluate(() => Retrostrap.audit());
    expect(report.violations, JSON.stringify(report.violations, null, 2)).toEqual([]);
  });
}
