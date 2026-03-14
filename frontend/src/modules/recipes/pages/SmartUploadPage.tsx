/**
 * SmartUploadPage
 * Upload recipe photos for AI-powered extraction
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { recipesApi } from '../services/recipes.api';
import { useTranslation } from 'react-i18next';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('SmartUploadPage');

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface PreviewFile {
  file: File;
  preview: string;
}

export function SmartUploadPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('recipes');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<PreviewFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  }, [files]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const incoming = Array.from(newFiles);
    const validFiles: PreviewFile[] = [];
    const errors: string[] = [];

    for (const file of incoming) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: ${t('smart_upload.error_type')}`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: ${t('smart_upload.error_size')}`);
        continue;
      }
      validFiles.push({ file, preview: URL.createObjectURL(file) });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    }

    setFiles((prev) => {
      const combined = [...prev, ...validFiles];
      if (combined.length > MAX_FILES) {
        // Revoke extra previews
        combined.slice(MAX_FILES).forEach((f) => URL.revokeObjectURL(f.preview));
        setError(t('smart_upload.error_max_files', { max: MAX_FILES }));
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }, [t]);

  const removeFile = (index: number) => {
    setFiles((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;

    setError(null);
    setWarnings([]);
    setUploading(true);
    setProgress(t('smart_upload.progress_uploading'));

    try {
      setProgress(t('smart_upload.progress_analyzing'));
      const result = await recipesApi.smartUpload(files.map((f) => f.file));

      if (!result.success || result.error) {
        setError(result.error || t('smart_upload.error_generic'));
        setUploading(false);
        setProgress(null);
        return;
      }

      // If there are warnings, show them briefly before redirecting
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
        setProgress(t('smart_upload.progress_done'));
        // Redirect to edit page after a short delay so user sees warnings
        setTimeout(() => {
          navigate(`/recipes/${result.recipe.id}/edit`);
        }, 2000);
      } else {
        navigate(`/recipes/${result.recipe.id}/edit`);
      }
    } catch (err) {
      logger.error(`Smart upload error: ${err}`);
      setError(t('smart_upload.error_generic'));
      setUploading(false);
      setProgress(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">{t('summary.loading')}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light">
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-8 px-6">
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/recipes/new"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-800">
            {t('smart_upload.title')}
          </h1>
        </div>

        <p className="text-gray-500 mb-8">{t('smart_upload.subtitle')}</p>

        {/* Drop zone */}
        {!uploading && (
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-accent-orange hover:bg-accent-orange/5 transition-colors mb-6"
          >
            <span className="material-symbols-outlined text-5xl text-gray-300 mb-3 block">
              add_photo_alternate
            </span>
            <p className="text-gray-500 mb-1">{t('smart_upload.drop_hint')}</p>
            <p className="text-xs text-gray-400">
              {t('smart_upload.file_requirements', { max: MAX_FILES, size: '10MB' })}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES.join(',')}
              multiple
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
            />
          </div>
        )}

        {/* Image previews */}
        {files.length > 0 && !uploading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
            {files.map((f, i) => (
              <div key={i} className="relative group">
                <img
                  src={f.preview}
                  alt={f.file.name}
                  className="w-full h-28 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(i);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
                <p className="text-xs text-gray-400 truncate mt-1">{f.file.name}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg whitespace-pre-line">
            {error}
          </div>
        )}

        {/* Warnings (after success) */}
        {warnings.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg">
            <div className="flex items-center gap-2 font-medium mb-2">
              <span className="material-symbols-outlined text-yellow-600">warning</span>
              {t('smart_upload.review_needed')}
            </div>
            <ul className="list-disc list-inside text-sm space-y-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mb-6">
            <div className="animate-spin w-12 h-12 border-4 border-accent-orange border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{progress}</p>
            <p className="text-sm text-gray-400 mt-2">{t('smart_upload.please_wait')}</p>
          </div>
        )}

        {/* Submit button */}
        {!uploading && files.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 font-medium flex items-center gap-2"
            >
              <span className="material-symbols-outlined">auto_awesome</span>
              {t('smart_upload.extract_button')}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default SmartUploadPage;
