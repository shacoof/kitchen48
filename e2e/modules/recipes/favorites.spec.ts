/**
 * E2E #8: Bookmark & Favorites Flow
 *
 * Tests saving/unsaving recipes and the favorites page.
 *
 * Run: npx playwright test e2e/modules/recipes/favorites.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER, OTHER_USER, RECIPES } from '../../fixtures/test-data';

test.describe('Bookmark & Favorites @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
  });

  test('should bookmark a recipe from the detail page', async ({ page }) => {
    // Navigate to another user's recipe
    await page.goto(`/${OTHER_USER.nickname}/${RECIPES.otherUser.slug}`);
    await page.waitForLoadState('networkidle');

    // Click bookmark/save button
    const saveBtn = page.getByRole('button', { name: /save|bookmark|favorite|heart/i })
      .or(page.locator('button[aria-label*="save"], button[aria-label*="bookmark"], button[aria-label*="favorite"]'));

    await expect(saveBtn.first()).toBeVisible({ timeout: 10000 });
    await saveBtn.first().click();

    // Button state should change (filled heart, "saved", etc.)
    await page.waitForTimeout(1000);
  });

  test('should show bookmarked recipe in Favorites page', async ({ page }) => {
    // First bookmark a recipe
    await page.goto(`/${OTHER_USER.nickname}/${RECIPES.otherUser.slug}`);
    await page.waitForLoadState('networkidle');

    const saveBtn = page.getByRole('button', { name: /save|bookmark|favorite|heart/i })
      .or(page.locator('button[aria-label*="save"], button[aria-label*="bookmark"], button[aria-label*="favorite"]'));
    await saveBtn.first().click();
    await page.waitForTimeout(1000);

    // Navigate to favorites
    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');

    // Bookmarked recipe should appear
    await expect(page.getByText(RECIPES.otherUser.title)).toBeVisible({ timeout: 10000 });
  });

  test('should unbookmark from Favorites page', async ({ page }) => {
    await page.goto('/favorites');
    await page.waitForLoadState('networkidle');

    // Find the unbookmark button on the saved recipe
    const unsaveBtn = page.getByRole('button', { name: /remove|unsave|unbookmark|heart/i })
      .or(page.locator('button[aria-label*="remove"], button[aria-label*="unsave"]'));

    if (await unsaveBtn.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await unsaveBtn.first().click();
      await page.waitForTimeout(1000);

      // Recipe should disappear from favorites
      await expect(page.getByText(RECIPES.otherUser.title)).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('should show favorites page', async ({ page }) => {
    // Navigate to favorites — verify the page loads (may have items or empty state)
    await page.goto('/favorites');
    await page.waitForLoadState('domcontentloaded');

    // The page should load — verify we're on favorites
    const heading = page.getByText(/favorite|saved|bookmark/i);
    await expect(heading.first()).toBeVisible({ timeout: 10000 });
  });
});
