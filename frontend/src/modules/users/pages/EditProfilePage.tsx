/**
 * EditProfilePage
 * Edit own profile page at /profile/edit
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { usersApi, FullUserProfile } from '../services/users.api';
import { useListValues } from '../../../hooks/useListValues';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('EditProfilePage');

// Form validation schema (matches backend)
const profileSchema = z.object({
  nickname: z
    .string()
    .min(3, 'Nickname must be at least 3 characters')
    .max(30, 'Nickname must be at most 30 characters')
    .regex(
      /^[a-z][a-z0-9_]{2,29}$/,
      'Nickname must start with a letter and contain only lowercase letters, numbers, and underscores'
    )
    .optional()
    .or(z.literal('')),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  description: z.string().optional().nullable(),
  videoLanguage: z.string().min(1),
  interfaceLanguage: z.string().min(1),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { values: languages } = useListValues({ typeName: 'Languages' });
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  // Fetch profile data
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchProfile = async () => {
      setLoading(true);
      const result = await usersApi.getOwnProfile();

      if (result.error) {
        logger.error(`Failed to load profile: ${result.error}`);
        setError(t('edit.error_message'));
      } else if (result.data) {
        setProfile(result.data);
        // Reset form with fetched data
        reset({
          nickname: result.data.nickname || '',
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          description: result.data.description || '',
          videoLanguage: result.data.videoLanguage || 'en',
          interfaceLanguage: result.data.interfaceLanguage || 'en',
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [isAuthenticated, reset, t]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await usersApi.updateProfile({
      nickname: data.nickname || undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      description: data.description || null,
      videoLanguage: data.videoLanguage,
      interfaceLanguage: data.interfaceLanguage,
    });

    if (result.error) {
      logger.error(`Failed to update profile: ${result.error}`);
      setError(result.error);
    } else if (result.data) {
      setProfile(result.data);
      setSuccess(t('edit.success_message'));
      // Refresh auth context to update header
      await refreshUser();
      // Reset form with new data
      reset({
        nickname: result.data.nickname || '',
        firstName: result.data.firstName || '',
        lastName: result.data.lastName || '',
        description: result.data.description || '',
        videoLanguage: result.data.videoLanguage || 'en',
        interfaceLanguage: result.data.interfaceLanguage || 'en',
      });
    }

    setSaving(false);
  };

  const handlePictureUploadSuccess = async (url: string) => {
    logger.debug(`Profile picture updated: ${url}`);
    // Refresh profile data
    const result = await usersApi.getOwnProfile();
    if (result.data) {
      setProfile(result.data);
    }
    // Refresh auth context to update header avatar
    await refreshUser();
    setSuccess(t('edit.picture_updated'));
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">{t('edit.loading')}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-red-500">{error || t('edit.error_message')}</div>
      </div>
    );
  }

  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'User';

  return (
    <div className="min-h-screen bg-background-light">
      {/* Header */}
      <header className="bg-primary text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">
            Kitchen<span className="text-accent-orange">48</span>
          </Link>
          <nav className="flex items-center gap-4">
            {profile.nickname && (
              <Link
                to={`/${profile.nickname}`}
                className="text-gray-300 hover:text-white"
              >
                {t('edit.view_profile')}
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{t('edit.page_title')}</h1>

        {/* Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Profile Picture Section */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('edit.profile_picture_label')}</h2>
            <ProfilePictureUpload
              currentPicture={profile.profilePicture}
              userName={displayName}
              onUploadSuccess={handlePictureUploadSuccess}
              onUploadError={(err) => setError(err)}
            />
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Nickname */}
            <div>
              <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.nickname_label')}
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">{t('edit.nickname_prefix')}</span>
                <input
                  id="nickname"
                  type="text"
                  {...register('nickname')}
                  placeholder={t('edit.nickname_placeholder')}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                />
              </div>
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-500">{errors.nickname.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {t('edit.nickname_helper')}
              </p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.firstname_label')}
              </label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.lastname_label')}
              </label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.about_label')}
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                placeholder={t('edit.about_placeholder')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent resize-none"
              />
            </div>

            {/* Video Language */}
            <div>
              <label htmlFor="videoLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.video_language_label')}
              </label>
              <select
                id="videoLanguage"
                {...register('videoLanguage')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Interface Language */}
            <div>
              <label htmlFor="interfaceLanguage" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.interface_language_label')}
              </label>
              <select
                id="interfaceLanguage"
                {...register('interfaceLanguage')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                to="/"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                {t('edit.cancel_button')}
              </Link>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('edit.saving') : t('edit.save_button')}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditProfilePage;
