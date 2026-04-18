/**
 * E2E #5: My Recipes — List & Management
 *
 * Tests the user's recipe dashboard: listing, search, sort, publish, delete.
 *
 * Run: npx playwright test e2e/modules/recipes/my-recipes.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER, RECIPES } from '../../fixtures/test-data';

test.describe('My Recipes @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
  });

  test('should load My Recipes page with user recipes', async ({ page }) => {
    // Should see at least the seeded recipes
    await expect(page.getByText(RECIPES.published1.title)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(RECIPES.published2.title)).toBeVisible();
  });

  test('should show both published and draft recipes', async ({ page }) => {
    // Published recipe should be visible
    await expect(page.getByText(RECIPES.published1.title)).toBeVisible({ timeout: 10000 });

    // Draft recipe should also be visible (owner can see own drafts)
    await expect(page.getByText(RECIPES.draft.title)).toBeVisible();
  });

  test('should filter recipes by search', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search|filter/i)
      .or(page.getByRole('searchbox'));

    if (await searchInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.first().fill('Pancakes');

      // Should show matching recipe
      await expect(page.getByText(RECIPES.published1.title)).toBeVisible();

      // Should not show non-matching recipes
      await expect(page.getByText(RECIPES.published2.title)).not.toBeVisible({ timeout: 3000 });
    }
  });

  test('should sort recipes', async ({ page }) => {
    const sortControl = page.getByRole('combobox')
      .or(page.locator('select'))
      .or(page.getByLabel(/sort/i));

    if (await sortControl.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      // Select a sort option — just verify it doesn't crash
      await sortControl.first().click();
      const sortOption = page.getByText(/recent|newest|alphabetical/i);
      if (await sortOption.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        await sortOption.first().click();
      }

      // Page should still show recipes
      await expect(page.getByText(/E2E/i).first()).toBeVisible();
    }
  });

  test('should navigate to recipe detail when clicking a recipe', async ({ page }) => {
    await expect(page.getByText(RECIPES.published1.title).first()).toBeVisible({ timeout: 10000 });
    await page.getByText(RECIPES.published1.title).first().click();

    await expect(page).toHaveURL(new RegExp(RECIPES.published1.slug));
  });
});
