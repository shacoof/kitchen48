/**
 * UserProfilePage
 * Public profile page accessible via /:nickname
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { UserAvatar } from '../../../components/common/UserAvatar';
import { usersApi, PublicUserProfile } from '../services/users.api';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('UserProfilePage');

export function UserProfilePage() {
  const { nickname } = useParams<{ nickname: string }>();
  const { t } = useTranslation('profile');
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!nickname) {
      setError('No nickname provided');
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      const result = await usersApi.getPublicProfile(nickname);

      if (result.error) {
        logger.warning(`Failed to load profile for ${nickname}: ${result.error}`);
        setError(result.error === 'User not found' ? 'User not found' : 'Failed to load profile');
      } else if (result.data) {
        setProfile(result.data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [nickname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">{t('edit.loading')}</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background-light flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <h1 className="text-2xl font-bold text-gray-800">
          {error === 'User not found' ? t('view.not_found') : t('view.error_heading')}
        </h1>
        <p className="text-gray-600">
          {error === 'User not found'
            ? t('view.not_found_message', { nickname })
            : t('view.error_message')}
        </p>
        <Link
          to="/"
          className="mt-4 px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90"
        >
          {t('view.go_home')}
        </Link>
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || t('view.default_name');

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
        </div>
      </header>

      {/* Profile Content */}
      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Header */}
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
            <UserAvatar
              profilePicture={profile.profilePicture}
              name={displayName}
              size="xl"
              className="border-4 border-gray-100"
            />
            <div className="text-center sm:text-left">
              <h1 className="text-3xl font-bold text-gray-800">{displayName}</h1>
              {profile.nickname && (
                <p className="text-gray-500">@{profile.nickname}</p>
              )}
            </div>
          </div>

          {/* Description */}
          {profile.description && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('view.about')}</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{profile.description}</p>
            </div>
          )}

          {/* Placeholder for future content (recipes, etc.) */}
          <div className="border-t border-gray-100 pt-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('view.recipes')}</h2>
            <p className="text-gray-500 italic">{t('view.coming_soon')}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserProfilePage;
