import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import pt from './locales/pt.json';

export const LANGUAGE_KEY = '@app_language';

const resources = {
  en: { translation: en },
  pt: { translation: pt }
};

export const initI18n = async () => {
  try {
    let savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);

    if (!savedLanguage) {
      const systemLocales = Localization.getLocales();
      const systemLanguage = systemLocales[0]?.languageCode;
      
      savedLanguage = systemLanguage === 'pt' ? 'pt' : 'en';
    }

    await i18n
      .use(initReactI18next)
      .init({
        compatibilityJSON: 'v3',
        resources,
        lng: savedLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false 
        }
      });
  } catch (error) {
    console.error('Error initializing i18n:', error);
  }
};

export default i18n;
