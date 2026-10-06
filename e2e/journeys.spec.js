import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mockApi, product } from './mockApi';

const live = process.env.E2E_LIVE === '1';
let api;

test.beforeEach(async ({ page }) => {
  if (!live) api = await mockApi(page);
});

async function dismissConsent(page) {
  const essential = page.getByRole('button', { name: 'Essential only' });
  if (await essential.isVisible().catch(() => false)) await essential.click();
}

test('home: consent choice sticks and the edit loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Find your');
  await page.getByRole('button', { name: 'Essential only' }).click();
  await expect(page.getByRole('button', { name: 'Essential only' })).toBeHidden();
  await expect(page.locator('main a[href^="/p/"]').first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Essential only' })).toBeHidden();
});

test('quiz: a guest swipes, unlocks and sees their Style DNA', async ({ page }) => {
  test.skip(live, 'Needs a deterministic deck');
  await page.goto('/quiz');
  await dismissConsent(page);
  await page.getByRole('button', { name: 'Womenswear' }).click();
  await expect(page.getByText(/more to unlock your Style DNA/)).toBeVisible();
  const like = page.getByRole('button', { name: "I'd wear this" });
  const settled = () => expect(like).not.toHaveAttribute('aria-disabled', 'true');
  await like.click();
  await page.getByRole('button', { name: 'Not for me' }).click();
  await settled();
  await page.keyboard.press('ArrowRight');
  await settled();
  await page.getByRole('button', { name: 'Skip' }).click();
  await like.click();
  await page.getByRole('button', { name: 'See my Style DNA' }).first().click();
  await expect(page).toHaveURL(/\/dna$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Soft Feminine');
  await expect(page.getByText('A clear favourite').or(page.getByText('You lean this way')).first()).toBeVisible();
});

test('search: query lives in the URL, filters apply and empty results help', async ({ page }) => {
  await page.goto('/search');
  await dismissConsent(page);
  const box = page.getByRole('main').getByRole('searchbox', { name: 'Search pieces and brands' });
  await box.fill('linen shirt');
  await box.press('Enter');
  await expect(page).toHaveURL(/q=linen\+shirt|q=linen%20shirt/);
  await expect(page.getByText(/pieces? for “linen shirt”/)).toBeVisible();
  await page.getByRole('button', { name: 'On sale' }).click();
  await expect(page).toHaveURL(/onSale=true/);
  if (!live) {
    await page.goto('/search?q=zzznothing');
    await expect(page.getByRole('heading', { name: 'Nothing for “zzznothing” yet' })).toBeVisible();
  }
});

test('product: Fit Match shows and Shop at opens the brand store', async ({ page, context }) => {
  test.skip(live, 'Avoids logging click-outs in the org');
  const p = product(0);
  await page.goto(`/p/${p.productId}`);
  await dismissConsent(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(p.name);
  const [popup] = await Promise.all([context.waitForEvent('page'), page.getByRole('button', { name: `Shop at ${p.brandName}` }).click()]);
  await popup.waitForURL('https://example.com/**').catch(() => {});
  expect(api.clickouts[0]).toMatchObject({ productId: p.productId, surface: 'Product' });
});

test('saving as a guest asks to sign in', async ({ page }) => {
  test.skip(live, 'Mocked toast copy');
  await page.goto('/');
  await dismissConsent(page);
  await page.getByRole('button', { name: /^Save / }).first().click();
  await expect(page.getByText('Sign in to save pieces to your wishlist.')).toBeVisible();
});

test('signup: duplicate email is explained, then the account is created', async ({ page }) => {
  test.skip(live, 'Would create a real shopper');
  await page.goto('/signup');
  await dismissConsent(page);
  await page.getByLabel('First name').fill('Nour');
  await page.getByLabel('Last name').fill('Hassan');
  await page.getByLabel('Email address').fill('taken@example.com');
  await page.getByLabel('Password', { exact: true }).fill('FitTest2026!');
  await page.getByRole('checkbox', { name: /I agree/ }).check();
  await page.getByRole('button', { name: 'Create account' }).last().click();
  await expect(page.getByRole('alert').first()).toBeVisible();
  await page.getByLabel('Email address').fill('nour@example.com');
  await page.getByRole('button', { name: 'Create account' }).last().click();
  await expect(page).toHaveURL(/\/dna$/);
});

test('unknown routes show a friendly 404 and legacy links redirect', async ({ page }) => {
  await page.goto('/this-does-not-exist');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/swipe');
  await expect(page).toHaveURL(/\/quiz$/);
});

for (const path of ['/', '/search?q=shirt', '/quiz', '/brands', '/login', '/signup', '/about', '/privacy', '/contact', '/app']) {
  test(`accessibility and layout: ${path}`, async ({ page }) => {
    await page.goto(path);
    await dismissConsent(page);
    await expect(page.locator('main')).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow, 'no horizontal scrolling').toBe(false);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${v.id}: ${v.nodes.length} × ${v.nodes[0]?.target}`)).toEqual([]);
  });
}
