import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('rapid return to the original finish and immediate Add use the latest choice', async ({ page }) => {
  await page.goto('/products/arc?finish=pearl');
  await page.evaluate(() => {
    document.querySelector<HTMLInputElement>('input[value=fig]')!.click();
    document.querySelector<HTMLInputElement>('input[value=pearl]')!.click();
    document.querySelector<HTMLButtonElement>('.purchase-block .button')!.click();
  });
  await expect(page.getByRole('radio', { name: 'Pearl', exact: true })).toBeChecked();
  await expect(page.locator('.add-confirmation')).toContainText('Arc in Pearl added.');
  await page.evaluate(() => {
    document.querySelector<HTMLInputElement>('input[value=graphite]')!.click();
    document.querySelector<HTMLButtonElement>('.purchase-block .button')!.click();
  });
  await expect(page.locator('.add-confirmation')).toContainText('Arc in Graphite added.');
  await page.locator('.add-confirmation .text-button').click();
  await expect(page.locator('.cart-line')).toHaveCount(2);
  await expect(page.locator('.cart-lines')).toContainText('Pearl');
  await expect(page.locator('.cart-lines')).toContainText('Graphite');
  await expect(page.locator('.subtotal')).toContainText('$498');
});

test('unavailable product imagery does not block finish selection or adding', async ({ page }) => {
  await page.route('**/images/arc-fig-*.webp', route => route.abort());
  await page.goto('/products/arc?finish=fig');
  await expect(page.locator('.image-status')).toContainText('Fig preview unavailable');
  await page.locator('.purchase-block .button').click();
  await page.locator('.add-confirmation .text-button').click();
  await expect(page.locator('.cart-lines')).toContainText('Fig');
  await expect(page.locator('.subtotal')).toContainText('$249');
});

test('home empty-bag navigation focuses Arc; direct bag locks and unlocks scrolling', async ({ page }) => {
  await page.goto('/?cart=open');
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).toBe('hidden');
  await page.getByRole('button', { name: 'Explore Arc' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Arc', exact: true })).toBeFocused();
  expect(await page.evaluate(() => getComputedStyle(document.body).overflow)).not.toBe('hidden');
  await page.goBack();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
});

test('browser path history restores normal scrolling and route focus', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => window.scrollTo(0, 120));
  const initialScroll = await page.evaluate(() => window.scrollY);
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await expect(page.getByRole('heading', { name: 'Arc', exact: true })).toBeFocused();
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await page.goBack();
  await expect(page.getByRole('heading', { name: /Make room/ })).toBeFocused();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(initialScroll);
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Arc', exact: true })).toBeFocused();
});

test('narrow, tablet, and enlarged text layouts keep shopping controls reachable', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One responsive matrix is sufficient.');
  mkdirSync('docs/screenshots', { recursive: true });
  for (const width of [320, 640, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/products/arc?finish=graphite');
    await expect(page.getByRole('radio', { name: 'Graphite', exact: true })).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width !== 1440) {
      await page.evaluate(() => document.fonts.ready);
      await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.product-gallery img')).every(image => image.complete && image.naturalWidth > 0));
      await page.waitForTimeout(200);
      await page.screenshot({ path: `docs/screenshots/responsive-${width}.png`, fullPage: true });
    }
    await page.locator('.purchase-block .button').click();
    await page.locator('.add-confirmation .text-button').click();
    await expect(page.getByRole('button', { name: 'Close bag' })).toBeInViewport();
    await expect(page.locator('.subtotal')).toBeInViewport();
    expect(await page.evaluate(() => document.querySelector('dialog')!.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Close bag' }).click();
  }
  for (const width of [390, 640]) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/');
  await page.addStyleTag({ content: ':root { font-size: 200%; }' });
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>('.product-gallery img')).every(image => image.complete && image.naturalWidth > 0));
  await page.waitForTimeout(550);
  await page.screenshot({ path: `docs/screenshots/text-200-percent${width === 390 ? '-phone' : ''}.png`, fullPage: true });
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await page.locator('.purchase-block .button').click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator('.add-confirmation .text-button').click();
  await expect(page.getByRole('button', { name: 'Close bag' })).toBeInViewport();
  expect(await page.evaluate(() => document.querySelector('dialog')!.scrollWidth <= innerWidth)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('.add-confirmation .text-button')).toBeFocused();
  }
});
