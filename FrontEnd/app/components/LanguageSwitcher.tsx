import React from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_KEY } from '../../i18n';
import CustomButton from './CustomButton';
import { useAppTheme } from '@/context/ThemeContext';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  const toggleLanguage = async () => {
    const newLang = i18n.language === 'pt' ? 'en' : 'pt';
    await i18n.changeLanguage(newLang);
    await AsyncStorage.setItem(LANGUAGE_KEY, newLang);
  };

  return (
    <CustomButton
      onPress={toggleLanguage}
      buttonColor={theme.colors.secondaryContainer}
      textColor={theme.colors.onSecondaryContainer}
      style={{ alignSelf: 'flex-end', margin: 8 }}
      accessibilityLabel={`Mudar idioma para ${i18n.language === 'pt' ? 'Inglês' : 'Português'}`}
    >
      {i18n.language === 'pt' ? '🇬🇧 EN' : '🇵🇹 PT'}
    </CustomButton>
  );
};

export default LanguageSwitcher;
