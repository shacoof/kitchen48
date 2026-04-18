/**
 * E2E #7: User Profile — View & Edit
 *
 * From screenshot: public profile shows name, @nickname, About section, Recipes section.
 * Recipes section shows "Coming soon..." — so we test for the section existing, not recipe listing.
 *
 * Run: npx playwright test e2e/modules/users/
 * @module users
 */
import { test, expect } from '@playwright/test';
import { loginAs } from '../../fixtures/auth';
import { TEST_USER } from '../../fixtures/test-data';

test.describe('User Profile @module:users', () => {

  test.describe('Edit Profile', () => {

    test.beforeEach(async ({ page }) => {
      await loginAs(page, TEST_USER.email, TEST_USER.password);
      await page.goto('/profile/edit');
      await page.waitForLoadState('networkidle');
    });

    test('should load edit profile page with current data', async ({ page }) => {
      const firstNameInput = page.getByLabel(/first.*name/i)
        .or(page.getByPlaceholder(/first.*name/i));
      await expect(firstNameInput.first()).toBeVisible();
      await expect(firstNameInput.first()).toHaveValue(TEST_USER.firstName);
    });

    test('should display nickname field', async ({ page }) => {
      const nicknameInput = page.getByLabel(/nickname|username/i)
        .or(page.getByPlaceholder(/nickname|username/i));
      await expect(nicknameInput.first()).toBeVisible();
      await expect(nicknameInput.first()).toHaveValue(TEST_USER.nickname);
    });

    test('should have a description field', async ({ page }) => {
      const descField = page.getByLabel(/description|bio|about/i)
        .or(page.locator('textarea'));
      await expect(descField.first()).toBeVisible({ timeout: 10000 });
    });

    test('should auto-save profile changes', async ({ page }) => {
      const descField = page.getByLabel(/description|bio|about/i)
        .or(page.locator('textarea'));
      await descField.first().fill('Updated via E2E test');

      // Wait for auto-save
      await page.waitForTimeout(2000);

      // Reload and verify persistence
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(descField.first()).toHaveValue(/Updated via E2E test/);
    });
  });

  test.describe('Public Profile', () => {

    test('should display public profile by nickname', async ({ page }) => {
      await page.goto(`/${TEST_USER.nickname}`);
      await page.waitForLoadState('networkidle');

      // From screenshot: shows "E2E TestUser" and "@e2etestuser"
      await expect(page.getByText(`${TEST_USER.firstName} ${TEST_USER.lastName}`).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(`@${TEST_USER.nickname}`).first()).toBeVisible();
    });

    test('should show About section on public profile', async ({ page }) => {
      await page.goto(`/${TEST_USER.nickname}`);
      await page.waitForLoadState('networkidle');

      // From screenshot: "About" heading
      await expect(page.getByText('About').first()).toBeVisible({ timeout: 10000 });
    });

    test('should show Recipes section on public profile', async ({ page }) => {
      await page.goto(`/${TEST_USER.nickname}`);
      await page.waitForLoadState('networkidle');

      // From screenshot: "Recipes" heading exists (with "Coming soon..." content)
      await expect(page.getByText('Recipes').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
