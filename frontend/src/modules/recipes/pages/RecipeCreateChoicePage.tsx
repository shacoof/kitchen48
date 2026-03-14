/**
 * RecipeCreateChoicePage
 * Gateway page: choose between AI photo upload or manual recipe creation
 */

import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useTranslation } from 'react-i18next';

export function RecipeCreateChoicePage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useTranslation('recipes');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

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

      <main className="max-w-3xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">
          {t('create_choice.title')}
        </h1>
        <p className="text-gray-500 text-center mb-10">
          {t('create_choice.subtitle')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* From Photos */}
          <Link
            to="/recipes/new/from-photos"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-accent-orange"
          >
            <div className="w-16 h-16 bg-accent-orange/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent-orange/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-accent-orange">
                photo_camera
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('create_choice.from_photos')}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('create_choice.from_photos_desc')}
            </p>
          </Link>

          {/* From URL */}
          <Link
            to="/recipes/new/from-url"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-accent-orange"
          >
            <div className="w-16 h-16 bg-accent-orange/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent-orange/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-accent-orange">
                link
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('create_choice.from_url')}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('create_choice.from_url_desc')}
            </p>
          </Link>

          {/* Type Manually */}
          <Link
            to="/recipes/new/manual"
            className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-8 flex flex-col items-center text-center border-2 border-transparent hover:border-accent-orange"
          >
            <div className="w-16 h-16 bg-accent-orange/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent-orange/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-accent-orange">
                edit_note
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {t('create_choice.type_manually')}
            </h2>
            <p className="text-gray-500 text-sm">
              {t('create_choice.type_manually_desc')}
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}

export default RecipeCreateChoicePage;
