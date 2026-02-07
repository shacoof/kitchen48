/**
 * Users Service
 * Business logic for user profile management
 */

import { prisma } from '../../core/database/prisma.js';
import { createLogger } from '../../lib/logger.js';
import type {
  PublicUserProfile,
  FullUserProfile,
  AdminUserListItem,
  UpdateProfileInput,
  AdminUpdateUserInput,
} from './users.types.js';

const logger = createLogger('UsersService');

class UsersService {
  /**
   * Generate a unique nickname from first and last name
   */
  async generateNickname(firstName: string | null, lastName: string | null): Promise<string> {
    // Build base nickname: first letter of firstName + lastName
    const first = (firstName || 'u').charAt(0).toLowerCase();
    const last = (lastName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '');
    const base = (first + last).substring(0, 20); // Limit base to 20 chars

    // Ensure base is at least 3 chars
    const paddedBase = base.length < 3 ? base.padEnd(3, 'x') : base;

    // Check for uniqueness
    let nickname = paddedBase;
    let counter = 2;

    while (await this.nicknameExists(nickname)) {
      nickname = `${paddedBase}${counter}`;
      counter++;

      // Safety limit
      if (counter > 1000) {
        logger.error(`Failed to generate unique nickname for base: ${paddedBase}`);
        throw new Error('Could not generate unique nickname');
      }
    }

    return nickname;
  }

  /**
   * Check if a nickname already exists
   */
  async nicknameExists(nickname: string, excludeUserId?: string): Promise<boolean> {
    const existing = await prisma.user.findUnique({
      where: { nickname },
      select: { id: true },
    });

    if (!existing) return false;
    if (excludeUserId && existing.id === excludeUserId) return false;
    return true;
  }

  /**
   * Get public profile by nickname
   */
  async getPublicProfileByNickname(nickname: string): Promise<PublicUserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { nickname },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        profilePicture: true,
        description: true,
      },
    });

    return user;
  }

  /**
   * Get full profile for user (own profile or admin access)
   */
  async getFullProfile(userId: string): Promise<FullUserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        profilePicture: true,
        description: true,
        phone: true,
        phoneCountry: true,
        emailVerified: true,
        userType: true,
        videoLanguage: true,
        interfaceLanguage: true,
        measurementSystem: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  /**
   * Update own profile
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<{ success: boolean; data?: FullUserProfile; error?: string }> {
    // Check nickname uniqueness if changing
    if (input.nickname) {
      const nicknameExists = await this.nicknameExists(input.nickname, userId);
      if (nicknameExists) {
        return { success: false, error: 'Nickname is already taken' };
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.nickname !== undefined && { nickname: input.nickname }),
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.phoneCountry !== undefined && { phoneCountry: input.phoneCountry }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.videoLanguage !== undefined && { videoLanguage: input.videoLanguage }),
          ...(input.interfaceLanguage !== undefined && { interfaceLanguage: input.interfaceLanguage }),
          ...(input.measurementSystem !== undefined && { measurementSystem: input.measurementSystem }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nickname: true,
          profilePicture: true,
          description: true,
          phone: true,
          phoneCountry: true,
          emailVerified: true,
          userType: true,
          videoLanguage: true,
          interfaceLanguage: true,
          measurementSystem: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { success: true, data: user };
    } catch (error) {
      logger.error(`Failed to update profile for user ${userId}: ${error}`);
      return { success: false, error: 'Failed to update profile' };
    }
  }

  /**
   * Update profile picture URL
   */
  async updateProfilePicture(userId: string, pictureUrl: string | null): Promise<boolean> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { profilePicture: pictureUrl },
      });
      return true;
    } catch (error) {
      logger.error(`Failed to update profile picture for user ${userId}: ${error}`);
      return false;
    }
  }

  // ============================================================================
  // Admin Methods
  // ============================================================================

  /**
   * List all users (admin only)
   */
  async listAllUsers(): Promise<AdminUserListItem[]> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        nickname: true,
        profilePicture: true,
        emailVerified: true,
        userType: true,
        videoLanguage: true,
        interfaceLanguage: true,
        measurementSystem: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return users;
  }

  /**
   * Get user by ID (admin only)
   */
  async getUserById(userId: string): Promise<FullUserProfile | null> {
    return this.getFullProfile(userId);
  }

  /**
   * Update user (admin only)
   */
  async adminUpdateUser(
    userId: string,
    input: AdminUpdateUserInput
  ): Promise<{ success: boolean; data?: FullUserProfile; error?: string }> {
    // Check nickname uniqueness if changing
    if (input.nickname) {
      const nicknameExists = await this.nicknameExists(input.nickname, userId);
      if (nicknameExists) {
        return { success: false, error: 'Nickname is already taken' };
      }
    }

    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.nickname !== undefined && { nickname: input.nickname }),
          ...(input.firstName !== undefined && { firstName: input.firstName }),
          ...(input.lastName !== undefined && { lastName: input.lastName }),
          ...(input.phone !== undefined && { phone: input.phone }),
          ...(input.phoneCountry !== undefined && { phoneCountry: input.phoneCountry }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.emailVerified !== undefined && { emailVerified: input.emailVerified }),
          ...(input.userType !== undefined && { userType: input.userType }),
          ...(input.measurementSystem !== undefined && { measurementSystem: input.measurementSystem }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          nickname: true,
          profilePicture: true,
          description: true,
          phone: true,
          phoneCountry: true,
          emailVerified: true,
          userType: true,
          videoLanguage: true,
          interfaceLanguage: true,
          measurementSystem: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return { success: true, data: user };
    } catch (error) {
      logger.error(`Failed to admin update user ${userId}: ${error}`);
      return { success: false, error: 'Failed to update user' };
    }
  }
}

export const usersService = new UsersService();
export default usersService;
