/**
 * Auth Service — Unit Tests
 *
 * Tests business logic in isolation. All external dependencies (Prisma, email, etc.) are mocked.
 * Run: npm run test -w backend -- --dir src/modules/auth
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock dependencies before importing the service
vi.mock('../../core/database/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../../services/email.service.js', () => ({
  emailService: {
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock('../../config/env.js', () => ({
  env: {
    JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long',
    JWT_EXPIRES_IN: '1h',
    FRONTEND_URL: 'http://localhost:5173',
  },
}));

vi.mock('../../lib/logger.js', () => ({
  createLogger: () => ({
    debug: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
    object: vi.fn(),
    timing: vi.fn(),
  }),
}));

vi.mock('../parameters/parameter.service.js', () => ({
  parameterService: {
    getSystemValue: vi.fn().mockResolvedValue('1h'),
  },
}));

vi.mock('../users/users.service.js', () => ({
  usersService: {
    generateNickname: vi.fn().mockResolvedValue('tuser1'),
  },
}));

// Now import the module under test
const { authService } = await import('./auth.service.js');
const { prisma } = await import('../../core/database/prisma.js');
const { emailService } = await import('../../services/email.service.js');

const mockPrisma = vi.mocked(prisma);

// ─── Test Data ───────────────────────────────────────────────────────────────

const validRegisterInput = {
  email: 'new@test.com',
  password: 'SecurePass123!',
  firstName: 'Test',
  lastName: 'User',
};

const existingUser = {
  id: 'user-1',
  email: 'existing@test.com',
  passwordHash: await bcrypt.hash('SecurePass123!', 4), // Low rounds for speed in tests
  firstName: 'Existing',
  lastName: 'User',
  nickname: 'euser',
  profilePicture: null,
  emailVerified: true,
  userType: 'regular' as const,
  videoLanguage: 'en',
  interfaceLanguage: 'en',
  measurementSystem: 'metric',
  alarmSound: null,
  emailVerificationToken: null,
  emailVerificationExpires: null,
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Register ─────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...existingUser, id: 'new-user' });

      const result = await authService.register(validRegisterInput);

      expect(result.success).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledOnce();

      const createCall = mockPrisma.user.create.mock.calls[0][0];
      expect(createCall.data.email).toBe('new@test.com');
      expect(createCall.data.emailVerified).toBe(false);
      expect(createCall.data.emailVerificationToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as never);

      const result = await authService.register(validRegisterInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Email already registered');
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it('should lowercase the email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...existingUser, id: 'new-user' });

      await authService.register({ ...validRegisterInput, email: 'NEW@TEST.COM' });

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'new@test.com' },
      });
    });

    it('should send verification email after registration', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...existingUser, id: 'new-user', email: 'new@test.com' });

      await authService.register(validRegisterInput);

      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.objectContaining({ to: 'new@test.com' })
      );
    });

    it('should not fail registration if email sending fails', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...existingUser, id: 'new-user' });
      vi.mocked(emailService.sendVerificationEmail).mockResolvedValueOnce({ success: false, error: 'SMTP error' });

      const result = await authService.register(validRegisterInput);

      expect(result.success).toBe(true);
    });
  });

  // ── Login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as never);

      const result = await authService.login({
        email: 'existing@test.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.token).toBeDefined();
      expect(result.data!.user.email).toBe('existing@test.com');
      // Sensitive fields should be stripped
      expect(result.data!.user).not.toHaveProperty('passwordHash');
    });

    it('should reject invalid email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.login({
        email: 'nonexistent@test.com',
        password: 'anything',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject wrong password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as never);

      const result = await authService.login({
        email: 'existing@test.com',
        password: 'WrongPassword!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should reject unverified email', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        emailVerified: false,
      } as never);

      const result = await authService.login({
        email: 'existing@test.com',
        password: 'SecurePass123!',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('verify your email');
    });

    it('should reject OAuth-only user trying email login', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        passwordHash: null,
      } as never);

      const result = await authService.login({
        email: 'existing@test.com',
        password: 'anything',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('social account');
    });
  });

  // ── Token Verification ───────────────────────────────────────────────────

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await authService.generateToken('user-1', 'test@test.com');

      const payload = authService.verifyToken(token);

      expect(payload).toBeDefined();
      expect(payload!.userId).toBe('user-1');
      expect(payload!.email).toBe('test@test.com');
    });

    it('should return null for invalid token', () => {
      const payload = authService.verifyToken('invalid-token');

      expect(payload).toBeNull();
    });

    it('should return null for expired token', () => {
      const token = jwt.sign(
        { userId: 'user-1', email: 'test@test.com' },
        'test-jwt-secret-at-least-32-characters-long',
        { expiresIn: '0s' }
      );

      const payload = authService.verifyToken(token);

      expect(payload).toBeNull();
    });
  });

  // ── Email Verification ───────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        emailVerified: false,
        emailVerificationToken: 'valid-token',
        emailVerificationExpires: new Date(Date.now() + 86400000), // 24h from now
      } as never);

      const result = await authService.verifyEmail('valid-token');

      expect(result.success).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ emailVerified: true }),
        })
      );
    });

    it('should reject invalid verification token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await authService.verifyEmail('bad-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid');
    });

    it('should reject expired verification token', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        ...existingUser,
        emailVerificationToken: 'expired-token',
        emailVerificationExpires: new Date(Date.now() - 1000), // already expired
      } as never);

      const result = await authService.verifyEmail('expired-token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });
  });
});
