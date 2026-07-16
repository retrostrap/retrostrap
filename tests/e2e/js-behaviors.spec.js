// Behavior specs for the component enhancers. These assert the keyboard maps
// and focus contracts from docs/08, the part that's acceptance criteria, not
// polish.
import { test, expect } from '@playwright/test';

const PAGE = '/tests/e2e/pages/js-behaviors.html';

test('boot runs clean and fires rs:ready', async ({ page }) => {
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => document.addEventListener('rs:ready', () => (window.__ready = true)));
  await page.goto(PAGE);
  await page.waitForFunction(() => window.Retrostrap && window.__ready);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => Retrostrap.version)).toBeTruthy();
  // guard against the tree-shaking footgun: every enhancer must be in the bundle
  const registered = await page.evaluate(() => Retrostrap.enhancers().sort());
  expect(registered).toEqual(['dialog', 'marquee', 'menu', 'splash', 'spoiler', 'statusbar', 'tabs', 'window']);
});

test('menu: ArrowDown opens the submenu and lands on the first item', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('#menu-file').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#menu-file')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#menu-new')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#menu-open')).toBeFocused();
  await page.keyboard.press('End');
  await expect(page.locator('#menu-save')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#menu-file')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('#menu-file')).toBeFocused();
});

test('menu: clicking outside closes an open submenu', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('#menu-file').click();
  await expect(page.locator('#menu-file')).toHaveAttribute('aria-expanded', 'true');
  await page.locator('h1').first().click();
  await expect(page.locator('#menu-file')).toHaveAttribute('aria-expanded', 'false');
});

test('tabs: arrows select with automatic activation, wrapping', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.locator('#panel-1')).toBeVisible();
  await expect(page.locator('#panel-2')).toBeHidden();
  await page.locator('#tab-1').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#tab-2')).toBeFocused();
  await expect(page.locator('#tab-2')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#panel-2')).toBeVisible();
  await expect(page.locator('#panel-1')).toBeHidden();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#panel-1')).toBeVisible();
  await page.keyboard.press('ArrowLeft'); // wraps to the last
  await expect(page.locator('#tab-3')).toBeFocused();
});

test('tabs: roles and roving tabindex are wired', async ({ page }) => {
  await page.goto(PAGE);
  // the tablist role sits on an inner wrapper so it owns only the tabs, not the
  // panels that follow inside .rs-tabs (aria-required-children)
  await expect(page.locator('#tabs')).not.toHaveAttribute('role', 'tablist');
  await expect(page.locator('#tabs .rs-tabs__list')).toHaveAttribute('role', 'tablist');
  await expect(page.locator('#tab-1')).toHaveAttribute('role', 'tab');
  await expect(page.locator('#panel-1')).toHaveAttribute('role', 'tabpanel');
  expect(await page.locator('#tab-1').getAttribute('tabindex')).toBe('0');
  expect(await page.locator('#tab-2').getAttribute('tabindex')).toBe('-1');
});

test('spoiler: hidden until opened, and it announces the toggle', async ({ page }) => {
  await page.goto(PAGE);
  await page.evaluate(() => {
    window.__toggles = [];
    document.addEventListener('rs:spoiler:toggle', (e) => window.__toggles.push(e.detail.revealed));
  });
  await expect(page.locator('#spoiler-body')).toBeHidden();
  await page.locator('#spoiler summary').click();
  await expect(page.locator('#spoiler-body')).toBeVisible();
  // the <details> toggle event is dispatched asynchronously, wait for it
  await page.waitForFunction(() => window.__toggles.length === 1);
  expect(await page.evaluate(() => window.__toggles)).toEqual([true]);
});

test('marquee: a pause control exists and toggles the paused state', async ({ page }) => {
  await page.goto(PAGE);
  const pause = page.locator('#marquee .rs-marquee__pause');
  await expect(pause).toHaveCount(1);
  await pause.dispatchEvent('click');
  await expect(page.locator('#marquee')).toHaveAttribute('data-rs-paused', '');
});

test('window: minimize hides the body, close hides the window', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('#window .rs-window__controls button[aria-label="Minimize"]').click();
  await expect(page.locator('#window-body')).toBeHidden();
  await expect(page.locator('#window')).toHaveAttribute('data-rs-minimized', '');
  await page.locator('#window .rs-window__controls button[aria-label="Close"]').click();
  await expect(page.locator('#window')).toBeHidden();
});

test('dialog: confirm resolves and returns focus to the opener', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('#ask').click();
  const dialog = page.locator('dialog.rs-dialog');
  await expect(dialog).toBeVisible();
  await dialog.locator('button[value="ok"]').click();
  await expect(page.locator('#answer')).toHaveText('deleted');
  await expect(page.locator('#ask')).toBeFocused(); // focus came home
});

test('splash: reveals, and Enter dismisses it', async ({ page }) => {
  await page.goto('/tests/e2e/pages/js-splash.html');
  const splash = page.locator('#splash');
  await expect(splash).toBeVisible(); // the enhancer removed [hidden]
  await expect(page.locator('#splash-enter')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(splash).toBeHidden();
});

test('announce: one polite live region, debounced and coalesced', async ({ page }) => {
  await page.goto(PAGE);
  await page.waitForFunction(() => window.Retrostrap);
  expect(await page.locator('#rs-live').count()).toBe(0); // nothing announced yet
  await page.evaluate(() => Retrostrap.announce('first message'));
  const live = page.locator('#rs-live');
  await expect(live).toHaveAttribute('aria-live', 'polite');
  await expect(live).toHaveText('first message');
  await page.evaluate(() => { Retrostrap.announce('a'); Retrostrap.announce('b'); Retrostrap.announce('c'); });
  await expect(live).toHaveText('c'); // the burst collapses to the latest
});
