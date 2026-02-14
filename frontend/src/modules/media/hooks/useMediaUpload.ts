/**
 * useMediaUpload Hook
 * Manages the full upload lifecycle for images and videos
 */

import { useState, useCallback, useRef } from 'react';
import { mediaApi, type MediaAsset } from '../services/media.api';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('useMediaUpload');

type UploadStatus = 'idle' | 'requesting' | 'uploading' | 'confirming' | 'processing' | 'ready' | 'error';

interface UseMediaUploadReturn {
  /** Current upload status */
  status: UploadStatus;
  /** Upload progress percentage (0-100) */
  progress: number;
  /** The completed media asset (after ready) */
  asset: MediaAsset | null;
  /** Error message if upload failed */
  error: string | null;
  /** Upload an image file */
  uploadImage: (file: File, context: 'recipe' | 'step' | 'profile', entityId?: string) => Promise<MediaAsset | null>;
  /** Upload a video file */
  uploadVideo: (file: File, context: 'recipe' | 'step', entityId?: string) => Promise<MediaAsset | null>;
  /** Reset the upload state */
  reset: () => void;
  /** Set an existing asset (e.g., when editing a recipe with existing media) */
  setExistingAsset: (asset: MediaAsset | null) => void;
}

const VIDEO_POLL_INTERVAL = 3000; // 3 seconds
const VIDEO_POLL_MAX_ATTEMPTS = 120; // 6 minutes max

export function useMediaUpload(): UseMediaUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [asset, setAsset] = useState<MediaAsset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setAsset(null);
    setError(null);
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const setExistingAsset = useCallback((existingAsset: MediaAsset | null) => {
    if (existingAsset) {
      setAsset(existingAsset);
      setStatus(existingAsset.status === 'ready' ? 'ready' : existingAsset.status as UploadStatus);
    } else {
      reset();
    }
  }, [reset]);

  const pollVideoUntilReady = useCallback(async (assetId: string): Promise<MediaAsset> => {
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        attempts++;
        if (attempts > VIDEO_POLL_MAX_ATTEMPTS) {
          reject(new Error('Video processing timed out'));
          return;
        }

        try {
          const updatedAsset = await mediaApi.pollVideoStatus(assetId);

          if (updatedAsset.status === 'ready') {
            setAsset(updatedAsset);
            setStatus('ready');
            resolve(updatedAsset);
            return;
          }

          if (updatedAsset.status === 'error') {
            reject(new Error(updatedAsset.errorMessage || 'Video processing failed'));
            return;
          }

          // Still processing, poll again
          pollTimerRef.current = setTimeout(poll, VIDEO_POLL_INTERVAL);
        } catch (err) {
          reject(err);
        }
      };

      pollTimerRef.current = setTimeout(poll, VIDEO_POLL_INTERVAL);
    });
  }, []);

  const uploadImage = useCallback(async (
    file: File,
    context: 'recipe' | 'step' | 'profile',
    entityId?: string
  ): Promise<MediaAsset | null> => {
    try {
      reset();
      setStatus('requesting');

      // 1. Request upload URL
      const { assetId, uploadURL } = await mediaApi.requestImageUpload({
        context,
        entityId,
        originalName: file.name,
      });

      // 2. Upload to Cloudflare
      setStatus('uploading');
      await mediaApi.uploadImageToCloudflare(uploadURL, file, setProgress);

      // 3. Confirm upload
      setStatus('confirming');
      const confirmedAsset = await mediaApi.confirmImageUpload(assetId);

      setAsset(confirmedAsset);
      setStatus('ready');
      logger.debug(`Image upload complete: ${confirmedAsset.id}`);
      return confirmedAsset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('error');
      logger.error(`Image upload error: ${message}`);
      return null;
    }
  }, [reset]);

  const uploadVideo = useCallback(async (
    file: File,
    context: 'recipe' | 'step',
    entityId?: string
  ): Promise<MediaAsset | null> => {
    try {
      reset();
      setStatus('requesting');

      // 1. Request upload URL
      const { assetId, uploadURL } = await mediaApi.requestVideoUpload({
        context,
        entityId,
        originalName: file.name,
      });

      // 2. Upload to Cloudflare via simple form upload
      setStatus('uploading');
      await mediaApi.uploadVideoToCloudflare(uploadURL, file, setProgress);

      // 3. Wait for processing
      setStatus('processing');
      setProgress(100);

      const readyAsset = await pollVideoUntilReady(assetId);
      logger.debug(`Video upload complete: ${readyAsset.id}`);
      return readyAsset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('error');
      logger.error(`Video upload error: ${message}`);
      return null;
    }
  }, [reset, pollVideoUntilReady]);

  return {
    status,
    progress,
    asset,
    error,
    uploadImage,
    uploadVideo,
    reset,
    setExistingAsset,
  };
}
