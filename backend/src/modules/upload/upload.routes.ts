/**
 * Upload Routes
 * Express routes for file uploads
 */

import { Router } from 'express';
import { uploadController } from './upload.controller.js';
import { profilePictureUpload, handleMulterError } from './upload.middleware.js';
import { requireAuth } from '../auth/auth.middleware.js';

const router = Router();

/**
 * POST /api/upload/profile-picture
 * Upload profile picture
 */
router.post(
  '/profile-picture',
  requireAuth,
  profilePictureUpload.single('file'),
  handleMulterError,
  uploadController.uploadProfilePicture.bind(uploadController)
);

export { router as uploadRouter };
