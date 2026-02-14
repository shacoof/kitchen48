/**
 * Media Types
 * Zod schemas and TypeScript types for media assets (Cloudflare Stream + Images)
 */

import { z } from 'zod';

// ============================================================================
// Request Schemas
// ============================================================================

/** Request to create an image upload URL */
export const createImageUploadSchema = z.object({
  context: z.enum(['recipe', 'step', 'profile']),
  entityId: z.string().optional(),
  originalName: z.string().optional(),
});

/** Request to create a video upload URL */
export const createVideoUploadSchema = z.object({
  context: z.enum(['recipe', 'step']),
  entityId: z.string().optional(),
  originalName: z.string().optional(),
  maxDurationSeconds: z.number().int().positive().max(3600).optional().default(600),
});

/** Update media asset status (from webhook or polling) */
export const updateMediaStatusSchema = z.object({
  status: z.enum(['processing', 'ready', 'error']),
  url: z.string().url().optional(),
  thumbnailUrl: z.string().url().optional(),
  durationSeconds: z.number().optional(),
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  errorMessage: z.string().optional(),
});

// ============================================================================
// Types
// ============================================================================

export type CreateImageUploadInput = z.infer<typeof createImageUploadSchema>;
export type CreateVideoUploadInput = z.infer<typeof createVideoUploadSchema>;
export type UpdateMediaStatusInput = z.infer<typeof updateMediaStatusSchema>;

export interface MediaAsset {
  id: string;
  type: string;
  provider: string;
  cfAssetId: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  status: string;
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  errorMessage: string | null;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UploadUrlResponse {
  assetId: string;
  uploadURL: string;
  cfAssetId: string;
}

/** Cloudflare Stream webhook payload */
export interface StreamWebhookPayload {
  uid: string;
  readyToStream: boolean;
  status: {
    state: string;
    pctComplete?: string;
    errorReasonCode?: string;
    errorReasonText?: string;
  };
  duration?: number;
  input?: {
    width: number;
    height: number;
  };
  thumbnail?: string;
  playback?: {
    hls: string;
    dash: string;
  };
  meta?: Record<string, string>;
}
