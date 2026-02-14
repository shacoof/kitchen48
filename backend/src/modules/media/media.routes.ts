/**
 * Media Routes
 * API endpoints for media upload and management (Cloudflare Stream + Images)
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { mediaService } from './media.service.js';
import {
  createImageUploadSchema,
  createVideoUploadSchema,
} from './media.types.js';
import { verifyStreamWebhookSignature } from './cloudflare.client.js';
import { createLogger } from '../../lib/logger.js';
import { statisticsService } from '../statistics/statistics.service.js';

const router = Router();
const logger = createLogger('MediaRoutes');

// ============================================================================
// Upload URL Endpoints (auth required)
// ============================================================================

/**
 * POST /api/media/upload/image
 * Request a signed direct upload URL for an image
 */
router.post('/upload/image', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = createImageUploadSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await mediaService.createImageUpload(req.userId!, validation.data);

    statisticsService.track({
      eventType: 'media.upload.image',
      userId: req.userId!,
      entityType: 'media',
      entityId: result.assetId,
      metadata: { context: validation.data.context },
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error(`Error creating image upload: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to create image upload' });
  }
});

/**
 * POST /api/media/upload/video
 * Request a TUS upload URL for a video
 */
router.post('/upload/video', requireAuth, async (req: Request, res: Response) => {
  try {
    const validation = createVideoUploadSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await mediaService.createVideoUpload(req.userId!, validation.data);

    statisticsService.track({
      eventType: 'media.upload.video',
      userId: req.userId!,
      entityType: 'media',
      entityId: result.assetId,
      metadata: { context: validation.data.context },
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error(`Error creating video upload: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to create video upload' });
  }
});

// ============================================================================
// Asset Management (auth required)
// ============================================================================

/**
 * GET /api/media/:id
 * Get media asset details and status
 */
router.get('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const asset = await mediaService.getById(req.params.id);

    if (!asset) {
      res.status(404).json({ error: 'Media asset not found' });
      return;
    }

    if (asset.uploadedBy !== req.userId) {
      res.status(403).json({ error: 'You can only view your own media' });
      return;
    }

    res.json({ asset });
  } catch (error) {
    logger.error(`Error fetching media: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Failed to fetch media asset' });
  }
});

/**
 * POST /api/media/:id/confirm
 * Confirm image upload completion (triggers URL generation)
 */
router.post('/:id/confirm', requireAuth, async (req: Request, res: Response) => {
  try {
    const asset = await mediaService.confirmImageUpload(req.params.id, req.userId!);
    res.json({ asset });
  } catch (error) {
    logger.error(`Error confirming upload: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Media asset not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only manage your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to confirm upload' });
  }
});

/**
 * POST /api/media/:id/poll
 * Poll video processing status from Cloudflare
 */
router.post('/:id/poll', requireAuth, async (req: Request, res: Response) => {
  try {
    const asset = await mediaService.pollVideoStatus(req.params.id, req.userId!);
    res.json({ asset });
  } catch (error) {
    logger.error(`Error polling status: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Media asset not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only manage your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to poll video status' });
  }
});

/**
 * DELETE /api/media/:id
 * Delete a media asset (from DB and Cloudflare)
 */
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    await mediaService.delete(req.params.id, req.userId!);

    statisticsService.track({
      eventType: 'media.delete',
      userId: req.userId!,
      entityType: 'media',
      entityId: req.params.id,
    });

    res.status(204).send();
  } catch (error) {
    logger.error(`Error deleting media: ${error instanceof Error ? error.message : String(error)}`);

    if (error instanceof Error) {
      if (error.message === 'Media asset not found') {
        res.status(404).json({ error: error.message });
        return;
      }
      if (error.message.includes('only delete your own')) {
        res.status(403).json({ error: error.message });
        return;
      }
    }

    res.status(500).json({ error: 'Failed to delete media' });
  }
});

// ============================================================================
// Webhooks (no auth - verified by signature)
// ============================================================================

/**
 * POST /api/media/webhook/stream
 * Cloudflare Stream webhook - called when video processing completes or fails
 */
router.post('/webhook/stream', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['webhook-signature'] as string;
    const rawBody = JSON.stringify(req.body);

    if (signature) {
      const isValid = await verifyStreamWebhookSignature(rawBody, signature);
      if (!isValid) {
        logger.warning('Invalid Stream webhook signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    await mediaService.handleStreamWebhook(req.body);
    res.status(200).json({ received: true });
  } catch (error) {
    logger.error(`Error handling Stream webhook: ${error instanceof Error ? error.message : String(error)}`);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export { router as mediaRouter };
export default router;
