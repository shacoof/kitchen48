/**
 * Upload Middleware
 * Multer configuration for file uploads
 */

import multer from 'multer';
import path from 'path';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('UploadMiddleware');

// Allowed MIME types for profile pictures
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Max file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

/**
 * Storage configuration for profile pictures
 */
const profilePictureStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Get user ID from auth middleware
    const userId = (req as { userId?: string }).userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();

    // Generate filename: profile-{userId}-{timestamp}.{ext}
    const filename = `profile-${userId}-${timestamp}${ext}`;
    cb(null, filename);
  },
});

/**
 * File filter for profile pictures
 */
const profilePictureFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    logger.warning(`Rejected file upload: invalid MIME type ${file.mimetype}`);
    cb(new Error(`Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`));
  }
};

/**
 * Multer instance for profile picture uploads
 */
export const profilePictureUpload = multer({
  storage: profilePictureStorage,
  fileFilter: profilePictureFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Error handler middleware for multer errors
 */
export function handleMulterError(
  err: Error,
  _req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum size is 5MB' });
      return;
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      res.status(400).json({ error: 'Too many files. Only one file allowed' });
      return;
    }
    logger.error(`Multer error: ${err.code} - ${err.message}`);
    res.status(400).json({ error: 'File upload error' });
    return;
  }

  if (err.message.includes('Invalid file type')) {
    res.status(400).json({ error: err.message });
    return;
  }

  next(err);
}
