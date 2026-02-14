/**
 * Cloudflare Client
 * Wrapper for Cloudflare Stream (video) and Images API
 */

import { env } from '../../config/env.js';
import { createLogger } from '../../lib/logger.js';

const logger = createLogger('CloudflareClient');

const CF_API_BASE = 'https://api.cloudflare.com/client/v4';

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
}

// ============================================================================
// Stream (Video) Types
// ============================================================================

export interface StreamDirectUploadResult {
  uid: string;
  uploadURL: string;
}

export interface StreamVideoDetails {
  uid: string;
  status: { state: string; pctComplete?: string; errorReasonCode?: string; errorReasonText?: string };
  thumbnail: string;
  playback: { hls: string; dash: string };
  duration: number;
  input: { width: number; height: number };
  readyToStream: boolean;
  meta?: Record<string, string>;
}

// ============================================================================
// Images Types
// ============================================================================

export interface ImagesDirectUploadResult {
  id: string;
  uploadURL: string;
}

export interface ImageDetails {
  id: string;
  filename: string;
  variants: string[];
  meta?: Record<string, string>;
}

// ============================================================================
// Helpers
// ============================================================================

function getHeaders(): Record<string, string> {
  if (!env.CF_API_TOKEN) {
    throw new Error('CF_API_TOKEN is not configured');
  }
  return {
    Authorization: `Bearer ${env.CF_API_TOKEN}`,
  };
}

function getAccountUrl(): string {
  if (!env.CF_ACCOUNT_ID) {
    throw new Error('CF_ACCOUNT_ID is not configured');
  }
  return `${CF_API_BASE}/accounts/${env.CF_ACCOUNT_ID}`;
}

// ============================================================================
// Stream (Video) Operations
// ============================================================================

/**
 * Create a direct upload URL for video (TUS protocol).
 * The frontend uploads directly to Cloudflare using this URL.
 */
export async function createVideoDirectUpload(options: {
  maxDurationSeconds?: number;
  meta?: Record<string, string>;
}): Promise<StreamDirectUploadResult> {
  const { maxDurationSeconds = 3600, meta } = options;

  logger.debug('Creating video direct upload URL');

  const response = await fetch(`${getAccountUrl()}/stream/direct_upload`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      maxDurationSeconds,
      meta,
    }),
  });

  const data = (await response.json()) as CloudflareResponse<StreamDirectUploadResult>;

  if (!data.success) {
    logger.error(`Failed to create video upload URL: ${JSON.stringify(data.errors)}`);
    throw new Error(`Cloudflare Stream error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  logger.debug(`Video upload URL created: ${data.result.uid}`);
  return data.result;
}

/**
 * Get video details from Cloudflare Stream
 */
export async function getVideoDetails(videoUid: string): Promise<StreamVideoDetails> {
  const response = await fetch(`${getAccountUrl()}/stream/${videoUid}`, {
    headers: getHeaders(),
  });

  const data = (await response.json()) as CloudflareResponse<StreamVideoDetails>;

  if (!data.success) {
    throw new Error(`Cloudflare Stream error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  return data.result;
}

/**
 * Delete a video from Cloudflare Stream
 */
export async function deleteVideo(videoUid: string): Promise<void> {
  logger.debug(`Deleting video: ${videoUid}`);

  const response = await fetch(`${getAccountUrl()}/stream/${videoUid}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    logger.error(`Failed to delete video ${videoUid}: ${response.status}`);
    throw new Error(`Failed to delete video: ${response.statusText}`);
  }
}

// ============================================================================
// Images Operations
// ============================================================================

/**
 * Create a direct upload URL for an image.
 * The frontend uploads directly to Cloudflare using this URL.
 */
export async function createImageDirectUpload(options: {
  meta?: Record<string, string>;
}): Promise<ImagesDirectUploadResult> {
  const { meta } = options;

  logger.debug('Creating image direct upload URL');

  const formData = new FormData();
  if (meta) {
    formData.append('metadata', JSON.stringify(meta));
  }
  formData.append('requireSignedURLs', 'false');

  const response = await fetch(`${getAccountUrl()}/images/v2/direct_upload`, {
    method: 'POST',
    headers: getHeaders(),
    body: formData,
  });

  const data = (await response.json()) as CloudflareResponse<ImagesDirectUploadResult>;

  if (!data.success) {
    logger.error(`Failed to create image upload URL: ${JSON.stringify(data.errors)}`);
    throw new Error(`Cloudflare Images error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  logger.debug(`Image upload URL created: ${data.result.id}`);
  return data.result;
}

/**
 * Get image details from Cloudflare Images
 */
export async function getImageDetails(imageId: string): Promise<ImageDetails> {
  const response = await fetch(`${getAccountUrl()}/images/v1/${imageId}`, {
    headers: getHeaders(),
  });

  const data = (await response.json()) as CloudflareResponse<ImageDetails>;

  if (!data.success) {
    throw new Error(`Cloudflare Images error: ${data.errors[0]?.message || 'Unknown error'}`);
  }

  return data.result;
}

/**
 * Delete an image from Cloudflare Images
 */
export async function deleteImage(imageId: string): Promise<void> {
  logger.debug(`Deleting image: ${imageId}`);

  const response = await fetch(`${getAccountUrl()}/images/v1/${imageId}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });

  if (!response.ok) {
    logger.error(`Failed to delete image ${imageId}: ${response.status}`);
    throw new Error(`Failed to delete image: ${response.statusText}`);
  }
}

/**
 * Get the public delivery URL for an image
 */
export function getImageDeliveryUrl(imageId: string, variant = 'public'): string {
  if (!env.CF_IMAGES_ACCOUNT_HASH) {
    throw new Error('CF_IMAGES_ACCOUNT_HASH is not configured');
  }
  return `https://imagedelivery.net/${env.CF_IMAGES_ACCOUNT_HASH}/${imageId}/${variant}`;
}

// ============================================================================
// Webhook Verification
// ============================================================================

/**
 * Verify a Cloudflare Stream webhook signature
 */
export async function verifyStreamWebhookSignature(
  body: string,
  signature: string
): Promise<boolean> {
  if (!env.CF_STREAM_WEBHOOK_SECRET) {
    logger.error('CF_STREAM_WEBHOOK_SECRET is not configured');
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(env.CF_STREAM_WEBHOOK_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
    const expectedSignature = Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return signature === expectedSignature;
  } catch (error) {
    logger.error(`Webhook signature verification failed: ${error instanceof Error ? error.message : String(error)}`);
    return false;
  }
}
