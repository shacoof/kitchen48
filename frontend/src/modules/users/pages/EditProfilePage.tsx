/**
 * EditProfilePage
 * Edit own profile page at /profile/edit
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../../../context/AuthContext';
import { ProfilePictureUpload } from '../components/ProfilePictureUpload';
import { usersApi, FullUserProfile } from '../services/users.api';
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
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function EditProfilePage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading, refreshUser } = useAuth();
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
        setError('Failed to load profile');
      } else if (result.data) {
        setProfile(result.data);
        // Reset form with fetched data
        reset({
          nickname: result.data.nickname || '',
          firstName: result.data.firstName || '',
          lastName: result.data.lastName || '',
          description: result.data.description || '',
        });
      }

      setLoading(false);
    };

    fetchProfile();
  }, [isAuthenticated, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const result = await usersApi.updateProfile({
      nickname: data.nickname || undefined,
      firstName: data.firstName,
      lastName: data.lastName,
      description: data.description || null,
    });

    if (result.error) {
      logger.error(`Failed to update profile: ${result.error}`);
      setError(result.error);
    } else if (result.data) {
      setProfile(result.data);
      setSuccess('Profile updated successfully!');
      // Refresh auth context to update header
      await refreshUser();
      // Reset form with new data
      reset({
        nickname: result.data.nickname || '',
        firstName: result.data.firstName || '',
        lastName: result.data.lastName || '',
        description: result.data.description || '',
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
    setSuccess('Profile picture updated!');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background-light flex items-center justify-center">
        <div className="text-red-500">{error || 'Failed to load profile'}</div>
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
                View Profile
              </Link>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto py-12 px-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Edit Profile</h1>

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
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Profile Picture</h2>
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
                Nickname
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-2">kitchen48.com/</span>
                <input
                  id="nickname"
                  type="text"
                  {...register('nickname')}
                  placeholder="jsmith"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent"
                />
              </div>
              {errors.nickname && (
                <p className="mt-1 text-sm text-red-500">{errors.nickname.message}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                3-30 characters. Lowercase letters, numbers, and underscores only.
              </p>
            </div>

            {/* First Name */}
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                First Name
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
                Last Name
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
                About Me
              </label>
              <textarea
                id="description"
                {...register('description')}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-orange focus:border-transparent resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <Link
                to="/"
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || !isDirty}
                className="px-6 py-2 bg-accent-orange text-white rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default EditProfilePage;
