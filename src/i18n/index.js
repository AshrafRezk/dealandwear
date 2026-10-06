import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['en'];
const RTL = new Set(['ar', 'he', 'fa', 'ur']);

function initialLanguage() {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('fyf.lang') : null;
  if (saved && SUPPORTED_LANGUAGES.includes(saved)) return saved;
  const browser = (typeof navigator !== 'undefined' ? navigator.language : 'en').slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(browser) ? browser : 'en';
}

function applyDocumentLanguage(lng) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL.has(lng) ? 'rtl' : 'ltr';
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
});

applyDocumentLanguage(i18n.language);
i18n.on('languageChanged', (lng) => {
  applyDocumentLanguage(lng);
  try {
    localStorage.setItem('fyf.lang', lng);
  } catch {
    /* storage unavailable */
  }
});

export default i18n;
