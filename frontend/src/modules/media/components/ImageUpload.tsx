/**
 * ImageUpload Component
 * Drag-and-drop image upload with preview, connected to Cloudflare Images
 */

import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMediaUpload } from '../hooks/useMediaUpload';
import type { MediaAsset } from '../services/media.api';

interface ImageUploadProps {
  /** Where this image is used (recipe hero, step image, etc.) */
  context: 'recipe' | 'step' | 'profile';
  /** Optional entity ID (recipe or step ID) */
  entityId?: string;
  /** Existing asset to display (edit mode) */
  existingAsset?: { id: string; url: string | null; thumbnailUrl: string | null; status: string } | null;
  /** Legacy URL (for backward compatibility with imageUrl field) */
  existingUrl?: string | null;
  /** Called when upload completes with the asset ID */
  onUploadComplete?: (asset: MediaAsset) => void;
  /** Called when asset is removed */
  onRemove?: () => void;
  /** Optional CSS class */
  className?: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

export function ImageUpload({
  context,
  entityId,
  existingAsset,
  existingUrl,
  onUploadComplete,
  onRemove,
  className = '',
}: ImageUploadProps) {
  const { t } = useTranslation('recipes');
  const { status, progress, asset, error, uploadImage, reset } = useMediaUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  // Determine the display URL
  const displayUrl =
    asset?.url ||
    asset?.thumbnailUrl ||
    existingAsset?.url ||
    existingAsset?.thumbnailUrl ||
    existingUrl ||
    localPreview;

  const isUploading = status === 'requesting' || status === 'uploading' || status === 'confirming';
  const hasImage = !!displayUrl && status !== 'error';

  const handleFile = useCallback(async (file: File) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      return;
    }

    // Create local preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setLocalPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    const result = await uploadImage(file, context, entityId);
    if (result && onUploadComplete) {
      onUploadComplete(result);
    }
  }, [context, entityId, uploadImage, onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    reset();
    setLocalPreview(null);
    onRemove?.();
  }, [reset, onRemove]);

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        className="hidden"
        onChange={handleInputChange}
      />

      {hasImage ? (
        /* Image preview with remove button */
        <div className="relative group rounded-lg overflow-hidden border border-gray-200">
          <img
            src={displayUrl!}
            alt="Upload preview"
            className="w-full h-48 object-cover"
          />
          {/* Overlay with remove/change buttons */}
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
          {/* Upload progress overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-32 h-2 bg-white/30 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm">{progress}%</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Drop zone */
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            cursor-pointer border-2 border-dashed rounded-lg p-6
            flex flex-col items-center justify-center min-h-[120px]
            transition-colors
            ${dragOver
              ? 'border-orange-400 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
            }
            ${error ? 'border-red-300 bg-red-50' : ''}
          `}
        >
          {isUploading ? (
            <div className="text-center">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mb-2 mx-auto">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm text-gray-500">{t('media.uploading', 'Uploading...')} {progress}%</span>
            </div>
          ) : (
            <>
              <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-gray-500">
                {t('media.drop_image', 'Drop image here or click to browse')}
              </span>
              <span className="text-xs text-gray-400 mt-1">
                JPEG, PNG, WebP — {MAX_SIZE_MB}MB max
              </span>
            </>
          )}
          {error && (
            <span className="text-xs text-red-500 mt-2">{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
