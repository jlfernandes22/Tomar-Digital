import React from 'react';
import { View } from 'react-native';
import {
  Appbar,
  Divider,
  SegmentedButtons,
  Surface,
  Text,
} from 'react-native-paper';
import { ModeType, PaletteType, useAppTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import ThemeSelector from './ThemeSelector';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGE_KEY } from '../../i18n';
import { useTranslation } from 'react-i18next';

const Preferences = () => {
  const { currentTheme: theme } = useAppTheme();
  const { i18n, t } = useTranslation();

  const handleLanguageChange = async (value: string) => {
    await i18n.changeLanguage(value);
    await AsyncStorage.setItem(LANGUAGE_KEY, value);
  };

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
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView
          className="p-4"
          style={{ flex: 1 }}
          edges={['left', 'right']}
        >
          {/* Header Elegante */}

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

          <ThemeSelector></ThemeSelector>

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
