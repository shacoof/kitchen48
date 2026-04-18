/**
 * E2E #3: Recipe Detail Page
 *
 * Tests the full recipe view page with all sections.
 *
 * Run: npx playwright test e2e/modules/recipes/recipe-detail.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { TEST_USER, RECIPES } from '../../fixtures/test-data';

const RECIPE_URL = `/${TEST_USER.nickname}/${RECIPES.published1.slug}`;

test.describe('Recipe Detail Page @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(RECIPE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should load recipe by semantic URL', async ({ page }) => {
    await expect(page).toHaveURL(new RegExp(RECIPES.published1.slug));
    await expect(page.getByText(RECIPES.published1.title)).toBeVisible();
  });

  test('should display recipe description', async ({ page }) => {
    await expect(page.getByText(RECIPES.published1.description)).toBeVisible();
  });

  test('should show recipe metadata', async ({ page }) => {
    // Servings should be visible
    const servings = page.getByText(`${RECIPES.published1.servings}`)
      .or(page.getByText(/serving/i));
    await expect(servings.first()).toBeVisible();
  });

  test('should show author info with link to profile', async ({ page }) => {
    const authorLink = page.getByRole('link', { name: new RegExp(TEST_USER.firstName, 'i') })
      .or(page.getByRole('link', { name: new RegExp(TEST_USER.nickname, 'i') }));

    await expect(authorLink.first()).toBeVisible();
  });

  test('should render all recipe steps in order', async ({ page }) => {
    for (const step of RECIPES.published1.steps) {
      await expect(page.getByText(step.title)).toBeVisible();
    }
  });

  test('should show ingredients section', async ({ page }) => {
    // At least one ingredient from the seeded data
    const ingredient = page.getByText(/flour|sugar|salt/i);
    await expect(ingredient.first()).toBeVisible();
  });

  test('should have a Play button that navigates to play mode', async ({ page }) => {
    const playButton = page.getByRole('link', { name: /play|start.?cook/i })
      .or(page.getByRole('button', { name: /play|start.?cook/i }));

    await expect(playButton.first()).toBeVisible();
    await playButton.first().click();

    await expect(page).toHaveURL(/play/);
  });
});
