import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync } from 'node:fs';

const bag = (page: Page) => page.getByRole('dialog', { name: 'Your bag' });
const productNavigation = (page: Page) => page.getByRole('navigation', { name: 'Products', exact: true });
const add = (page: Page) => page.locator('.purchase-block .button');
const comparison = (page: Page) => page.getByRole('region', { name: 'Product comparison table, horizontally scrollable' });

test('collection hash history restores scroll while the bag preserves its opener and anchor', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const collection = page.locator('#collection');
  const navigation = page.getByRole('navigation', { name: 'Main navigation' });
  const collectionLink = navigation.getByRole('link', { name: 'Collection', exact: true });
  const bagButton = navigation.getByRole('button', { name: /Open bag/ });
  await collectionLink.click();
  await expect(collection).toBeFocused();
  await expect(page).toHaveURL(/\/#collection$/);
  const anchorTop = await page.evaluate(() => scrollY);
  expect(anchorTop).toBeGreaterThan(0);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.goForward();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(anchorTop);

  // A focused header control can be activated without scrolling the page.
  await bagButton.evaluate(element => (element as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await expect(bag(page)).toBeVisible();
  await expect(page).toHaveURL(/\/\?cart=open#collection$/);
  await page.getByRole('button', { name: 'Close bag', exact: true }).click();
  await expect(bag(page)).not.toBeVisible();
  await expect(page).toHaveURL(/\/#collection$/);
  await expect(bagButton).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(anchorTop);

  // Revisit a collection URL at a later scroll position, not its anchor top.
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  const visitedTop = await page.evaluate(() => scrollY);
  expect(visitedTop).toBeGreaterThan(anchorTop);
  await navigation.getByRole('link', { name: 'Compare', exact: true }).evaluate(element => (element as HTMLElement).click());
  await expect(page).toHaveURL(/\/compare$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/#collection$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(visitedTop);

  // Direct hash entry still targets the collection; a reloaded modal retains it.
  await page.goto('/#collection');
  await expect(collection).toBeFocused();
  await bagButton.evaluate(element => (element as HTMLElement).focus({ preventScroll: true }));
  await page.keyboard.press('Enter');
  await page.reload();
  await expect(bag(page)).toBeVisible();
  await page.getByRole('button', { name: 'Close bag', exact: true }).click();
  await expect(page).toHaveURL(/\/#collection$/);
  await expect(bag(page)).not.toBeVisible();
});

test('the three-product journey keeps identical finishes distinct and restores mixed quantities', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Collection', exact: true }).click();
  await expect(page.locator('#collection')).toBeFocused();
  await expect(page.getByRole('navigation', { name: 'Explore the collection' }).getByRole('link')).toHaveCount(3);
  await page.getByRole('link', { name: 'Discover Dot' }).click();
  await expect(page.getByRole('heading', { name: 'Dot', exact: true, level: 1 })).toBeFocused();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await add(page).click();
  await add(page).click();
  await productNavigation(page).getByRole('link', { name: 'Arc', exact: true }).click();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await add(page).click();
  await productNavigation(page).getByRole('link', { name: 'Room', exact: true }).click();
  await page.getByRole('radio', { name: 'Fig', exact: true }).check();
  await add(page).click();
  await page.getByRole('radio', { name: 'Pearl', exact: true }).check();
  await add(page).click();
  await page.locator('.add-confirmation .text-button').click();
  await expect(bag(page).locator('.cart-line')).toHaveCount(4);
  await expect(bag(page).locator('[data-variant="dot:fig"] [aria-label="Quantity 2"]')).toBeVisible();
  for (const key of ['arc:fig', 'room:fig', 'room:pearl']) await expect(bag(page).locator(`[data-variant="${key}"] [aria-label="Quantity 1"]`)).toBeVisible();
  await expect(bag(page).locator('.subtotal')).toContainText('$1,245');
  await page.getByRole('button', { name: 'Increase Dot Fig quantity', exact: true }).click();
  await expect(bag(page).locator('.subtotal')).toContainText('$1,394');
  await page.getByRole('button', { name: 'Decrease Dot Fig quantity', exact: true }).click();
  await page.reload();
  await expect(bag(page)).toBeVisible();
  await expect(bag(page).locator('.cart-line')).toHaveCount(4);
  await expect(bag(page).locator('.subtotal')).toContainText('$1,245');
  await page.getByRole('button', { name: 'Remove Room in Fig', exact: true }).click();
  await expect(bag(page).locator('.subtotal')).toContainText('$896');
  await expect(bag(page).locator('[data-variant="room:pearl"]')).toBeVisible();
  for (const name of ['Dot in Fig', 'Arc in Fig', 'Room in Pearl']) await page.getByRole('button', { name: `Remove ${name}`, exact: true }).click();
  await expect(bag(page).getByText('Your bag is empty.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(bag(page).getByText('Your bag is empty.', { exact: true })).toBeVisible();
});

test('product navigation and finish history restore the selected object; unknown products recover', async ({ page }) => {
  await page.goto('/products/dot?finish=fig');
  await expect(page).toHaveTitle('Dot in Fig — Sona');
  await productNavigation(page).getByRole('link', { name: 'Room', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Room', exact: true, level: 1 })).toBeFocused();
  await page.getByRole('radio', { name: 'Graphite', exact: true }).check();
  await page.goBack();
  await expect(page).toHaveTitle('Room in Pearl — Sona');
  await expect(page.getByRole('radio', { name: 'Pearl', exact: true })).toBeChecked();
  await page.goBack();
  await expect(page).toHaveTitle('Dot in Fig — Sona');
  await expect(page.getByRole('radio', { name: 'Fig', exact: true })).toBeChecked();
  await page.goForward();
  await expect(page).toHaveTitle('Room in Pearl — Sona');
  await page.goto('/products/unknown?finish=fig');
  await expect(page.getByRole('heading', { name: 'A little off track.', level: 1 })).toBeVisible();
  await expect(page.locator('.purchase-block')).toHaveCount(0);
  await page.getByRole('link', { name: 'Explore the collection' }).click();
  await expect(page.locator('#collection')).toBeFocused();
  await page.getByRole('link', { name: 'Discover Room' }).click();
  await expect(page.getByRole('heading', { name: 'Room', exact: true, level: 1 })).toBeFocused();
});

test('comparison uses native keyboard selection, honest attributes, and URL history from zero to three', async ({ page }) => {
  await page.goto('/compare');
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(3);
  const table = comparison(page).getByRole('table');
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Concept price', exact: true }) }).getByRole('cell')).toHaveText(['$249', '$149', '$349']);
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Form', exact: true }) }).getByRole('cell')).toHaveText(['Over-ear, with a padded headband', 'In-ear pair with a charging case', 'Sculptural speaker with a woven face']);
  await expect(table.getByRole('row').filter({ has: page.getByRole('rowheader', { name: 'Finishes', exact: true }) }).getByRole('cell')).toHaveText(['Pearl, Graphite, Fig', 'Pearl, Graphite, Fig', 'Pearl, Graphite, Fig']);
  for (const [index, name] of ['Room', 'Dot', 'Arc'].entries()) {
    await page.getByRole('checkbox', { name, exact: true }).focus();
    await page.keyboard.press('Space');
    await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(2 - index);
  }
  await expect(comparison(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'A little room to compare.' })).toBeVisible();
  await page.getByRole('checkbox', { name: 'Dot', exact: true }).focus();
  await page.keyboard.press('Space');
  await expect(comparison(page).getByRole('heading')).toHaveText(['Dot']);
  await expect(page).toHaveURL(/\/compare\?items=dot$/);
  await page.reload();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(1);
  await page.goBack();
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await page.goForward();
  await expect(page.getByRole('checkbox', { name: 'Dot', exact: true })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Arc', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Room', exact: true }).check();
  await expect(comparison(page).getByRole('heading')).toHaveText(['Arc', 'Dot', 'Room']);
});

test('comparison filters invalid and duplicate IDs and handles rapid toggles without stale selections', async ({ page }) => {
  await page.goto('/compare?items=dot,dot,unknown,arc,room,room');
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(3);
  await expect(comparison(page).getByRole('heading')).toHaveText(['Dot', 'Arc', 'Room']);
  await page.evaluate(() => {
    for (const input of document.querySelectorAll<HTMLInputElement>('.comparison-picker input')) input.click();
  });
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await expect(comparison(page)).toHaveCount(0);
  await page.goto('/compare?items=%5B%22arc%22%5D,null,constructor,__proto__');
  await expect(page.getByRole('checkbox', { checked: true })).toHaveCount(0);
  await expect(page.locator('.comparison-status')).toContainText('Choose a product');
  await page.getByRole('checkbox', { name: 'Room', exact: true }).check();
  await expect(comparison(page).getByRole('heading')).toHaveText(['Room']);
});

test('a delayed new product never shows the previous product and still adds the selected variant', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.goto('/products/arc?finish=fig');
  await expect(page.locator('.finish-image[data-active=true] img')).toHaveAttribute('alt', 'Sona Arc in Fig, in a plum studio');
  await page.route('**/images/dot-*.webp', async route => { await gate; await route.continue(); });
  try {
    await productNavigation(page).getByRole('link', { name: 'Dot', exact: true }).click();
    await expect(page.locator('.product-gallery figcaption')).toContainText('Dot / Pearl');
    await expect(page.locator('.finish-image[data-active=true]')).toHaveCount(0);
    await expect(page.locator('.product-gallery img[src*="arc-"]')).toHaveCount(0);
    await page.getByRole('radio', { name: 'Fig', exact: true }).check();
    await expect(page.locator('.image-status')).toContainText('Loading Fig');
    await add(page).click();
    await expect(page.locator('.add-confirmation')).toContainText('Dot in Fig added.');
  } finally { release(); }
  await expect(page.locator('.finish-image[data-active=true] img')).toHaveAttribute('alt', 'Sona Dot in Fig, in a plum studio');
  await page.locator('.add-confirmation .text-button').click();
  await expect(bag(page).locator('[data-variant="dot:fig"]')).toBeVisible();
  await expect(bag(page).locator('.subtotal')).toContainText('$149');
});

test('a failed Room image leaves the correct product and price available to shop', async ({ page }) => {
  await page.route('**/images/room-graphite-*.webp', route => route.abort());
  await page.goto('/products/room?finish=graphite');
  await expect(page.locator('.image-status')).toContainText('Graphite preview unavailable');
  await expect(add(page)).toBeEnabled();
  await add(page).click();
  await expect(page.locator('.add-confirmation')).toContainText('Room in Graphite added.');
  await page.locator('.add-confirmation .text-button').click();
  await expect(bag(page).locator('[data-variant="room:graphite"]')).toBeVisible();
  await expect(bag(page).locator('.subtotal')).toContainText('$349');
});

test('new product and comparison states have actual screenshots and no automated accessibility violations', async ({ page }, testInfo) => {
  mkdirSync('docs/publication/screenshots', { recursive: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const id of ['dot', 'room']) {
    await page.goto(`/products/${id}?finish=fig`);
    await expect(page.locator('.finish-image[data-active=true] img')).toHaveAttribute('src', `/images/${id}-fig-1100.webp`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `docs/publication/screenshots/${testInfo.project.name}-${id}-fig.png`, fullPage: true });
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  }
  await page.goto('/compare');
  await comparison(page).scrollIntoViewIfNeeded();
  await comparison(page).evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await page.waitForFunction(() => [...document.querySelectorAll<HTMLImageElement>('.comparison-table img')].every(image => image.complete && image.naturalWidth > 0));
  await comparison(page).evaluate(element => { element.scrollLeft = 0; });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `docs/publication/screenshots/${testInfo.project.name}-comparison.png`, fullPage: true });
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('narrow and tablet layouts contain the collection and expose a keyboard-scrollable comparison', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'One responsive matrix is sufficient; other journeys also run in phone emulation.');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/', '/products/room?finish=fig', '/compare']) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${path} at ${width}px`).toBe(true);
    }
    const region = comparison(page);
    expect(await region.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
    await region.focus();
    await expect(region).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => region.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});
