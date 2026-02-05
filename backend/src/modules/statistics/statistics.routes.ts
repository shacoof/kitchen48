/**
 * Statistics Routes
 * Admin-only API endpoints for viewing statistics
 */

import { Router } from 'express';
import { requireAuth, requireAdmin } from '../auth/auth.middleware.js';
import { statisticsService } from './statistics.service.js';
import { getStatsQuerySchema } from './statistics.types.js';
import { createLogger } from '../../lib/logger.js';

const router = Router();
const logger = createLogger('StatisticsRoutes');

/**
 * GET /api/admin/statistics
 * List all events with optional filters (admin only)
 */
router.get('/', requireAuth, requireAdmin, async (req, res) => {
  try {
    const validation = getStatsQuerySchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const { events, total } = await statisticsService.getAll(validation.data);

    res.json({
      data: events,
      total,
      limit: validation.data.limit,
      offset: validation.data.offset,
    });
  } catch (error) {
    logger.error(`Error fetching statistics: ${error}`);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

/**
 * GET /api/admin/statistics/sessions
 * List all sessions (admin only)
 */
router.get('/sessions', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 100, 1000);
    const offset = Number(req.query.offset) || 0;

    const { sessions, total } = await statisticsService.getSessions(limit, offset);

    res.json({
      data: sessions,
      total,
      limit,
      offset,
    });
  } catch (error) {
    logger.error(`Error fetching sessions: ${error}`);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /api/admin/statistics/event-types
 * Get unique event types for filter dropdown (admin only)
 */
router.get('/event-types', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const eventTypes = await statisticsService.getEventTypes();
    res.json({ eventTypes });
  } catch (error) {
    logger.error(`Error fetching event types: ${error}`);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

export default router;
