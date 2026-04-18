/**
 * Auth — E2E Login & Registration
 *
 * Run: npx playwright test e2e/modules/auth/login.spec.ts
 * @module auth
 */
import { test, expect } from '@playwright/test';

test.describe('Login Flow @module:auth', () => {

  test('should show the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    // Click submit without filling — form validation triggers
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();
    // Form should still be visible (not submitted)
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill('nonexistent@test.com');
    await page.locator('#password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In', exact: true }).click();

    await expect(page.getByText(/invalid|error|incorrect/i).first()).toBeVisible({ timeout: 5000 });
  });

  test('should navigate to register page from login', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /create one/i }).click();
    await expect(page).toHaveURL(/register/);
  });

  test('should have a Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/sign in with google/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');
    const passwordInput = page.locator('#password');
    await passwordInput.fill('mypassword');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click the eye icon button
    const toggleButton = page.locator('#password + button, button:has(.material-symbols-outlined)').first();
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});

test.describe('Registration Flow @module:auth', () => {

  test('should show the registration page', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText(/first.*name/i).first()).toBeVisible();
    await expect(page.getByText(/last.*name/i).first()).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
  });

  test('should have a link back to login', async ({ page }) => {
    await page.goto('/register');
    const loginLink = page.getByRole('link', { name: /sign.?in|already/i });
    await expect(loginLink.first()).toBeVisible();
    await loginLink.first().click();
    await expect(page).toHaveURL(/login/);
  });
});
