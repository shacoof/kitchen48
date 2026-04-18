/**
 * E2E #2: Login & Logout — Session Lifecycle
 *
 * Run: npx playwright test e2e/modules/auth/session.spec.ts
 * @module auth
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER } from '../../fixtures/test-data';

test.describe('Session Lifecycle @module:auth', () => {

  test('should login with valid credentials and show user in header', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(TEST_USER.email);
    await page.locator('#password').fill(TEST_USER.password);
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    // Should redirect away from login page
    await expect(page).not.toHaveURL(/login/, { timeout: 10000 });

    // User name should be visible in header
    await expect(page.getByText(TEST_USER.firstName).first()).toBeVisible({ timeout: 5000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/login/);
  });

  test('should persist session across page reload', async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);
    await expect(page.getByText(TEST_USER.firstName).first()).toBeVisible({ timeout: 5000 });

    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(TEST_USER.firstName).first()).toBeVisible({ timeout: 5000 });
  });

  test('should logout and show sign-in button', async ({ page }) => {
    await loginAs(page, TEST_USER.email, TEST_USER.password);

    // Click user menu then logout
    await page.getByText(TEST_USER.firstName).first().click();
    await page.getByText(/sign.?out|log.?out/i).first().click();

    // Sign In should reappear
    const signIn = page.getByRole('link', { name: /sign.?in/i })
      .or(page.getByRole('button', { name: /sign.?in/i }));
    await expect(signIn.first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('auth_token'));
    await page.goto('/recipes');

    const onLoginPage = page.url().includes('login');
    const loginPrompt = page.getByText(/sign.?in|log.?in|please.*login/i);

    if (!onLoginPage) {
      await expect(loginPrompt.first()).toBeVisible({ timeout: 5000 });
    } else {
      await expect(page).toHaveURL(/login/);
    }
  });
});
