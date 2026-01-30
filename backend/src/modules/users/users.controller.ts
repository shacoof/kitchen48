/**
 * Users Controller
 * Request handlers for user profile management
 */

import type { Request, Response } from 'express';
import { usersService } from './users.service.js';
import { updateProfileSchema, adminUpdateUserSchema } from './users.types.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('UsersController');

// Extend Request to include user info from auth middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

class UsersController {
  /**
   * GET /api/users/:nickname
   * Get public profile by nickname
   */
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const nickname = req.params.nickname as string;

      if (!nickname) {
        res.status(400).json({ error: 'Nickname is required' });
        return;
      }

      const profile = await usersService.getPublicProfileByNickname(nickname.toLowerCase());

      if (!profile) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ data: profile });
    } catch (error) {
      logger.error(`Error getting public profile: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/me/profile
   * Get current user's full profile
   */
  async getOwnProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const profile = await usersService.getFullProfile(userId);

      if (!profile) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ data: profile });
    } catch (error) {
      logger.error(`Error getting own profile: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/users/me/profile
   * Update current user's profile
   */
  async updateOwnProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Validate input
      const parseResult = updateProfileSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.issues,
        });
        return;
      }

      const result = await usersService.updateProfile(userId, parseResult.data);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ data: result.data });
    } catch (error) {
      logger.error(`Error updating own profile: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // ============================================================================
  // Admin Methods
  // ============================================================================

  /**
   * GET /api/admin/users
   * List all users (admin only)
   */
  async listUsers(_req: Request, res: Response): Promise<void> {
    try {
      const users = await usersService.listAllUsers();
      res.json({ data: users });
    } catch (error) {
      logger.error(`Error listing users: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/admin/users/:id
   * Get user by ID (admin only)
   */
  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      const user = await usersService.getUserById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ data: user });
    } catch (error) {
      logger.error(`Error getting user by ID: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/admin/users/:id
   * Update user (admin only)
   */
  async adminUpdateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!id) {
        res.status(400).json({ error: 'User ID is required' });
        return;
      }

      // Validate input
      const parseResult = adminUpdateUserSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: 'Validation failed',
          details: parseResult.error.issues,
        });
        return;
      }

      const result = await usersService.adminUpdateUser(id, parseResult.data);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ data: result.data });
    } catch (error) {
      logger.error(`Error updating user: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const usersController = new UsersController();
export default usersController;
