import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const key = 'sona.cart.v1';
test('complete shopping journey, quantities, removal, and reload restoration', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.getByRole('radio', { name: 'Graphite', exact: true }).check();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await page.locator('.purchase-block .button').click();
  await page.locator('.purchase-block .button').click();
  await page.getByRole('radio', { name: 'Pearl', exact: true }).check();
  await page.locator('.purchase-block .button').click();
  await page.locator('.add-confirmation .text-button').click();
  const bag = page.getByRole('dialog', { name: 'Your bag' });
  await expect(bag).toBeVisible();
  await expect(bag.locator('.cart-line')).toHaveCount(2);
  await expect(bag.locator('.subtotal')).toContainText('$747');
  await page.getByRole('button', { name: 'Increase Arc Fig quantity', exact: true }).click();
  await expect(bag.locator('.subtotal')).toContainText('$996');
  await page.getByRole('button', { name: 'Decrease Arc Fig quantity', exact: true }).click();
  await page.getByRole('button', { name: 'Remove Arc in Pearl', exact: true }).click();
  await expect(bag.locator('.subtotal')).toContainText('$498');
  await page.reload();
  await expect(bag).toBeVisible();
  await expect(bag.locator('.cart-line')).toHaveCount(1);
  await expect(bag.locator('.quantity-stepper')).toContainText('2');
  await expect(bag.locator('.subtotal')).toContainText('$498');
  await page.getByRole('button', { name: 'Remove Arc in Fig', exact: true }).click();
  await expect(bag.getByText('Your bag is empty.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(bag.getByText('Your bag is empty.', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close bag' }).click();
  await expect(bag).not.toBeVisible();
  await expect(page).toHaveURL(/\/products\/arc\?finish=pearl$/);
});

test('history restores finishes and cart; direct cart entry closes safely', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.getByRole('radio', { name: 'Graphite', exact: true }).check();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await page.goBack();
  await expect(page.getByRole('radio', { name: 'Graphite', exact: true })).toBeChecked();
  await page.goForward();
  await expect(page.getByRole('radio', { name: 'Fig', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Open bag, 0 items' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await page.goForward();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Close bag' }).click();
  await expect(page.getByRole('radio', { name: 'Fig', exact: true })).toBeChecked();
  await page.goto('/products/arc?finish=graphite&cart=open');
  await page.getByRole('button', { name: 'Close bag' }).click();
  await expect(page).toHaveURL(/\/products\/arc\?finish=graphite$/);
  await expect(page.getByRole('radio', { name: 'Graphite', exact: true })).toBeChecked();
});

test('keyboard journey traps modal focus and returns to the opener', async ({ page }) => {
  await page.goto('/');
  const discover = page.getByRole('link', { name: 'Discover Arc' });
  await discover.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Arc', exact: true })).toBeFocused();
  await page.getByRole('radio', { name: 'Pearl', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Fig', exact: true })).toBeChecked();
  await page.locator('.purchase-block .button').focus();
  await page.keyboard.press('Enter');
  const opener = page.locator('.add-confirmation .text-button');
  await opener.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Close bag' })).toBeFocused();
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press(i < 6 ? 'Tab' : 'Shift+Tab');
    expect(await page.evaluate(() => document.querySelector('dialog')?.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

for (const boundary of ['getter', 'read', 'write'] as const) {
  test(`storage ${boundary} failure keeps the cart usable`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(boundary => {
      if (boundary === 'getter') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } });
      else Object.defineProperty(Storage.prototype, boundary === 'read' ? 'getItem' : 'setItem', { value() { throw new DOMException('Blocked', 'SecurityError'); } });
    }, boundary);
    await page.goto('/products/arc?finish=fig');
    await page.locator('.purchase-block .button').click();
    await page.locator('.add-confirmation .text-button').click();
    await expect(page.getByRole('dialog').locator('.storage-notice')).toContainText('Your bag works for this visit');
    await expect(page.locator('.subtotal')).toContainText('$249');
    await page.getByRole('button', { name: 'Increase Arc Fig quantity' }).click();
    await expect(page.locator('.subtotal')).toContainText('$498');
    expect(errors).toEqual([]);
  });
}

test('invalid storage and unknown finish recover without false prices', async ({ page }) => {
  await page.addInitScript(key => localStorage.setItem(key, JSON.stringify({ version: 1, lines: [{ productId: 'arc', finish: 'fig', quantity: 2, price: 1 }, { productId: 'arc', finish: 'wrong', quantity: 3 }] })), key);
  await page.goto('/products/arc?finish=invalid&cart=open');
  await expect(page.getByRole('dialog').locator('.storage-notice')).toContainText('couldn’t be restored');
  await expect(page.locator('.subtotal')).toContainText('$498');
  await expect(page.locator('.cart-line')).toHaveCount(1);
  await page.getByRole('button', { name: 'Close bag' }).click();
  await expect(page.getByRole('radio', { name: 'Pearl', exact: true })).toBeChecked();
});

test('reduced motion preserves the complete path and live preference changes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await page.locator('.purchase-block .button').click();
  await page.locator('.add-confirmation .text-button').click();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
  await expect(page.locator('.subtotal')).toContainText('$249');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Close bag' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('radio', { name: 'Graphite', exact: true }).check();
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});

test('actual screenshots, assets, and automated accessibility review', async ({ page }, testInfo) => {
  mkdirSync('docs/publication/screenshots', { recursive: true });
  const capture = async (name: string) => {
    await page.evaluate(() => document.fonts.ready);
    await page.locator('.product-gallery .finish-image[data-active=true] img').waitFor({ state: 'attached' });
    await page.waitForTimeout(550);
    await page.screenshot({ path: `docs/publication/screenshots/${testInfo.project.name}-${name}.png`, fullPage: !await page.getByRole('dialog').isVisible() });
  };
  await page.goto('/');
  await capture('home');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await capture('arc-fig');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.locator('.purchase-block .button').click();
  await page.locator('.add-confirmation .text-button').click();
  await capture('cart');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  await page.getByRole('button', { name: 'Remove Arc in Fig' }).click();
  await capture('empty-cart');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
