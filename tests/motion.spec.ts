import { test, expect } from '@playwright/test';

test('the opening reveal waits for the decoded product while navigation stays usable', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/images/arc-pearl-*.webp', async route => { await gate; await route.continue(); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('link', { name: 'Discover Arc' })).toBeVisible();
  await expect(page.locator('.image-status')).toContainText('Loading Pearl');
  // Delay beyond the full reveal duration: loading must not consume it.
  await page.waitForTimeout(650);
  release();
  await page.waitForFunction(() => document.getAnimations().some(animation => animation.id === 'sona-opening' && animation.playState === 'running'));
  await expect(page.locator('[data-finish=pearl]')).toHaveAttribute('data-active', 'true');
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await expect(page.locator('.purchase-block .button')).toBeEnabled();
});

test('a delayed finish keeps a labeled previous view and immediately adds the selected finish', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/images/arc-fig-*.webp', async route => { await gate; await route.continue(); });
  await page.goto('/products/arc?finish=pearl', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-finish=pearl]')).toHaveAttribute('data-active', 'true');
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await expect(page.locator('.image-status')).toContainText('Showing Pearl');
  await expect(page.locator('[data-finish=pearl]')).toHaveAttribute('data-active', 'true');
  await page.locator('.purchase-block .button').click();
  await expect(page.locator('.add-confirmation')).toContainText('Arc in Fig added.');
  release();
  await expect(page.locator('[data-finish=fig]')).toHaveAttribute('data-active', 'true');
  await expect(page.locator('.image-status')).toHaveCount(0);
  await page.locator('.add-confirmation .text-button').click();
  await expect(page.locator('.cart-lines')).toContainText('Fig');
});

test('rapid finish interruptions and cart input stay live during animation', async ({ page }) => {
  await page.goto('/products/arc?finish=pearl');
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('.product-gallery img')].every(image => image.complete && image.naturalWidth));
  await page.evaluate(async () => {
    for (const finish of ['fig', 'graphite', 'pearl', 'graphite', 'fig']) {
      document.querySelector<HTMLInputElement>(`input[value=${finish}]`)!.click();
      await new Promise(requestAnimationFrame);
    }
    document.querySelector<HTMLButtonElement>('.purchase-block .button')!.click();
  });
  await expect(page.getByRole('radio', { name: 'Fig', exact: true })).toBeChecked();
  await expect(page.locator('.add-confirmation')).toContainText('Arc in Fig added.');
  await page.locator('.add-confirmation .text-button').click();
  const changedDuringEntry = await page.evaluate(() => {
    const dialog = document.querySelector('dialog')!;
    const running = dialog.getAnimations().some(animation => animation.playState === 'running');
    dialog.querySelector<HTMLButtonElement>('[aria-label="Increase Arc Fig quantity"]')!.click();
    return running;
  });
  expect(changedDuringEntry).toBe(true);
  await expect(page.locator('.subtotal')).toContainText('$498');
  await page.keyboard.press('Escape');
  await page.locator('.add-confirmation .text-button').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.subtotal')).toContainText('$498');
});

test('changing reduced-motion preferences never replays a completed route transition', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('link', { name: 'Discover Arc' }).click();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  expect(await page.evaluate(() => document.getAnimations().some(animation => animation.id === 'sona-product-entry' && animation.playState === 'running'))).toBe(false);
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await page.evaluate(() => document.getAnimations().filter(animation => animation.playState === 'running').length)).toBe(0);
});

test('dragging out of the desktop cart does not dismiss it; a deliberate backdrop click does', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'Phone cart covers the viewport.');
  await page.goto('/products/arc?cart=open');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.waitForTimeout(300);
  const rect = (await dialog.boundingBox())!;
  await page.mouse.move(rect.x + 60, rect.y + 150);
  await page.mouse.down();
  await page.mouse.move(rect.x - 40, rect.y + 150);
  await page.mouse.up();
  await expect(dialog).toBeVisible();
  await page.mouse.click(rect.x - 40, rect.y + 150);
  await expect(dialog).not.toBeVisible();
});
