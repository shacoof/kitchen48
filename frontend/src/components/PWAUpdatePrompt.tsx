import { useRegisterSW } from 'virtual:pwa-register/react';
import { useTranslation } from 'react-i18next';

export default function PWAUpdatePrompt() {
  const { t } = useTranslation('common');

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg bg-slate-800 p-4 text-white shadow-lg">
      <p className="mb-3 text-sm">{t('pwa.updateAvailable')}</p>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded px-3 py-1.5 text-sm text-slate-300 hover:text-white"
        >
          {t('pwa.dismiss')}
        </button>
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600"
        >
          {t('pwa.updateNow')}
        </button>
      </div>
    </div>
  );
}
