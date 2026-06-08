import { StyleSheet } from 'react-native';
import React from 'react';
import { SegmentedButtons, Surface, Text } from 'react-native-paper';
import { ModeType, PaletteType, useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeSelector = () => {
  const {
    currentTheme: theme,
    userMode,
    setUserMode,
    userPalette,
    setUserPalette,
  } = useAppTheme();
  const { t } = useTranslation();
  return (
    <Surface
      style={{
        backgroundColor: theme.colors.surface,
        padding: 24,
        borderRadius: 16,
        borderWidth: 5,
        borderColor: theme.colors.outline,
      }}
    >
      <Text
        variant="titleLarge"
        style={{ color: theme.colors.onSurface, marginBottom: 16 }}
      >
        {t('theme.appearance_title', { defaultValue: 'Aparência da Aplicação' })}
      </Text>

      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        {t('theme.view_mode', { defaultValue: 'Modo de Visualização' })}
      </Text>
      <SegmentedButtons
        value={userMode}
        onValueChange={value => setUserMode(value as ModeType)}
        buttons={[
          { value: 'system', label: t('theme.mode_auto', { defaultValue: 'Auto' }) },
          { value: 'light', label: t('theme.mode_light', { defaultValue: 'Claro' }) },
          { value: 'dark', label: t('theme.mode_dark', { defaultValue: 'Escuro' }) },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        {t('theme.color_palette', { defaultValue: 'Paleta de Cores' })}
      </Text>
      <SegmentedButtons
        value={userPalette}
        onValueChange={value => setUserPalette(value as PaletteType)}
        buttons={[
          { value: 'convento', label: t('theme.palette_convento', { defaultValue: 'Convento' }) },
          { value: 'mata', label: t('theme.palette_mata', { defaultValue: 'Mata' }) },
          { value: 'tabuleiros', label: t('theme.palette_tabuleiros', { defaultValue: 'Tabuleiros' }) },
        ]}
        style={{ marginBottom: 24 }}
      />
    </Surface>
  );
};

export default ThemeSelector;

const styles = StyleSheet.create({});
