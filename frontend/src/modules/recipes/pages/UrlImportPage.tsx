/**
 * UrlImportPage
 * Paste a recipe URL to import via AI extraction
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { recipesApi } from '../services/recipes.api';
import { useTranslation } from 'react-i18next';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('UrlImportPage');

export function UrlImportPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('recipes');

  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const isValidUrl = (value: string): boolean => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const handleSubmit = async () => {
    if (!url.trim() || !isValidUrl(url.trim())) {
      setError(t('url_import.error_invalid_url'));
      return;
    }

    setError(null);
    setWarnings([]);
    setImporting(true);
    setProgress(t('url_import.progress_fetching'));

    try {
      setProgress(t('url_import.progress_analyzing'));
      const result = await recipesApi.importFromUrl(url.trim());

      if (!result.success || result.error) {
        setError(result.error || t('url_import.error_generic'));
        setImporting(false);
        setProgress(null);
        return;
      }

      // If there are warnings, show them briefly before redirecting
      if (result.warnings && result.warnings.length > 0) {
        setWarnings(result.warnings);
        setProgress(t('url_import.progress_done'));
        setTimeout(() => {
          navigate(`/recipes/${result.recipe.id}/edit`);
        }, 2000);
      } else {
        navigate(`/recipes/${result.recipe.id}/edit`);
      }
    } catch (err) {
      logger.error(`URL import error: ${err}`);
      setError(t('url_import.error_generic'));
      setImporting(false);
      setProgress(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !importing) {
      handleSubmit();
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
            {t('url_import.title')}
          </h1>
        </div>

        <p className="text-gray-500 mb-8">{t('url_import.subtitle')}</p>

        {/* URL input */}
        {!importing && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <label htmlFor="recipe-url" className="block text-sm font-medium text-gray-700 mb-2">
              {t('url_import.input_label')}
            </label>
            <div className="flex gap-3">
              <input
                id="recipe-url"
                type="url"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={t('url_import.input_placeholder')}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent outline-none text-sm"
                dir="ltr"
              />
              <button
                onClick={handleSubmit}
                disabled={!url.trim()}
                className="px-6 py-3 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                {t('url_import.import_button')}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('url_import.hint')}</p>
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

        {/* Import progress */}
        {importing && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center mb-6">
            <div className="animate-spin w-12 h-12 border-4 border-accent-orange border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-700 font-medium">{progress}</p>
            <p className="text-sm text-gray-400 mt-2">{t('url_import.please_wait')}</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default UrlImportPage;
