/**
 * EditProfilePage
 * Edit own profile page at /profile/edit
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { ImageUpload } from '../../media/components/ImageUpload';
import { VideoUpload } from '../../media/components/VideoUpload';
import { usersApi, FullUserProfile } from '../services/users.api';
import { useListValues } from '../../../hooks/useListValues';
import { createLogger } from '../../../lib/logger';
import type { MediaAsset } from '../../media/services/media.api';

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/mp3', 'audio/wave', 'audio/x-wav'];
const MAX_AUDIO_SIZE = 2 * 1024 * 1024; // 2MB

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
  measurementSystem: z.string().min(1),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('profile');
  const { user, isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
  const { values: languages } = useListValues({ typeName: 'Languages' });
  const { values: measurementSystems } = useListValues({ typeName: 'Measurement System' });
  const [profile, setProfile] = useState<FullUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadRef = useRef(true);

  // Media state
  const [profilePhotoId, setProfilePhotoId] = useState<string | null>(null);
  const [introVideoId, setIntroVideoId] = useState<string | null>(null);

  // Alarm sound state
  const [hasAlarmSound, setHasAlarmSound] = useState(false);
  const [alarmSoundUploading, setAlarmSoundUploading] = useState(false);
  const [alarmSoundPreviewUrl, setAlarmSoundPreviewUrl] = useState<string | null>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);
  const alarmFileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    reset,
    watch,
    trigger,
    getValues,
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
        setProfilePhotoId(result.data.profilePhotoId || null);
        setIntroVideoId(result.data.introVideoId || null);
        // Initialize alarm sound state from auth user
        if (user?.hasAlarmSound) {
          setHasAlarmSound(true);
          setAlarmSoundPreviewUrl(`/api/users/${user.id}/alarm-sound`);
        }
        // Reset form with fetched data
        reset({
          nickname: result.data.nickname || '',
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          description: result.data.description || '',
          videoLanguage: result.data.videoLanguage || 'en',
          interfaceLanguage: result.data.interfaceLanguage || 'en',
          measurementSystem: result.data.measurementSystem || 'metric',
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [isAuthenticated, reset, t]);

  const doAutoSave = useCallback(async (data: ProfileFormData) => {
    setSaveStatus('saving');
    setError(null);

    const result = await usersApi.updateProfile({
      nickname: data.nickname || undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      description: data.description || null,
      videoLanguage: data.videoLanguage,
      interfaceLanguage: data.interfaceLanguage,
      measurementSystem: data.measurementSystem,
      profilePhotoId,
      introVideoId,
    });

    if (result.error) {
      logger.error(`Failed to update profile: ${result.error}`);
      setError(result.error);
      setSaveStatus('error');
    } else if (result.data) {
      setProfile(result.data);
      setSaveStatus('saved');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      await refreshUser();
      reset({
        nickname: result.data.nickname || '',
        firstName: result.data.firstName || '',
        lastName: result.data.lastName || '',
        description: result.data.description || '',
        videoLanguage: result.data.videoLanguage || 'en',
        interfaceLanguage: result.data.interfaceLanguage || 'en',
        measurementSystem: result.data.measurementSystem || 'metric',
      });
    }

  }, [profilePhotoId, introVideoId, refreshUser, reset]);

  // Watch all form fields for auto-save
  const watchedFields = watch();

  useEffect(() => {
    // Skip auto-save on initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }
    if (!isDirty || !profile) return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      const isValid = await trigger();
      if (isValid) {
        const data = getValues();
        doAutoSave(data);
      }
    }, 1000);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [watchedFields, isDirty, profile, trigger, getValues, doAutoSave]);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const handlePhotoUploadComplete = useCallback(async (asset: MediaAsset) => {
    logger.debug(`Profile photo uploaded: ${asset.id}`);
    setProfilePhotoId(asset.id);
    // Save immediately so user doesn't lose the upload
    const result = await usersApi.updateProfile({ profilePhotoId: asset.id });
    if (result.data) {
      setProfile(result.data);
      await refreshUser();
      setSuccess(t('edit.picture_updated'));
    }
  }, [refreshUser, t]);

  const handlePhotoRemove = useCallback(async () => {
    setProfilePhotoId(null);
    const result = await usersApi.updateProfile({ profilePhotoId: null });
    if (result.data) {
      setProfile(result.data);
      await refreshUser();
    }
  }, [refreshUser]);

  const handleVideoUploadComplete = useCallback(async (asset: MediaAsset) => {
    logger.debug(`Intro video uploaded: ${asset.id}`);
    setIntroVideoId(asset.id);
    const result = await usersApi.updateProfile({ introVideoId: asset.id });
    if (result.data) {
      setProfile(result.data);
      setSuccess(t('edit.video_updated', 'Intro video updated'));
    }
  }, [t]);

  const handleVideoRemove = useCallback(async () => {
    setIntroVideoId(null);
    const result = await usersApi.updateProfile({ introVideoId: null });
    if (result.data) {
      setProfile(result.data);
    }
  }, []);

  const handleAlarmSoundUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    if (!ALLOWED_AUDIO_TYPES.includes(file.type)) {
      setError(t('edit.alarm_sound_error_format'));
      return;
    }

    // Validate size
    if (file.size > MAX_AUDIO_SIZE) {
      setError(t('edit.alarm_sound_error_size'));
      return;
    }

    setAlarmSoundUploading(true);
    setError(null);

    const result = await usersApi.uploadAlarmSound(file);

    if (result.error) {
      logger.error(`Failed to upload alarm sound: ${result.error}`);
      setError(t('edit.alarm_sound_error_upload'));
      setAlarmSoundUploading(false);
      return;
    }

    setHasAlarmSound(true);
    // Create a local preview URL for immediate playback
    setAlarmSoundPreviewUrl(URL.createObjectURL(file));
    setAlarmSoundUploading(false);
    setSuccess(t('edit.alarm_sound_updated'));
    await refreshUser();

    // Clear the file input so the same file can be re-uploaded
    if (alarmFileInputRef.current) alarmFileInputRef.current.value = '';
  }, [refreshUser, t]);

  const handleAlarmSoundRemove = useCallback(async () => {
    // Stop any playing preview
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current = null;
    }
    if (alarmSoundPreviewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(alarmSoundPreviewUrl);
    }

    await usersApi.deleteAlarmSound();
    setHasAlarmSound(false);
    setAlarmSoundPreviewUrl(null);
    setSuccess(t('edit.alarm_sound_removed'));
    await refreshUser();
  }, [alarmSoundPreviewUrl, refreshUser, t]);

  const handleAlarmSoundPlay = useCallback(() => {
    if (!alarmSoundPreviewUrl) return;
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
    }
    const audio = new Audio(alarmSoundPreviewUrl);
    alarmAudioRef.current = audio;
    audio.play();
  }, [alarmSoundPreviewUrl]);

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

  // Build existing asset refs for upload components
  const existingPhoto = profile.profilePhoto ? {
    id: profile.profilePhoto.id,
    url: profile.profilePhoto.url,
    thumbnailUrl: profile.profilePhoto.thumbnailUrl,
    status: profile.profilePhoto.status,
    durationSeconds: null,
  } : null;

  const existingVideo = profile.introVideo ? {
    id: profile.introVideo.id,
    url: profile.introVideo.url,
    thumbnailUrl: profile.introVideo.thumbnailUrl,
    status: profile.introVideo.status,
    durationSeconds: profile.introVideo.durationSeconds,
  } : null;

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
          {/* Profile Photo Section (Cloudflare) */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">{t('edit.profile_picture_label')}</h2>
            <ImageUpload
              context="profile"
              existingAsset={existingPhoto}
              existingUrl={profile.profilePicture}
              onUploadComplete={handlePhotoUploadComplete}
              onRemove={handlePhotoRemove}
            />
          </div>

          {/* Intro Video Section (Cloudflare) */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              {t('edit.intro_video_label', 'Introduction Video')}
            </h2>
            <p className="text-sm text-gray-500 mb-3">
              {t('edit.intro_video_help', 'A short video introducing yourself to other users')}
            </p>
            <VideoUpload
              context="step"
              existingAsset={existingVideo}
              onUploadComplete={handleVideoUploadComplete}
              onRemove={handleVideoRemove}
            />
          </div>

          {/* Alarm Sound Section */}
          <div className="mb-8 pb-8 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">{t('edit.alarm_sound_label')}</h2>
            <p className="text-sm text-gray-500 mb-4">{t('edit.alarm_sound_help')}</p>

            {hasAlarmSound ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm text-green-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  {t('edit.alarm_sound_custom')}
                </span>
                <button
                  type="button"
                  onClick={handleAlarmSoundPlay}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
                  style={{ minHeight: '44px' }}
                >
                  <span className="material-symbols-outlined text-base">play_arrow</span>
                </button>
                <label className="px-4 py-2 bg-accent-orange/10 hover:bg-accent-orange/20 text-accent-orange rounded-lg text-sm font-medium cursor-pointer transition-colors" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                  {t('edit.alarm_sound_change')}
                  <input
                    ref={alarmFileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAlarmSoundUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleAlarmSoundRemove}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors"
                  style={{ minHeight: '44px' }}
                >
                  {t('edit.alarm_sound_remove')}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">{t('edit.alarm_sound_default')}</span>
                <label className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${alarmSoundUploading ? 'bg-gray-100 text-gray-400 pointer-events-none' : 'bg-accent-orange text-white hover:bg-accent-orange/90'}`} style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
                  {alarmSoundUploading ? t('edit.alarm_sound_uploading') : t('edit.alarm_sound_upload')}
                  <input
                    ref={alarmFileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleAlarmSoundUpload}
                    disabled={alarmSoundUploading}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Profile Form */}
          <div className="space-y-6">
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

            {/* Measurement System */}
            <div>
              <label htmlFor="measurementSystem" className="block text-sm font-medium text-gray-700 mb-1">
                {t('edit.measurement_system_label')}
              </label>
              <select
                id="measurementSystem"
                {...register('measurementSystem')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
              >
                {measurementSystems.map((ms) => (
                  <option key={ms.value} value={ms.value}>
                    {ms.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Auto-save status */}
            <div className="flex justify-end items-center h-8">
              {saveStatus === 'saving' && (
                <span className="text-sm text-gray-400">{t('edit.saving')}</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm text-green-500">{t('edit.changes_saved', 'All changes saved')}</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm text-red-500">{t('edit.save_error', 'Error saving changes')}</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditProfilePage;
