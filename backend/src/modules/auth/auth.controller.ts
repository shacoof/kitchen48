/**
 * Auth Controller
 * Request handlers for authentication endpoints
 */

import type { Request, Response } from 'express';
import { authService } from './auth.service.js';
import { createLogger } from '../../lib/logger.js';
import { statisticsService } from '../statistics/statistics.service.js';
import { StatEventTypes } from '../statistics/statistics.types.js';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from './auth.types.js';

const logger = createLogger('AuthController');

export const authController = {
  /**
   * POST /api/auth/register
   * Register a new user with email and password
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await authService.register(parsed.data);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // Track registration event
      const userAgent = req.headers['user-agent'];
      const deviceType = statisticsService.detectDeviceType(userAgent);
      statisticsService.track({
        eventType: StatEventTypes.USER_REGISTER,
        entityType: 'user',
        metadata: {
          deviceType,
          userAgent,
          email: parsed.data.email,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
      });
    } catch (error) {
      logger.error(`Registration error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'An error occurred during registration',
      });
    }
  },

  /**
   * POST /api/auth/login
   * Login with email and password
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await authService.login(parsed.data);

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: result.error,
        });
        return;
      }

      // Track login event
      const userAgent = req.headers['user-agent'];
      const deviceType = statisticsService.detectDeviceType(userAgent);
      statisticsService.track({
        eventType: StatEventTypes.USER_LOGIN,
        userId: result.data?.user.id,
        entityType: 'user',
        entityId: result.data?.user.id,
        metadata: {
          deviceType,
          userAgent,
          loginMethod: 'email',
        },
      });

      res.json({
        success: true,
        data: result.data,
      });
    } catch (error) {
      logger.error(`Login error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'An error occurred during login',
      });
    }
  },

  /**
   * POST /api/auth/verify-email
   * Verify email with token
   */
  async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const parsed = verifyEmailSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await authService.verifyEmail(parsed.data.token);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: 'Email verified successfully. You can now login.',
      });
    } catch (error) {
      logger.error(`Email verification error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'An error occurred during email verification',
      });
    }
  },

  /**
   * POST /api/auth/resend-verification
   * Resend verification email
   */
  async resendVerification(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const parsed = resendVerificationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: parsed.error.issues,
        });
        return;
      }

      const result = await authService.resendVerification(parsed.data.email);

      if (!result.success) {
        res.status(400).json({
          success: false,
          error: result.error,
        });
        return;
      }

      res.json({
        success: true,
        message: 'If an account exists with this email, a verification email has been sent.',
      });
    } catch (error) {
      logger.error(`Resend verification error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'An error occurred while sending verification email',
      });
    }
  },

  /**
   * GET /api/auth/me
   * Get current user (requires authentication)
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      // User is attached by auth middleware
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: 'Not authenticated',
        });
        return;
      }

      const user = await authService.getUserById(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      logger.error(`Get user error: ${error}`);
      res.status(500).json({
        success: false,
        error: 'An error occurred while fetching user data',
      });
    }
  },
};

export default authController;
