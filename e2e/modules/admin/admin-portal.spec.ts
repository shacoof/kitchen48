/**
 * E2E #9: Admin Portal — Access Control & Parameters Grid
 *
 * From screenshot: dark theme admin portal with nav links:
 * Dashboard | Users | Ingredients | Statistics | List of Values | Voice Commands | Parameters
 *
 * Run: npx playwright test e2e/modules/admin/
 * @module admin
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER, ADMIN_USER } from '../../fixtures/test-data';

test.describe('Admin Portal @module:admin', () => {

  test.describe('Access Control', () => {

    test('should deny access to non-admin user', async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);
      await page.goto('/?subdomain=admin');
      await page.waitForLoadState('networkidle');

      const denied = page.getByText(/access.?denied|not.?authorized|forbidden/i);
      const loginForm = page.locator('#email');

      const isDenied = await denied.first().isVisible({ timeout: 5000 }).catch(() => false);
      const isLoginForm = await loginForm.isVisible({ timeout: 2000 }).catch(() => false);

      expect(isDenied || isLoginForm).toBe(true);
    });

    test('should grant access to admin user', async ({ page }) => {
      await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);
      await page.goto('/?subdomain=admin');
      await page.waitForLoadState('networkidle');

      // Admin should see the dashboard or admin nav
      const adminIndicator = page.getByText(/dashboard/i)
        .or(page.getByText(/admin.*portal/i));
      await expect(adminIndicator.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Parameters Page', () => {

    test.beforeEach(async ({ page }) => {
      await loginAs(page, ADMIN_USER.email, ADMIN_USER.password);
      await page.goto('/?subdomain=admin');
      await page.waitForLoadState('networkidle');
    });

    test('should navigate to Parameters page', async ({ page }) => {
      await page.getByText('Parameters').first().click();
      await page.waitForTimeout(2000);

      // Tabulator grid should appear
      const grid = page.locator('.tabulator');
      await expect(grid.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show parameter data in grid', async ({ page }) => {
      await page.getByText('Parameters').first().click();
      await page.waitForTimeout(2000);

      await expect(page.getByText(/logging|console|minLevel/i).first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Users Page', () => {

    test('should navigate to Users page and show user grid', async ({ page }) => {
      // Admin portal has its own login form — login through it
      await page.goto('/?subdomain=admin');
      await page.waitForLoadState('domcontentloaded');

      // Fill admin login form
      const emailInput = page.getByPlaceholder(/admin|email/i).or(page.locator('input[type="email"]'));
      const passwordInput = page.getByPlaceholder(/password/i).or(page.locator('input[type="password"]'));
      await emailInput.first().fill(ADMIN_USER.email);
      await passwordInput.first().fill(ADMIN_USER.password);
      await page.getByRole('button', { name: /sign.?in/i }).click();

      // Wait for dashboard to load
      await expect(page.getByText(/dashboard/i).first()).toBeVisible({ timeout: 10000 });

      // Navigate to Users
      await page.getByText('Users').first().click();
      await page.waitForTimeout(2000);

      // Grid should show with user data
      const grid = page.locator('.tabulator');
      await expect(grid.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
