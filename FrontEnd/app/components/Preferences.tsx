import React from 'react';
import { View } from 'react-native';
import { Divider, SegmentedButtons, Surface, Text } from 'react-native-paper';
import { ModeType, PaletteType, useAppTheme } from '@/context/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import ThemeSelector from './ThemeSelector';

const Preferences = () => {
  const { currentTheme: theme } = useAppTheme();

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView
        className="p-4"
        style={{ flex: 1 }}
        edges={['top', 'left', 'right']}
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
          Preferências
        </Text>

        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        <ThemeSelector></ThemeSelector>
      </SafeAreaView>
    </Surface>
  );
};

export default Preferences;
