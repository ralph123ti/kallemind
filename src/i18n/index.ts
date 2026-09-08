import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import pt from './locales/pt.json';
import ar from './locales/ar.json';
import zh from './locales/zh.json';
import ru from './locales/ru.json';
import hi from './locales/hi.json';
import sw from './locales/sw.json';
import sn from './locales/sn.json';
import nd from './locales/nd.json';

export const resources = {
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  pt: { translation: pt },
  ar: { translation: ar },
  zh: { translation: zh },
  ru: { translation: ru },
  hi: { translation: hi },
  sw: { translation: sw },
  sn: { translation: sn },
  nd: { translation: nd },
};

const LANGUAGE_STORAGE_KEY = '@app_language';

export const initI18n = async () => {
  const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
  const deviceLang = Localization.getLocales()[0]?.languageCode ?? 'en';
  const lang = saved || (resources[deviceLang as keyof typeof resources] ? deviceLang : 'en');

  await i18n.use(initReactI18next).init({
    resources,
    lng: lang,
    fallbackLng: 'en',
    compatibilityJSON: 'v4',
    interpolation: { escapeValue: false },
  });
};

// Call this from your language-picker screen whenever the user changes language.
// It updates i18next immediately (re-renders every screen using useTranslation)
// AND persists the choice so it's remembered on next app launch.
export const changeLanguage = async (lang: keyof typeof resources) => {
  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
};

export default i18n;
