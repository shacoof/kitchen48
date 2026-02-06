import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation('admin');
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary border-t border-slate-700/50 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            &copy; {currentYear} {t('footer.copyright')}
          </p>
          <p className="text-slate-500 text-sm">
            {t('footer.version')}
          </p>
        </div>
      </div>
    </footer>
  );
}
