/**
 * Auth Callback Page
 * Handles OAuth callback with token
 */

import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { authApi } from '../services/auth.api';
import { useAuth } from '../hooks/useAuth';

export function AuthCallbackPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      // Store the token
      authApi.setToken(token);
      // Refresh user data
      refreshUser().then(() => {
        navigate('/');
      });
    } else {
      // No token, redirect to login with error
      navigate('/login?error=oauth_failed');
    }
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">{t('callback.completing')}</p>
        </div>
      </div>
    </div>
  );
}

export default AuthCallbackPage;
