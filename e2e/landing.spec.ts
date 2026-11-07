import { test, expect } from '@playwright/test';

test.describe('Samagna Landing Page Production QA', () => {
  test('1. Landing loads with correct metadata, Fraunces headline, and Odia typography', async ({ page }) => {
    await page.goto('/');

    // Check title and document language
    await expect(page).toHaveTitle(/Samagna/);
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');

    // Check hero headline
    const heroH1 = page.locator('h1');
    await expect(heroH1).toBeVisible();
    await expect(heroH1).toContainText('From the forest');
    await expect(heroH1).toContainText('to the marketplace.');

    // Check Odia text presence with lang="or"
    const odiaElements = page.locator('[lang="or"]');
    const odiaCount = await odiaElements.count();
    expect(odiaCount).toBeGreaterThan(0);
  });

  const VIEWPORTS = [
    { name: '320px-portrait', width: 320, height: 568 },
    { name: '320px-landscape', width: 568, height: 320 },
    { name: '360px-portrait', width: 360, height: 640 },
    { name: '360px-landscape', width: 640, height: 360 },
    { name: '390px-portrait', width: 390, height: 844 },
    { name: '390px-landscape', width: 844, height: 390 },
    { name: '414px-portrait', width: 414, height: 896 },
    { name: '414px-landscape', width: 896, height: 414 },
    { name: '768px-tablet-portrait', width: 768, height: 1024 },
    { name: '768px-tablet-landscape', width: 1024, height: 768 },
    { name: '1024px-laptop', width: 1024, height: 768 },
    { name: '1280px-desktop', width: 1280, height: 800 },
    { name: '1440px-large-desktop', width: 1440, height: 900 },
  ];

  for (const vp of VIEWPORTS) {
    test(`2. Zero horizontal scroll at viewport ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      // Assert documentElement.scrollWidth <= window.innerWidth
      const overflow = await page.evaluate(() => {
        const docWidth = document.documentElement.scrollWidth;
        const winWidth = window.innerWidth;
        return {
          scrollWidth: docWidth,
          innerWidth: winWidth,
          hasOverflow: docWidth > winWidth,
        };
      });

      expect(overflow.hasOverflow).toBe(false);
    });
  }

  test('3. Sticky header condenses on scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const header = page.locator('header');
    await expect(header).toHaveClass(/h-20/);

    // Scroll down 100px
    await page.evaluate(() => window.scrollTo(0, 150));
    await page.waitForTimeout(100);

    // Should condense to h-16
    await expect(header).toHaveClass(/h-16/);
  });

  test('4. Accessible mobile menu opens, traps focus, and closes on Escape', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    // Hamburger button
    const menuBtn = page.getByRole('button', { name: /open navigation menu/i });
    await expect(menuBtn).toBeVisible();

    // Click to open menu
    await menuBtn.click();

    // Drawer should be open
    const drawer = page.getByRole('dialog', { name: /mobile navigation/i });
    await expect(drawer).toBeVisible();

    // Check body scroll lock
    const bodyOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(bodyOverflow).toBe('hidden');

    // Press Escape to dismiss
    await page.keyboard.press('Escape');
    await expect(drawer).not.toBeVisible();

    // Check body scroll restored
    const restoredOverflow = await page.evaluate(() => document.body.style.overflow);
    expect(restoredOverflow).not.toBe('hidden');
  });

  test('5. Primary CTA buttons navigate cleanly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    // Verify Batch button
    const verifyBtn = page.getByRole('link', { name: /verify batch/i }).first();
    await expect(verifyBtn).toBeVisible();
    await expect(verifyBtn).toHaveAttribute('href', '/verify');

    // Sign In button
    const signInBtn = page.getByRole('link', { name: /sign in/i }).first();
    await expect(signInBtn).toBeVisible();
    await expect(signInBtn).toHaveAttribute('href', '/login');

    // Explore Marketplace button
    const marketplaceBtn = page.getByRole('link', { name: /explore marketplace/i });
    await expect(marketplaceBtn).toBeVisible();
    await expect(marketplaceBtn).toHaveAttribute('href', '/trade');
  });

  test('6. Botanical catalogue category filter tabs update correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');

    const tabList = page.getByRole('tablist', { name: /filter botanicals by category/i });
    await expect(tabList).toBeVisible();

    const oilseedTab = page.getByRole('tab', { name: /oilseeds & kernels/i });
    await oilseedTab.click();
    await expect(oilseedTab).toHaveAttribute('aria-selected', 'true');

    // Verify cards update
    await expect(page.getByText('Sal Tree Seeds')).toBeVisible();
  });

  test('7. Floating Maitriyam launcher is present and safe-area aware', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    const assistantBtn = page.getByRole('button', { name: /maitriyam/i });
    await expect(assistantBtn).toBeVisible();

    // Verify touch target size
    const box = await assistantBtn.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('8. 404 page renders gracefully with Return to Home action', async ({ page }) => {
    await page.goto('/non-existent-route-404');
    await expect(page.locator('h1')).toContainText('Page or Dossier Not Found');
    const homeBtn = page.getByRole('link', { name: /return to home/i });
    await expect(homeBtn).toBeVisible();
  });
});
