/**
 * E2E Auth Helpers
 *
 * Login via API (faster than UI login) and inject JWT into localStorage.
 */
import { type Page, type APIRequestContext } from '@playwright/test';

/**
 * Login via the API and store the JWT in localStorage.
 * Call this in beforeEach or a fixture for tests that need authentication.
 */
export async function loginAs(
  page: Page,
  email: string,
  password: string
): Promise<string> {
  // Navigate to the app first so we can access localStorage on the correct origin
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Call login API directly
  const response = await page.evaluate(
    async ({ email, password }) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    { email, password }
  );

  if (!response.success || !response.data?.token) {
    throw new Error(`Login failed for ${email}: ${response.error || 'Unknown error'}`);
  }

  const token = response.data.token;

  // Store token in localStorage (matching the app's auth pattern)
  await page.evaluate((t) => {
    localStorage.setItem('auth_token', t);
  }, token);

  // Reload so the app picks up the token from localStorage
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  return token;
}

/**
 * Login via API using request context (for API-only tests, no browser needed).
 */
export async function loginViaApi(
  request: APIRequestContext,
  email: string,
  password: string
): Promise<string> {
  const response = await request.post('/api/auth/login', {
    data: { email, password },
  });
  const body = await response.json();

  if (!body.success || !body.data?.token) {
    throw new Error(`API login failed for ${email}: ${body.error || 'Unknown error'}`);
  }

  return body.data.token;
}

/**
 * Clear auth state (logout).
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token');
  });
  await page.reload();
}

/**
 * Wait for the backend to be ready (handles cold start).
 */
export async function waitForBackend(page: Page, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/health');
        const data = await res.json();
        return data.status;
      });
      if (response === 'ok') return;
    } catch {
      // Server not ready yet
    }
    await page.waitForTimeout(2000);
  }
  throw new Error('Backend did not become ready within timeout');
}
