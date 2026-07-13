import React from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Contexts & Constants
import { useAppTheme } from '@/context/ThemeContext';
import { LANGUAGE_KEY } from '../../i18n';

// Components
import CustomButton from './CustomButton';

/**
 * LanguageSwitcher Component
 *
 * A simple toggle button that allows users to switch the app's language
 * between Portuguese ('pt') and English ('en').
 * It updates the i18n instance for immediate UI translation and persists
 * the choice to AsyncStorage for future app launches.
 */
const LanguageSwitcher = () => {
  // --- Hooks ---
  // useTranslation provides the current language instance and translation functions
  const { i18n } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Handlers ---

  /**
   * Toggles the active language between 'pt' and 'en'.
   * 1. Determines the opposite language.
   * 2. Updates the i18n instance (triggers a re-render of translated text).
   * 3. Saves the preference to AsyncStorage so it persists across app restarts.
   */
  const toggleLanguage = async () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
  };

  // --- Render ---
  return (
    <CustomButton
      onPress={toggleLanguage}
      buttonColor={theme.colors.secondaryContainer}
      textColor={theme.colors.onSecondaryContainer}
      style={{ alignSelf: 'flex-end', margin: 8 }}
      accessibilityLabel={`Mudar idioma para ${i18n.language === 'pt' ? 'Inglês' : 'Português'}`}
    >
      {/*
       * Display logic: Shows the language the user can switch *to*.
       * If the app is currently in Portuguese, the button shows the English option.
       */}
      {i18n.language === 'pt' ? '🇬🇧 EN' : '🇵🇹 PT'}
    </CustomButton>
  );
};

export default LanguageSwitcher;
