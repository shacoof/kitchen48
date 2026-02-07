import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import EN translation files
import commonEn from './locales/en/common.json';
import authEn from './locales/en/auth.json';
import profileEn from './locales/en/profile.json';
import landingEn from './locales/en/landing.json';
import adminEn from './locales/en/admin.json';
import recipesEn from './locales/en/recipes.json';

// Import HE translation files
import commonHe from './locales/he/common.json';
import authHe from './locales/he/auth.json';
import profileHe from './locales/he/profile.json';
import landingHe from './locales/he/landing.json';
import adminHe from './locales/he/admin.json';
import recipesHe from './locales/he/recipes.json';

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: commonEn,
      auth: authEn,
      profile: profileEn,
      landing: landingEn,
      admin: adminEn,
      recipes: recipesEn,
    },
    he: {
      common: commonHe,
      auth: authHe,
      profile: profileHe,
      landing: landingHe,
      admin: adminHe,
      recipes: recipesHe,
    },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common', 'auth', 'profile', 'landing', 'admin', 'recipes'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
