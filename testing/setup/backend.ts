/**
 * Backend test setup — loaded before every backend test via vitest.config.ts
 */
import { vi } from 'vitest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
process.env.JWT_EXPIRES_IN = '1h';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/kitchen48_test';
process.env.FRONTEND_URL = 'http://localhost:5173';

// Mock the Prisma singleton — individual tests can override specific methods
vi.mock('../backend/src/core/database/prisma.js', () => {
  return {
    prisma: createMockPrisma(),
  };
});

// Mock logger to keep test output clean
vi.mock('../backend/src/lib/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    object: vi.fn(),
    timing: vi.fn(),
  }),
}));

function createMockPrisma() {
  const mockModel = () => ({
    findMany: vi.fn().mockResolvedValue([]),
    findUnique: vi.fn().mockResolvedValue(null),
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({}),
    update: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
    upsert: vi.fn().mockResolvedValue({}),
    count: vi.fn().mockResolvedValue(0),
    createMany: vi.fn().mockResolvedValue({ count: 0 }),
  });

  return {
    user: mockModel(),
    parameter: mockModel(),
    recipe: mockModel(),
    ingredient: mockModel(),
    listOfValueType: mockModel(),
    listOfValue: mockModel(),
    listValueTranslation: mockModel(),
    statEvent: mockModel(),
    statSession: mockModel(),
    oauthAccount: mockModel(),
    dataMigration: mockModel(),
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    $transaction: vi.fn((fn: (prisma: unknown) => Promise<unknown>) => fn(this)),
  };
}
