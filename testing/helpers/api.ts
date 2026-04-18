/**
 * Backend API test helper — creates a minimal Express app for supertest.
 *
 * Usage:
 *   import { createTestRouter } from '../../../testing/helpers/api';
 *
 *   const request = await createTestRouter('/api/auth', () =>
 *     import('../../src/modules/auth/auth.routes.js')
 *   );
 *
 *   const res = await request.post('/api/auth/login').send({ email, password });
 */
import express, { type Router } from 'express';
import supertest from 'supertest';
import jwt from 'jsonwebtoken';

/**
 * Creates a supertest instance with the given route mounted.
 * Each test gets its own Express app — fully isolated.
 */
export async function createTestRouter(
  basePath: string,
  routeImporter: () => Promise<{ default: Router } | { [key: string]: Router }>
): Promise<supertest.SuperTest<supertest.Test>> {
  const app = express();
  app.use(express.json());

  const mod = await routeImporter();
  if ('default' in mod) {
    app.use(basePath, mod.default);
  } else {
    // Handle named exports like { usersRouter, adminUsersRouter }
    for (const [, router] of Object.entries(mod)) {
      if (router && typeof router === 'function') {
        app.use(basePath, router as Router);
      }
    }
  }

  return supertest(app);
}

/**
 * Generate a valid JWT for testing protected routes.
 */
export function generateTestToken(
  userId: string = 'test-user-id',
  email: string = 'test@example.com'
): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET || 'test-jwt-secret-at-least-32-characters-long',
    { expiresIn: '1h' }
  );
}

/**
 * Generate an admin JWT for testing admin-only routes.
 */
export function generateAdminToken(): string {
  return generateTestToken('admin-user-id', 'admin@example.com');
}
