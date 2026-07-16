// The framework must pass its own law-checker. If the kitchen sink, which
// exercises every component, trips audit(), we shipped a violation.
import { test, expect } from '@playwright/test';

test('the kitchen sink passes Retrostrap.audit()', async ({ page }) => {
  await page.goto('/tests/e2e/pages/kitchen-sink.html');
  await page.waitForFunction(() => window.Retrostrap);
  const report = await page.evaluate(() => Retrostrap.audit());
  // surface the specifics when it fails, so the diff is readable
  expect(report.violations, JSON.stringify(report.violations, null, 2)).toEqual([]);
  expect(report.ok).toBe(true);
  expect(report.stats.checked).toBeGreaterThan(50);
});

test('audit catches a planted violation', async ({ page }) => {
  await page.goto('/tests/e2e/pages/kitchen-sink.html');
  await page.waitForFunction(() => window.Retrostrap);
  const found = await page.evaluate(() => {
    const bad = document.createElement('div');
    bad.className = 'rs-panel';
    bad.style.borderRadius = '8px';       // Shape Law violation
    bad.style.color = '#FA8072';          // Palette Law violation (salmon)
    document.body.appendChild(bad);
    const rules = Retrostrap.audit().violations.map((v) => v.rule);
    bad.remove();
    return rules;
  });
  expect(found).toContain('radius');
  expect(found).toContain('palette');
});
