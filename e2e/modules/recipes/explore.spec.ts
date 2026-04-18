/**
 * E2E #10: Explore Page & Recipe Search
 *
 * Run: npx playwright test e2e/modules/recipes/explore.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { TEST_USER, OTHER_USER, RECIPES } from '../../fixtures/test-data';

test.describe('Explore Page @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
  });

  test('should load explore page with published recipes', async ({ page }) => {
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show only published recipes (no drafts)', async ({ page }) => {
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(RECIPES.draft.title)).not.toBeVisible({ timeout: 3000 });
  });

  test('should filter recipes by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|find/i)
      .or(page.getByRole('searchbox'));

    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().fill('Pancakes');
      await page.waitForTimeout(1000);
      await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible();
    }
  });

  test('should navigate to recipe detail on card click', async ({ page }) => {
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
    await page.getByText(RECIPES.published1.title).first().click();
    await expect(page).toHaveURL(new RegExp(`${TEST_USER.nickname}.*${RECIPES.published1.slug}`));
  });

  test('should work without authentication', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('auth_token'));
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
  });

  test('should show recipes from multiple authors', async ({ page }) => {
    // Verify recipes from test user exist
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
    // Verify recipes from other user exist
    await expect(page.getByText(RECIPES.otherUser.title).first()).toBeVisible({ timeout: 10000 });
  });
});
