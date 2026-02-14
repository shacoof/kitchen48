/**
 * Media API Service
 * Handles media upload and management API calls (Cloudflare Stream + Images)
 */

import { createLogger } from '../../../lib/logger';

const API_BASE = '/api';
const logger = createLogger('MediaApi');

// Types
export interface MediaAsset {
  id: string;
  type: 'image' | 'video';
  provider: string;
  cfAssetId: string | null;
  url: string | null;
  thumbnailUrl: string | null;
  status: 'pending' | 'processing' | 'ready' | 'error';
  originalName: string | null;
  mimeType: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  errorMessage: string | null;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadUrlResponse {
  assetId: string;
  uploadURL: string;
  cfAssetId: string;
}

export interface MediaAssetResponse {
  asset: MediaAsset;
}

type MediaContext = 'recipe' | 'step' | 'profile';

class MediaApi {
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  /**
   * Request a signed upload URL for an image
   */
  async requestImageUpload(options: {
    context: MediaContext;
    entityId?: string;
    originalName?: string;
  }): Promise<UploadUrlResponse> {
    logger.debug(`Requesting image upload URL for ${options.context}`);

    const response = await fetch(`${API_BASE}/media/upload/image`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to request image upload');
    }

    return response.json();
  }

  /**
   * Request a TUS upload URL for a video
   */
  async requestVideoUpload(options: {
    context: MediaContext;
    entityId?: string;
    originalName?: string;
    maxDurationSeconds?: number;
  }): Promise<UploadUrlResponse> {
    logger.debug(`Requesting video upload URL for ${options.context}`);

    const response = await fetch(`${API_BASE}/media/upload/video`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to request video upload');
    }

    return response.json();
  }

  /**
   * Upload an image file directly to Cloudflare using the signed URL
   */
  async uploadImageToCloudflare(
    uploadURL: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    logger.debug(`Uploading image to Cloudflare: ${file.name}`);

    const formData = new FormData();
    formData.append('file', file);

    // Use XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: network error'));
      });

      xhr.open('POST', uploadURL);
      xhr.send(formData);
    });
  }

  /**
   * Upload a video file directly to Cloudflare using the signed URL
   */
  async uploadVideoToCloudflare(
    uploadURL: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<void> {
    logger.debug(`Uploading video to Cloudflare: ${file.name}`);

    const formData = new FormData();
    formData.append('file', file);

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Video upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Video upload failed: network error'));
      });

      xhr.open('POST', uploadURL);
      xhr.send(formData);
    });
  }

  /**
   * Confirm an image upload (triggers CDN URL generation)
   */
  async confirmImageUpload(assetId: string): Promise<MediaAsset> {
    const response = await fetch(`${API_BASE}/media/${assetId}/confirm`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to confirm upload');
    }

    const data: MediaAssetResponse = await response.json();
    return data.asset;
  }

  /**
   * Poll video processing status
   */
  async pollVideoStatus(assetId: string): Promise<MediaAsset> {
    const response = await fetch(`${API_BASE}/media/${assetId}/poll`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to poll status');
    }

    const data: MediaAssetResponse = await response.json();
    return data.asset;
  }

  /**
   * Get media asset details
   */
  async getAsset(assetId: string): Promise<MediaAsset> {
    const response = await fetch(`${API_BASE}/media/${assetId}`, {
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to get asset');
    }

    const data: MediaAssetResponse = await response.json();
    return data.asset;
  }

  /**
   * Delete a media asset
   */
  async deleteAsset(assetId: string): Promise<void> {
    const response = await fetch(`${API_BASE}/media/${assetId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete asset');
    }
  }
}

export const mediaApi = new MediaApi();
export default mediaApi;
