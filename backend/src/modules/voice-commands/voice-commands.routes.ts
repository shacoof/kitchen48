/**
 * Voice Commands Routes
 * Public: GET (for play mode)
 * Admin: POST, PUT, DELETE (for management)
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { voiceCommandsService } from './voice-commands.service.js';
import { createLogger } from '../../lib/logger.js';
import {
  createVoiceCommandSchema,
  updateVoiceCommandSchema,
  upsertTranslationSchema,
} from './voice-commands.types.js';

const logger = createLogger('VoiceCommandsRoutes');

const router = Router();

// ============================================================================
// Public Endpoints
// ============================================================================

/**
 * GET /api/voice-commands
 * Get active voice commands with translations for a language
 * Query: ?lang=en (defaults to "en")
 */
router.get('/', async (req, res) => {
  try {
    const lang = (req.query.lang as string) || 'en';
    const commands = await voiceCommandsService.getActiveWithTranslations(lang);
    res.json({ success: true, data: commands });
  } catch (error) {
    logger.error(`Failed to fetch voice commands: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch voice commands' });
  }
});

// ============================================================================
// Admin Endpoints
// ============================================================================

/**
 * GET /api/voice-commands/admin
 * Get all voice commands with all translations (admin)
 */
router.get('/admin', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const commands = await voiceCommandsService.getAll();
    res.json({ success: true, data: commands });
  } catch (error) {
    logger.error(`Failed to fetch voice commands (admin): ${error}`);
    res.status(500).json({ success: false, error: 'Failed to fetch voice commands' });
  }
});

/**
 * POST /api/voice-commands
 * Create a new voice command (admin)
 */
router.post('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = createVoiceCommandSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const command = await voiceCommandsService.create(validation.data);
    res.status(201).json({ success: true, data: command });
  } catch (error) {
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    logger.error(`Failed to create voice command: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to create voice command' });
  }
});

/**
 * PUT /api/voice-commands/:id
 * Update a voice command (admin)
 */
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = updateVoiceCommandSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const command = await voiceCommandsService.update(req.params.id as string, validation.data);
    res.json({ success: true, data: command });
  } catch (error) {
    if (error instanceof Error && error.message === 'Not found') {
      res.status(404).json({ success: false, error: 'Voice command not found' });
      return;
    }
    if (error instanceof Error && error.message.includes('already exists')) {
      res.status(409).json({ success: false, error: error.message });
      return;
    }
    logger.error(`Failed to update voice command: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to update voice command' });
  }
});

/**
 * DELETE /api/voice-commands/:id
 * Delete a voice command (admin)
 */
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
  try {
    await voiceCommandsService.delete(req.params.id as string);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Not found') {
      res.status(404).json({ success: false, error: 'Voice command not found' });
      return;
    }
    logger.error(`Failed to delete voice command: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to delete voice command' });
  }
});

/**
 * PUT /api/voice-commands/:id/translations
 * Upsert a translation for a voice command (admin)
 */
router.put('/:id/translations', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = upsertTranslationSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const command = await voiceCommandsService.upsertTranslation(req.params.id as string, validation.data);
    res.json({ success: true, data: command });
  } catch (error) {
    if (error instanceof Error && error.message === 'Voice command not found') {
      res.status(404).json({ success: false, error: error.message });
      return;
    }
    logger.error(`Failed to upsert translation: ${error}`);
    res.status(500).json({ success: false, error: 'Failed to upsert translation' });
  }
});

export default router;
