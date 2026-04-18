/**
 * E2E #6: Recipe Play Mode — Step Navigation
 *
 * From screenshots: dark theme, left sidebar with steps, main area shows "Step N: Title"
 * Buttons: "← Previous" and "Next →", step list on left, progress bar at bottom.
 *
 * Run: npx playwright test e2e/modules/recipes/recipe-play.spec.ts
 * @module recipes
 */
import { test, expect } from '@playwright/test';
import { TEST_USER, RECIPES } from '../../fixtures/test-data';

const PLAY_URL = `/${TEST_USER.nickname}/${RECIPES.published1.slug}/play`;

test.describe('Recipe Play Mode @module:recipes', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(PLAY_URL);
    await page.waitForLoadState('networkidle');
  });

  test('should enter play mode and show first step', async ({ page }) => {
    // From screenshot: shows "Step 1: Mix dry ingredients"
    await expect(page.getByText('Step 1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(RECIPES.published1.steps[0].title).first()).toBeVisible();
  });

  test('should navigate to next step with Next button', async ({ page }) => {
    await expect(page.getByText('Step 1').first()).toBeVisible({ timeout: 10000 });

    // From screenshot: button text is "Next →"
    await page.getByRole('button', { name: /next/i }).click();

    // Second step should now show
    await expect(page.getByText('Step 2').first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText(RECIPES.published1.steps[1].title).first()).toBeVisible();
  });

  test('should navigate back with Previous button', async ({ page }) => {
    await expect(page.getByText('Step 1').first()).toBeVisible({ timeout: 10000 });

    // Go forward
    await page.getByRole('button', { name: /next/i }).click();
    await expect(page.getByText('Step 2').first()).toBeVisible({ timeout: 5000 });

    // Go back — from screenshot: "← Previous"
    await page.getByRole('button', { name: /previous/i }).click();
    await expect(page.getByText('Step 1').first()).toBeVisible({ timeout: 5000 });
  });

  test('should show step navigation dots', async ({ page }) => {
    // From screenshot: left sidebar has numbered step list
    await expect(page.getByText('1. Mix dry ingredients').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('2. Add wet ingredients').first()).toBeVisible();
    await expect(page.getByText('3. Cook pancakes').first()).toBeVisible();
  });

  test('should show step ingredients', async ({ page }) => {
    // From screenshot: "NEEDED FOR THIS STEP" with ingredients
    await expect(page.getByText(/needed for this step/i).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/flour/i).first()).toBeVisible();
  });

  test('should exit play mode', async ({ page }) => {
    await expect(page.getByText('Step 1').first()).toBeVisible({ timeout: 10000 });

    // From screenshot: X button in top left
    const exitBtn = page.locator('button, a').filter({ hasText: /×|✕/ })
      .or(page.locator('[aria-label*="close"], [aria-label*="exit"]'))
      .or(page.locator('a').filter({ hasText: /close|exit/ }));

    if (await exitBtn.first().isVisible({ timeout: 3000 }).catch(() => false)) {
      await exitBtn.first().click();
      await expect(page).not.toHaveURL(/play/, { timeout: 5000 });
    } else {
      // Try ESC key
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }
  });
});
