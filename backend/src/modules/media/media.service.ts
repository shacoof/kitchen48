/**
 * Media Service
 * Business logic for media asset management (Cloudflare Stream + Images)
 */

import { prisma } from '../../core/database/prisma.js';
import { createLogger } from '../../lib/logger.js';
import {
  createVideoDirectUpload,
  createImageDirectUpload,
  getVideoDetails,
  deleteVideo,
  deleteImage,
  getImageDeliveryUrl,
} from './cloudflare.client.js';
import type {
  CreateImageUploadInput,
  CreateVideoUploadInput,
  MediaAsset,
  UploadUrlResponse,
  StreamWebhookPayload,
} from './media.types.js';

const logger = createLogger('MediaService');

class MediaService {
  /**
   * Request a signed upload URL for an image.
   * Creates a DB record and returns the Cloudflare direct upload URL.
   */
  async createImageUpload(
    userId: string,
    input: CreateImageUploadInput
  ): Promise<UploadUrlResponse> {
    logger.debug(`Creating image upload for user ${userId}`);

    const cfResult = await createImageDirectUpload({
      meta: {
        userId,
        context: input.context,
        ...(input.entityId && { entityId: input.entityId }),
      },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        type: 'image',
        provider: 'cloudflare',
        cfAssetId: cfResult.id,
        status: 'pending',
        originalName: input.originalName,
        uploadedBy: userId,
      },
    });

    logger.debug(`Image upload created: asset=${asset.id}, cf=${cfResult.id}`);

