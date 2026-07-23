import React from 'react';
import { SegmentedButtons, Surface, Text } from 'react-native-paper';
import { ModeType, PaletteType, useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

/**
 * ThemeSelector Component
 *
 * A UI control that allows users to change the app's visual theme.
 * It interacts directly with the ThemeContext to update the color palette
 * (Convento, Mata, Tabuleiros) and the display mode (Light, Dark, System).
 * Because it updates the global context, the entire app re-renders instantly
 * with the new theme when a selection is made.
 */
const ThemeSelector = () => {
  // --- Hooks ---
  // Destructure both the current theme settings and their setter functions from the context
  const {
    currentTheme: theme,
    userMode,
    setUserMode,
    userPalette,
    setUserPalette,
  } = useAppTheme();

  const { t } = useTranslation();

  // --- Render ---
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
        {t('theme.appearance_title', {
          defaultValue: 'Aparência da Aplicação',
        })}
      </Text>

      {/* Display Mode Selection (Auto, Light, Dark) */}
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        {t('theme.view_mode', { defaultValue: 'Modo de Visualização' })}
      </Text>
      <SegmentedButtons
        value={userMode}
        // Cast the string value to the specific ModeType expected by the context
        onValueChange={value => setUserMode(value as ModeType)}
        buttons={[
          {
            value: 'system',
            label: t('theme.mode_auto', { defaultValue: 'Auto' }),
          },
          {
            value: 'light',
            label: t('theme.mode_light', { defaultValue: 'Claro' }),
          },
          {
            value: 'dark',
            label: t('theme.mode_dark', { defaultValue: 'Escuro' }),
          },
        ]}
        style={{ marginBottom: 24 }}
      />

      {/* Color Palette Selection (Convento, Mata, Tabuleiros) */}
      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        {t('theme.color_palette', { defaultValue: 'Paleta de Cores' })}
      </Text>
      <SegmentedButtons
        value={userPalette}
        // Cast the string value to the specific PaletteType expected by the context
        onValueChange={value => setUserPalette(value as PaletteType)}
        buttons={[
          {
            value: 'convento',
            label: t('theme.palette_convento', { defaultValue: 'Convento' }),
          },
          {
            value: 'mata',
            label: t('theme.palette_mata', { defaultValue: 'Mata' }),
          },
          {
            value: 'tabuleiros',
            label: t('theme.palette_tabuleiros', {
              defaultValue: 'Tabuleiros',
            }),
          },
        ]}
        style={{ marginBottom: 24 }}
      />
    </Surface>
  );
};

export default ThemeSelector;
