import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';

import enCommon from '../locales/en/common.json';
import heCommon from '../locales/he/common.json';

const deviceLang = getLocales()[0]?.languageCode ?? 'en';
const initialLang = deviceLang === 'he' ? 'he' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { common: enCommon },
    he: { common: heCommon },
  },
  lng: initialLang,
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
});

export default i18n;