    return {
      assetId: asset.id,
      uploadURL: cfResult.uploadURL,
      cfAssetId: cfResult.id,
    };
  }

  /**
   * Request a TUS upload URL for a video.
   * Creates a DB record and returns the Cloudflare Stream direct upload URL.
   */
  async createVideoUpload(
    userId: string,
    input: CreateVideoUploadInput
  ): Promise<UploadUrlResponse> {
    logger.debug(`Creating video upload for user ${userId}`);

    const cfResult = await createVideoDirectUpload({
      maxDurationSeconds: input.maxDurationSeconds,
      meta: {
        userId,
        context: input.context,
        ...(input.entityId && { entityId: input.entityId }),
      },
    });

    const asset = await prisma.mediaAsset.create({
      data: {
        type: 'video',
        provider: 'cloudflare',
        cfAssetId: cfResult.uid,
        status: 'pending',
        originalName: input.originalName,
        uploadedBy: userId,
      },
    });

    logger.debug(`Video upload created: asset=${asset.id}, cf=${cfResult.uid}`);

    return {
      assetId: asset.id,
      uploadURL: cfResult.uploadURL,
      cfAssetId: cfResult.uid,
    };
  }

  /**
   * Get a media asset by ID
   */
  async getById(id: string): Promise<MediaAsset | null> {
    return prisma.mediaAsset.findUnique({ where: { id } });
  }

  /**
   * Mark an image as ready after the frontend confirms upload completion.
   * Fetches the delivery URL from Cloudflare.
   */
  async confirmImageUpload(assetId: string, userId: string): Promise<MediaAsset> {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });

    if (!asset) {
      throw new Error('Media asset not found');
    }

    if (asset.uploadedBy !== userId) {
      throw new Error('You can only manage your own media');
    }

    if (asset.type !== 'image') {
      throw new Error('Asset is not an image');
    }

    if (!asset.cfAssetId) {
      throw new Error('Asset has no Cloudflare ID');
    }

    const url = getImageDeliveryUrl(asset.cfAssetId);
    const thumbnailUrl = getImageDeliveryUrl(asset.cfAssetId, 'thumbnail');

    const updated = await prisma.mediaAsset.update({
      where: { id: assetId },
      data: {
        status: 'ready',
        url,
        thumbnailUrl,
      },
    });

    logger.debug(`Image confirmed ready: ${assetId}`);
    return updated;
  }

  /**
   * Handle Cloudflare Stream webhook notification (video ready/error).
   */
  async handleStreamWebhook(payload: StreamWebhookPayload): Promise<void> {
    const { uid, readyToStream, status } = payload;

    logger.debug(`Stream webhook received: uid=${uid}, state=${status.state}, ready=${readyToStream}`);

    const asset = await prisma.mediaAsset.findFirst({
      where: { cfAssetId: uid },
    });

    if (!asset) {
      logger.warning(`Stream webhook for unknown asset: ${uid}`);
      return;
    }

    if (readyToStream && payload.playback) {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: 'ready',
          url: payload.playback.hls,
          thumbnailUrl: payload.thumbnail,
          durationSeconds: payload.duration,
          width: payload.input?.width,
          height: payload.input?.height,
        },
      });

      logger.debug(`Video ready: asset=${asset.id}, hls=${payload.playback.hls}`);
    } else if (status.state === 'error') {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: 'error',
          errorMessage: status.errorReasonText || status.errorReasonCode || 'Unknown error',
        },
      });

      logger.error(`Video processing error: asset=${asset.id}, reason=${status.errorReasonText}`);
    } else {
      await prisma.mediaAsset.update({
        where: { id: asset.id },
        data: {
          status: 'processing',
        },
      });
    }
  }

  /**
   * Poll video status from Cloudflare (fallback if webhooks are delayed)
   */
  async pollVideoStatus(assetId: string, userId: string): Promise<MediaAsset> {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });

    if (!asset) {
      throw new Error('Media asset not found');
    }

    if (asset.uploadedBy !== userId) {
      throw new Error('You can only manage your own media');
    }

    if (asset.type !== 'video' || !asset.cfAssetId) {
      throw new Error('Asset is not a valid video');
    }

    if (asset.status === 'ready') {
      return asset;
    }

    const details = await getVideoDetails(asset.cfAssetId);

    if (details.readyToStream) {
      const updated = await prisma.mediaAsset.update({
        where: { id: assetId },
        data: {
          status: 'ready',
          url: details.playback.hls,
          thumbnailUrl: details.thumbnail,
          durationSeconds: details.duration,
          width: details.input?.width,
          height: details.input?.height,
        },
      });

      logger.debug(`Video polled ready: ${assetId}`);
      return updated;
    }

    if (details.status.state === 'error') {
      const updated = await prisma.mediaAsset.update({
        where: { id: assetId },
        data: {
          status: 'error',
          errorMessage: details.status.errorReasonText || 'Processing failed',
        },
      });
      return updated;
    }

    // Still processing
    await prisma.mediaAsset.update({
      where: { id: assetId },
      data: { status: 'processing' },
    });

    return prisma.mediaAsset.findUnique({ where: { id: assetId } }) as Promise<MediaAsset>;
  }

  /**
   * Delete a media asset (from DB and Cloudflare)
   */
  async delete(assetId: string, userId: string): Promise<void> {
    const asset = await prisma.mediaAsset.findUnique({ where: { id: assetId } });

    if (!asset) {
      throw new Error('Media asset not found');
    }

    if (asset.uploadedBy !== userId) {
      throw new Error('You can only delete your own media');
    }

    // Delete from Cloudflare
    if (asset.cfAssetId) {
      try {
        if (asset.type === 'video') {
          await deleteVideo(asset.cfAssetId);
        } else if (asset.type === 'image') {
          await deleteImage(asset.cfAssetId);
        }
      } catch (error) {
        logger.warning(`Failed to delete from Cloudflare (continuing with DB delete): ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Delete from database
    await prisma.mediaAsset.delete({ where: { id: assetId } });
    logger.debug(`Media asset deleted: ${assetId}`);
  }

  /**
   * Get all media assets for a user
   */
  async getByUser(userId: string): Promise<MediaAsset[]> {
    return prisma.mediaAsset.findMany({
      where: { uploadedBy: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const mediaService = new MediaService();
export default mediaService;
