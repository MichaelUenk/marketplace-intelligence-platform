import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enCommon from './locales/en/common.json';
import enDashboard from './locales/en/dashboard.json';
import enLeads from './locales/en/leads.json';
import enDeals from './locales/en/deals.json';
import enSignals from './locales/en/signals.json';
import enOutreach from './locales/en/outreach.json';
import enDeepWork from './locales/en/deepWork.json';

import nlCommon from './locales/nl/common.json';
import nlDashboard from './locales/nl/dashboard.json';
import nlLeads from './locales/nl/leads.json';
import nlDeals from './locales/nl/deals.json';
import nlSignals from './locales/nl/signals.json';
import nlOutreach from './locales/nl/outreach.json';
import nlDeepWork from './locales/nl/deepWork.json';

import deCommon from './locales/de/common.json';
import deDashboard from './locales/de/dashboard.json';
import deLeads from './locales/de/leads.json';
import deDeals from './locales/de/deals.json';
import deSignals from './locales/de/signals.json';
import deOutreach from './locales/de/outreach.json';
import deDeepWork from './locales/de/deepWork.json';

export const supportedLanguages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
] as const;

export type SupportedLanguage = typeof supportedLanguages[number]['code'];

const resources = {
  en: {
    common: enCommon,
    dashboard: enDashboard,
    leads: enLeads,
    deals: enDeals,
    signals: enSignals,
    outreach: enOutreach,
    deepWork: enDeepWork,
  },
  nl: {
    common: nlCommon,
    dashboard: nlDashboard,
    leads: nlLeads,
    deals: nlDeals,
    signals: nlSignals,
    outreach: nlOutreach,
    deepWork: nlDeepWork,
  },
  de: {
    common: deCommon,
    dashboard: deDashboard,
    leads: deLeads,
    deals: deDeals,
    signals: deSignals,
    outreach: deOutreach,
    deepWork: deDeepWork,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'dashboard', 'leads', 'deals', 'signals', 'outreach', 'deepWork'],

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for simpler setup
    },
  });

export default i18n;
