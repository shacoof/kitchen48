/**
 * Upload Service
 * File storage and management logic
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from '../../lib/logger.js';
import { usersService } from '../users/users.service.js';

const logger = createLogger('UploadService');

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

class UploadService {
  /**
   * Ensure upload directory exists
   */
  async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    } catch (error) {
      logger.error(`Failed to create upload directory: ${error}`);
    }
  }

  /**
   * Process profile picture upload
   * - Deletes old profile picture if exists
   * - Updates user's profilePicture field
   */
  async processProfilePicture(
    userId: string,
    file: Express.Multer.File
  ): Promise<{ success: boolean; data?: { url: string; filename: string }; error?: string }> {
    try {
      // Get current user to find old profile picture
      const user = await usersService.getFullProfile(userId);

      if (!user) {
        // Delete uploaded file since user doesn't exist
        await this.deleteFile(file.path);
        return { success: false, error: 'User not found' };
      }

      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldFilename = path.basename(user.profilePicture);
        const oldPath = path.join(UPLOAD_DIR, oldFilename);
        await this.deleteFile(oldPath);
      }

      // Generate URL for the new file
      const url = `/uploads/${file.filename}`;

      // Update user's profile picture in database
      const updated = await usersService.updateProfilePicture(userId, url);

      if (!updated) {
        // Delete uploaded file since update failed
        await this.deleteFile(file.path);
        return { success: false, error: 'Failed to update profile picture' };
      }

      logger.debug(`Profile picture uploaded for user ${userId}: ${file.filename}`);

      return {
        success: true,
        data: {
          url,
          filename: file.filename,
        },
      };
    } catch (error) {
      logger.error(`Error processing profile picture upload: ${error}`);
      // Try to clean up uploaded file
      await this.deleteFile(file.path);
      return { success: false, error: 'Failed to process upload' };
    }
  }

  /**
   * Delete a file from the filesystem
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      logger.debug(`Deleted file: ${filePath}`);
      return true;
    } catch (error) {
      // File might not exist, which is fine
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        logger.warning(`Failed to delete file ${filePath}: ${error}`);
      }
      return false;
    }
  }

  /**
   * Get full path for a file in the upload directory
   */
  getFilePath(filename: string): string {
    return path.join(UPLOAD_DIR, filename);
  }
}

export const uploadService = new UploadService();
export default uploadService;
