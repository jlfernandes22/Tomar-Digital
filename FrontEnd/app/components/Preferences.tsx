/**
 * Preferences Screen
 *
 * Allows users to customize app-wide settings, including visual themes
 * (handled by the ThemeSelector component) and language preferences.
 * Language changes are persisted to AsyncStorage so they remain active across app restarts.
 */

import React from 'react';
import {
  Appbar,
  Divider,
  SegmentedButtons,
  Surface,
  Text,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';

// Contexts & Config
import { useAppTheme } from '@/context/ThemeContext';
import { LANGUAGE_KEY } from '../../i18n';

// Components
import ThemeSelector from './ThemeSelector';

const Preferences = () => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();
  const { i18n, t } = useTranslation();

  // --- Handlers ---

  /**
   * Changes the app's language and persists the choice to AsyncStorage.
   * 1. Updates the i18n instance (triggers an immediate re-render of all translated text).
   * 2. Saves the selection to AsyncStorage so it can be loaded on the next app launch.
   */
  const handleLanguageChange = async (value: string) => {
    await i18n.changeLanguage(value);
    await AsyncStorage.setItem(LANGUAGE_KEY, value);
  };

  // --- Render ---
  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('common.back_btn', { defaultValue: 'Voltar' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Hides the default Expo Router header to use our custom Appbar instead */}
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView
          className="p-4"
          style={{ flex: 1 }}
          edges={['left', 'right']}
        >
          {/* Screen Header */}
          <Text
            variant="headlineMedium"
            style={{
              color: theme.colors.primary,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            {t('preferences.title', { defaultValue: 'Preferências' })}
          </Text>

          <Divider
            style={{
              backgroundColor: theme.colors.outlineVariant,
              marginBottom: 16,
            }}
          />

          {/* Theme Selection (Mode + Palette) */}
          <ThemeSelector />

          {/* Language Selection */}
          <Text
            variant="titleMedium"
            style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 10 }}
          >
            {t('common.language') || 'Idioma da Aplicação'}
          </Text>
          <SegmentedButtons
            value={i18n.language}
            onValueChange={handleLanguageChange}
            buttons={[
              {
                value: 'pt',
                label: `🇵🇹 ${t('preferences.lang_pt', { defaultValue: 'Português' })}`,
              },
              {
                value: 'en',
                label: `🇬🇧 ${t('preferences.lang_en', { defaultValue: 'English' })}`,
              },
            ]}
            style={{ marginBottom: 16 }}
          />
        </SafeAreaView>
      </Surface>
    </>
  );
};

export default Preferences;
