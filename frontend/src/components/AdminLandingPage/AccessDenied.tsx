import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function AccessDenied() {
  const { t } = useTranslation('admin');
  const { logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-400 text-4xl">block</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">{t('access_denied.title')}</h1>
        <p className="text-slate-400 mb-8">
          {t('access_denied.message')}
        </p>
        <button
          onClick={logout}
          className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg font-medium transition-all"
        >
          {t('access_denied.sign_out')}
        </button>
      </div>
    </div>
  );
}
