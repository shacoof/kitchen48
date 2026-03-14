/**
 * Users Routes
 * Express routes for user profile management and user recipes
 */

import { Router } from 'express';
import multer from 'multer';
import { usersController } from './users.controller.js';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { recipeService } from '../recipes/recipe.service.js';
import { usersService } from './users.service.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('UsersRoutes');

const router = Router();

// Multer config for alarm sound upload (memory storage, max 2MB, audio only)
const alarmSoundUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed (MP3, WAV, OGG, M4A)'));
    }
  },
});

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

/**
 * POST /api/users/me/alarm-sound
 * Upload custom alarm sound (auth required)
 */
router.post('/me/alarm-sound', requireAuth, alarmSoundUpload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: 'Audio file is required' });
      return;
    }

    await usersService.uploadAlarmSound(
      req.userId!,
      file.buffer,
      file.mimetype,
      file.originalname || null,
      file.size
    );

    res.json({ success: true });
  } catch (error) {
    logger.error(`Alarm sound upload error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to upload alarm sound' });
  }
});

/**
 * DELETE /api/users/me/alarm-sound
 * Remove custom alarm sound (auth required)
 */
router.delete('/me/alarm-sound', requireAuth, async (req, res) => {
  try {
    await usersService.deleteAlarmSound(req.userId!);
    res.status(204).send();
  } catch (error) {
    logger.error(`Alarm sound delete error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to delete alarm sound' });
  }
});

/**
 * GET /api/users/:userId/alarm-sound
 * Serve alarm sound binary (public, cached)
 */
router.get('/:userId/alarm-sound', async (req, res) => {
  try {
    const sound = await usersService.getAlarmSound(req.params.userId);
    if (!sound) {
      res.status(404).json({ error: 'No alarm sound found' });
      return;
    }

    res.set({
      'Content-Type': sound.mimeType,
      'Content-Length': String(sound.data.length),
      'Cache-Control': 'private, max-age=3600',
    });
    res.send(sound.data);
  } catch (error) {
    logger.error(`Alarm sound serve error: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to serve alarm sound' });
  }
});

// ============================================================================
// Public Routes
// ============================================================================

/**
 * GET /api/users/featured
 * Get featured authors (users with published recipes) for landing page
 */
router.get('/featured', usersController.getFeaturedAuthors.bind(usersController));

/**
 * GET /api/users/:nickname
 * Get public profile by nickname
 * Note: This comes after /me and /featured routes to avoid matching them as nicknames
 */
router.get('/:nickname', usersController.getPublicProfile.bind(usersController));

/**
 * GET /api/users/:nickname/recipes
 * Get user's public recipes by nickname
 */
router.get('/:nickname/recipes', async (req, res) => {
  try {
    const nickname = req.params.nickname as string;
    const recipes = await recipeService.getByNickname(nickname);
    res.json({ recipes });
  } catch (error) {
    logger.error(`Error fetching user recipes: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

/**
 * GET /api/users/:nickname/recipes/:recipeSlug
 * Get recipe by semantic URL (nickname/recipe-slug)
 */
router.get('/:nickname/recipes/:recipeSlug', async (req, res) => {
  try {
    const { nickname, recipeSlug } = req.params;
    const recipe = await recipeService.getBySemanticUrl(nickname, recipeSlug);

    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Only return published recipes to non-authors
    if (!recipe.isPublished) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    res.json({ recipe });
  } catch (error) {
    logger.error(`Error fetching recipe: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

/**
 * GET /api/users/:nickname/recipes/:recipeSlug/:stepSlug
 * Get specific step by semantic URL
 */
router.get('/:nickname/recipes/:recipeSlug/:stepSlug', async (req, res) => {
  try {
    const { nickname, recipeSlug, stepSlug } = req.params;
    const recipe = await recipeService.getBySemanticUrl(nickname, recipeSlug);

    if (!recipe || !recipe.isPublished) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    // Find the step by slug or order
    const step = recipe.steps.find(
      s => s.slug === stepSlug || s.slug === null && `step${s.order + 1}` === stepSlug
    );

    if (!step) {
      res.status(404).json({ error: 'Step not found' });
      return;
    }

    res.json({
      recipe: {
        id: recipe.id,
        title: recipe.title,
        slug: recipe.slug,
        author: recipe.author,
      },
      step,
      totalSteps: recipe.steps.length,
      stepIndex: recipe.steps.indexOf(step),
    });
  } catch (error) {
    logger.error(`Error fetching step: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch step' });
  }
});

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
