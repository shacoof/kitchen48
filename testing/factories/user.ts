/**
 * User factory — creates test user data with sensible defaults.
 *
 * Usage:
 *   import { createUser, createAdminUser } from '../../../testing/factories/user';
 *
 *   const user = createUser({ firstName: 'John' });
 *   const admin = createAdminUser();
 */

let counter = 0;

export interface TestUser {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  nickname: string;
  profilePicture: string | null;
  emailVerified: boolean;
  userType: 'regular' | 'admin';
  videoLanguage: string;
  interfaceLanguage: string;
  measurementSystem: string;
  hasAlarmSound: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function createUser(overrides: Partial<TestUser> = {}): TestUser {
  counter++;
  return {
    id: `test-user-${counter}`,
    email: `user${counter}@test.com`,
    password: '$2b$12$hashedpassword', // bcrypt hash placeholder
    firstName: `Test`,
    lastName: `User${counter}`,
    nickname: `tuser${counter}`,
    profilePicture: null,
    emailVerified: true,
    userType: 'regular',
    videoLanguage: 'en',
    interfaceLanguage: 'en',
    measurementSystem: 'metric',
    hasAlarmSound: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

export function createAdminUser(overrides: Partial<TestUser> = {}): TestUser {
  return createUser({
    email: 'admin@test.com',
    firstName: 'Admin',
    userType: 'admin',
    nickname: 'admin',
    ...overrides,
  });
}

/**
 * Returns user data suitable for a registration request body.
 */
export function createRegisterInput(overrides: Partial<{
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}> = {}) {
  counter++;
  return {
    email: `newuser${counter}@test.com`,
    password: 'TestPassword123!',
    firstName: 'New',
    lastName: `User${counter}`,
    ...overrides,
  };
}

/**
 * Returns user data suitable for a login request body.
 */
export function createLoginInput(overrides: Partial<{
  email: string;
  password: string;
}> = {}) {
  return {
    email: 'user@test.com',
    password: 'TestPassword123!',
    ...overrides,
  };
}

/**
 * Reset the counter (call in beforeEach if you need deterministic IDs).
 */
export function resetUserFactory() {
  counter = 0;
}
