/**
 * VideoUpload Component
 * Video upload with TUS resumable protocol, progress bar, and processing status
 */

import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaUpload } from '../hooks/useMediaUpload';
import type { MediaAsset } from '../services/media.api';

interface VideoUploadProps {
  /** Where this video is used */
  context: 'recipe' | 'step';
  /** Optional entity ID */
  entityId?: string;
  /** Existing asset (edit mode) */
  existingAsset?: { id: string; url: string | null; thumbnailUrl: string | null; status: string; durationSeconds: number | null } | null;
  /** Legacy URL (backward compat) */
  existingUrl?: string | null;
  /** Called when upload completes */
  onUploadComplete?: (asset: MediaAsset) => void;
  /** Called when asset is removed */
  onRemove?: () => void;
  /** Optional CSS class */
  className?: string;
}

const ACCEPTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
const MAX_SIZE_MB = 500;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function VideoUpload({
  context,
  entityId,
  existingAsset,
  existingUrl,
  onUploadComplete,
  onRemove,
  className = '',
}: VideoUploadProps) {
  const { t } = useTranslation('recipes');
  const { status, progress, asset, error, uploadVideo, reset } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAsset = asset || (existingAsset as MediaAsset | undefined);
  const displayUrl = currentAsset?.thumbnailUrl || null;
  const videoUrl = currentAsset?.url || existingUrl;
  const isUploading = status === 'requesting' || status === 'uploading';
  const isProcessing = status === 'processing' || status === 'confirming';
  const hasVideo = (!!videoUrl || !!displayUrl) && status !== 'error';

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return;
    }

    const result = await uploadVideo(file, context, entityId);
    if (result && onUploadComplete) {
      onUploadComplete(result);
    }
  }, [context, entityId, uploadVideo, onUploadComplete]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    reset();
    onRemove?.();
  }, [reset, onRemove]);

  const statusLabel = (() => {
    switch (status) {
      case 'requesting': return t('media.preparing', 'Preparing...');
      case 'uploading': return `${t('media.uploading', 'Uploading...')} ${progress}%`;
      case 'processing': return t('media.processing_video', 'Processing video...');
      case 'confirming': return t('media.finalizing', 'Finalizing...');
      case 'ready': return t('media.ready', 'Ready');
      case 'error': return error || t('media.upload_error', 'Upload failed');
      default: return '';
    }
  })();

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />

      {hasVideo && !isUploading && !isProcessing ? (
        /* Video preview with thumbnail */
        <div className="relative group rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
          {displayUrl ? (
            <img src={displayUrl} alt="Video thumbnail" className="w-full h-48 object-cover opacity-80" />
          ) : (
            <div className="w-full h-48 flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
          {/* Duration badge */}
          {currentAsset?.durationSeconds && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
              {formatDuration(currentAsset.durationSeconds)}
            </div>
          )}
          {/* Hover controls */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClick}
              className="px-3 py-1.5 bg-white text-gray-700 rounded-md text-sm font-medium hover:bg-gray-100"
            >
              {t('media.change', 'Change')}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium hover:bg-red-600"
            >
              {t('media.remove', 'Remove')}
            </button>
          </div>
        </div>
      ) : (
        /* Upload zone or progress */
        <div
          onClick={isUploading || isProcessing ? undefined : handleClick}
          className={`
            border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center min-h-[120px]
            transition-colors
            ${isUploading || isProcessing
              ? 'border-orange-300 bg-orange-50 cursor-default'
              : 'cursor-pointer border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          {isUploading || isProcessing ? (
            <div className="text-center w-full max-w-xs">
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isProcessing ? 'bg-blue-500 animate-pulse' : 'bg-orange-500'
                  }`}
                  style={{ width: isProcessing ? '100%' : `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-600">{statusLabel}</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500">
                {t('media.drop_video', 'Drop video here or click to browse')}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                MP4, WebM, MOV — {MAX_SIZE_MB}MB max
              </span>
            </>
          )}
          {error && status === 'error' && (
            <div className="mt-2 text-center">
              <span className="text-xs text-red-500">{error}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); reset(); }}
                className="block text-xs text-orange-600 underline mt-1 mx-auto"
              >
                {t('media.try_again', 'Try again')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
