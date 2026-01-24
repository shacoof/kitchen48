/**
 * Register Page
 * User registration page with form and social login options
 */

import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/RegisterForm';
import { SocialLoginButtons } from '../components/SocialLoginButtons';

export function RegisterPage() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // Form shows success message, no navigation needed
    // User needs to verify email before logging in
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900">Kitchen48</h1>
        <h2 className="mt-6 text-center text-2xl font-semibold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-orange-600 hover:text-orange-500 font-medium">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SocialLoginButtons mode="register" />

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or register with email</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <RegisterForm onSuccess={handleSuccess} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
