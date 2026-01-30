/**
 * Upload Controller
 * Request handlers for file uploads
 */

import type { Request, Response } from 'express';
import { uploadService } from './upload.service.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('UploadController');

// Extend Request to include user info from auth middleware
interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

class UploadController {
  /**
   * POST /api/upload/profile-picture
   * Upload profile picture
   */
  async uploadProfilePicture(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const file = req.file;

      if (!file) {
        res.status(400).json({ error: 'No file provided' });
        return;
      }

      const result = await uploadService.processProfilePicture(userId, file);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      res.json({ data: result.data });
    } catch (error) {
      logger.error(`Error uploading profile picture: ${error}`);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const uploadController = new UploadController();
export default uploadController;
