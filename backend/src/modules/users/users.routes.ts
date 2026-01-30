/**
 * Users Routes
 * Express routes for user profile management
 */

import { Router } from 'express';
import { usersController } from './users.controller.js';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';

const router = Router();

// ============================================================================
// Authenticated Routes (own profile) - MUST come before /:nickname
// ============================================================================

/**
 * GET /api/users/me/profile
 * Get current user's full profile
 */
router.get('/me/profile', requireAuth, usersController.getOwnProfile.bind(usersController));

/**
 * PUT /api/users/me/profile
 * Update current user's profile
 */
router.put('/me/profile', requireAuth, usersController.updateOwnProfile.bind(usersController));

// ============================================================================
// Public Routes
// ============================================================================

/**
 * GET /api/users/:nickname
 * Get public profile by nickname
 * Note: This comes after /me routes to avoid matching "me" as a nickname
 */
router.get('/:nickname', usersController.getPublicProfile.bind(usersController));

// ============================================================================
// Admin Routes
// ============================================================================

const adminRouter = Router();

/**
 * GET /api/admin/users
 * List all users
 */
adminRouter.get('/', requireAuth, requireAdmin, usersController.listUsers.bind(usersController));

/**
 * GET /api/admin/users/:id
 * Get user by ID
 */
adminRouter.get('/:id', requireAuth, requireAdmin, usersController.getUserById.bind(usersController));

/**
 * PUT /api/admin/users/:id
 * Update user
 */
adminRouter.put('/:id', requireAuth, requireAdmin, usersController.adminUpdateUser.bind(usersController));

export { router as usersRouter, adminRouter as adminUsersRouter };
