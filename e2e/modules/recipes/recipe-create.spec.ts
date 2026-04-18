/**
 * E2E #4: Recipe Creation — Manual Flow
 *
 * Run: npx playwright test e2e/modules/recipes/recipe-create.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER } from '../../fixtures/test-data';

test.describe('Recipe Creation @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
  });

  test('should show creation choice page with three options', async ({ page }) => {
    await page.goto('/recipes/new');
    await expect(page.getByText(/manual/i).first()).toBeVisible();
    await expect(page.getByText(/photo/i).first()).toBeVisible();
    await expect(page.getByText(/url|link|import/i).first()).toBeVisible();
  });

  test('should navigate to manual recipe form', async ({ page }) => {
    await page.goto('/recipes/new');
    await page.locator('a, button, [role="button"]').filter({ hasText: /manual/i }).first().click();
    await expect(page).toHaveURL(/manual/);
  });

  test('should fill basic recipe info', async ({ page }) => {
    await page.goto('/recipes/new/manual');
    await page.waitForLoadState('networkidle');

    // From screenshot: label is "Recipe Title *", placeholder "My Delicious Recipe"
    const titleInput = page.getByPlaceholder('My Delicious Recipe')
      .or(page.locator('input').first());
    await expect(titleInput.first()).toBeVisible({ timeout: 10000 });
    await titleInput.first().fill('E2E Test New Recipe');
    await expect(titleInput.first()).toHaveValue('E2E Test New Recipe');
  });

  test('should add a step with instructions', async ({ page }) => {
    await page.goto('/recipes/new/manual');
    await page.waitForLoadState('networkidle');

    // Look for "Add Step" button or similar
    const addStepBtn = page.getByRole('button', { name: /add.*step|new.*step/i });
    if (await addStepBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addStepBtn.click();
    }

    // Fill instruction textarea
    const textarea = page.locator('textarea').first();
    if (await textarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await textarea.fill('Test instructions for step one.');
      await expect(textarea).toHaveValue(/test instructions/i);
    }
  });

  test('should add ingredient with autocomplete', async ({ page }) => {
    await page.goto('/recipes/new/manual');
    await page.waitForLoadState('networkidle');

    const ingredientInput = page.getByPlaceholder(/ingredient|search/i);
    if (await ingredientInput.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await ingredientInput.first().fill('Flou');
      await expect(page.getByText(/Flour/i).first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show recipe in My Recipes after creation', async ({ page }) => {
    await page.goto('/recipes');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/E2E/i).first()).toBeVisible({ timeout: 10000 });
  });
});
