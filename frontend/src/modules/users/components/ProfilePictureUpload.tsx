/**
 * ProfilePictureUpload Component
 * Upload profile picture with preview
 */

import { useState, useRef } from 'react';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { usersApi } from '../services/users.api';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('ProfilePictureUpload');

interface ProfilePictureUploadProps {
  /** Current profile picture URL */
  currentPicture?: string | null;
  /** User's name for alt text */
  userName?: string;
  /** Callback when upload succeeds */
  onUploadSuccess?: (url: string) => void;
  /** Callback when upload fails */
  onUploadError?: (error: string) => void;
}

export function ProfilePictureUpload({
  currentPicture,
  userName = 'User',
  onUploadSuccess,
  onUploadError,
}: ProfilePictureUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPEG, PNG, or WebP image');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const result = await usersApi.uploadProfilePicture(file);

      if (result.error) {
        setError(result.error);
        onUploadError?.(result.error);
        return;
      }

      if (result.data) {
        logger.debug(`Profile picture uploaded: ${result.data.url}`);
        setPreviewUrl(null);
        onUploadSuccess?.(result.data.url);
      }
    } catch (err) {
      logger.error(`Upload failed: ${err}`);
      setError('Failed to upload image');
      onUploadError?.('Failed to upload image');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayPicture = previewUrl || currentPicture;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar display */}
      <UserAvatar
        profilePicture={displayPicture}
        name={userName}
        size="xl"
        className="border-4 border-gray-200"
      />

      {/* Error message */}
      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Upload controls */}
      <div className="flex gap-2">
        {previewUrl ? (
          <>
            <button
              type="button"
              onClick={handleUpload}
              disabled={isUploading}
              className="px-4 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isUploading}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </>
        ) : (
          <label className="px-4 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 cursor-pointer">
            Change Photo
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Helper text */}
      <p className="text-gray-500 text-sm">
        JPEG, PNG, or WebP. Max 5MB.
      </p>
    </div>
  );
}

export default ProfilePictureUpload;
