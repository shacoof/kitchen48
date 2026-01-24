/**
 * Auth Routes
 * Authentication API endpoints
 */

import { Router } from 'express';
import passport from 'passport';
import { authController } from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

const router = Router();

// ============================================================================
// Email/Password Authentication
// ============================================================================

/**
 * POST /api/auth/register
 * Register a new user with email and password
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', authController.verifyEmail);

/**
 * POST /api/auth/resend-verification
 * Resend verification email
 */
router.post('/resend-verification', authController.resendVerification);

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', requireAuth, authController.me);

// ============================================================================
// Google OAuth
// ============================================================================

/**
 * GET /api/auth/google
 * Initiate Google OAuth flow
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

/**
 * GET /api/auth/google/callback
 * Google OAuth callback
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${env.FRONTEND_URL}/login?error=oauth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user as { id: string; email: string };

      if (!user) {
        res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
        return;
      }

      // Generate JWT token
      const token = authService.generateToken(user.id, user.email);

      // Redirect to frontend with token
      res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }
  }
);

export default router;
