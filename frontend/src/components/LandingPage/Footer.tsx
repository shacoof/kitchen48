import { useTranslation } from 'react-i18next'

export default function Footer() {
  const { t } = useTranslation('landing')

  return (
    <footer className="bg-primary pt-20 pb-10 border-t border-slate-700/50 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                alt="Kitchen48"
                className="h-10 w-auto"
                src="/kitchen48-logo-tight.jpg"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">{t('footer.platform')}</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent-orange" href="#">{t('footer.browse_recipes')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.pro_subscriptions')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.cooking_classes')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.chef_partnerships')}</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">{t('footer.support')}</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent-orange" href="#">{t('footer.help_center')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.kitchen_gear')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.privacy_policy')}</a></li>
              <li><a className="hover:text-accent-orange" href="#">{t('footer.terms_of_service')}</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">{t('footer.mobile_app')}</h5>
            <p className="text-slate-400 text-sm mb-6">
              {t('footer.mobile_description')}
            </p>
            <div className="space-y-3">
              <button className="w-full bg-slate-800 text-white p-3 rounded-lg flex items-center gap-3 hover:bg-slate-700 transition-all border border-slate-700">
                <span className="material-symbols-outlined">android</span>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold leading-none">{t('footer.get_it_on')}</p>
                  <p className="text-sm font-bold">{t('footer.google_play')}</p>
                </div>
              </button>
              <button className="w-full bg-slate-800 text-white p-3 rounded-lg flex items-center gap-3 hover:bg-slate-700 transition-all border border-slate-700">
                <span className="material-symbols-outlined">phone_iphone</span>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold leading-none">{t('footer.download_on')}</p>
                  <p className="text-sm font-bold">{t('footer.app_store')}</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} {t('footer.copyright')}
        </div>
      </div>
    </footer>
  )
}
