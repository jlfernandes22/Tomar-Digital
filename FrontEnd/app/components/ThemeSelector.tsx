import { StyleSheet } from 'react-native';
import React from 'react';
import { SegmentedButtons, Surface, Text } from 'react-native-paper';
import { ModeType, PaletteType, useAppTheme } from '@/context/ThemeContext';

const ThemeSelector = () => {
  const {
    currentTheme: theme,
    userMode,
    setUserMode,
    userPalette,
    setUserPalette,
  } = useAppTheme();
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
        Aparência da Aplicação
      </Text>

      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        Modo de Visualização
      </Text>
      <SegmentedButtons
        value={userMode}
        onValueChange={value => setUserMode(value as ModeType)}
        buttons={[
          { value: 'system', label: 'Auto' },
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Escuro' },
        ]}
        style={{ marginBottom: 24 }}
      />

      <Text
        variant="labelLarge"
        style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
      >
        Paleta de Cores
      </Text>
      <SegmentedButtons
        value={userPalette}
        onValueChange={value => setUserPalette(value as PaletteType)}
        buttons={[
          { value: 'convento', label: 'Convento' },
          { value: 'mata', label: 'Mata' },
          { value: 'tabuleiros', label: 'Tabuleiros' },
        ]}
        style={{ marginBottom: 24 }}
      />
    </Surface>
  );
};

export default ThemeSelector;

const styles = StyleSheet.create({});
