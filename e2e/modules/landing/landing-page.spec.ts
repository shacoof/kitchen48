/**
 * E2E #1: Landing Page — Public Face
 *
 * Verifies the public landing page renders all major sections.
 * No authentication required.
 *
 * Run: npx playwright test e2e/modules/landing/
 * @module landing
 */
import { test, expect } from '@playwright/test';

test.describe('Landing Page @module:landing', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should load the page with hero section', async ({ page }) => {
    // Hero section should be prominently visible
    const hero = page.locator('section, div').filter({ hasText: /kitchen48|cook|recipe|discover/i }).first();
    await expect(hero).toBeVisible();
  });

  test('should display the header with navigation', async ({ page }) => {
    // Logo or brand should be visible
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    // Sign In link should be present for unauthenticated users
    const signIn = page.getByRole('link', { name: /sign.?in|log.?in/i })
      .or(page.getByRole('button', { name: /sign.?in|log.?in/i }));
    await expect(signIn.first()).toBeVisible();
  });

  test('should show recipe carousel section', async ({ page }) => {
    // Look for a section with recipe cards
    const recipeSection = page.locator('[class*="recipe"], [class*="carousel"]')
      .or(page.locator('section').filter({ hasText: /recipe/i }));
    // At least one recipe-related section should exist
    await expect(recipeSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show chefs/masters section', async ({ page }) => {
    const chefsSection = page.getByText(/chef|master|author/i).first();
    await expect(chefsSection).toBeVisible({ timeout: 10000 });
  });

  test('should render footer', async ({ page }) => {
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should navigate to login page from header', async ({ page }) => {
    const signIn = page.getByRole('link', { name: /sign.?in|log.?in/i })
      .or(page.getByRole('button', { name: /sign.?in|log.?in/i }));
    await signIn.first().click();
    await expect(page).toHaveURL(/login/);
  });
});
