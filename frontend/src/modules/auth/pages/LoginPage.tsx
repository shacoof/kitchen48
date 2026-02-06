/**
 * Login Page
 * User login page with form and social login options
 */

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LoginForm } from '../components/LoginForm';
import { SocialLoginButtons } from '../components/SocialLoginButtons';
import { authApi } from '../services/auth.api';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resendStatus, setResendStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Check for OAuth error
  const oauthError = searchParams.get('error');

  const handleSuccess = () => {
    // Navigate to home or dashboard after successful login
    navigate('/');
  };

  const handleResendVerification = async (email: string) => {
    const response = await authApi.resendVerification(email);

    if (response.success) {
      setResendStatus({
        type: 'success',
        message: t('login.verification_sent'),
      });
    } else {
      setResendStatus({
        type: 'error',
        message: response.error || t('login.verification_failed'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">Kitchen48</h1>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          {t('login.title')}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {t('login.no_account')}{' '}
          <Link to="/register" className="text-orange-600 hover:text-orange-500 font-medium">
            {t('login.create_one')}
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {oauthError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {oauthError === 'oauth_failed'
                ? t('login.oauth_failed')
                : oauthError}
            </div>
          )}

          {resendStatus && (
            <div
              className={`mb-4 p-3 rounded text-sm ${
                resendStatus.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
            >
              {resendStatus.message}
            </div>
          )}

          <SocialLoginButtons mode="login" />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">{t('login.social_divider')}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <LoginForm onSuccess={handleSuccess} onResendVerification={handleResendVerification} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
