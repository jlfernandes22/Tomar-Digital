import React, { useState } from 'react';
import { Platform } from 'react-native';
import { FAB, Portal, Modal } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';

const QrCodeFAB = () => {
  const insets = useSafeAreaInsets();
  const { currentTheme: theme } = useAppTheme();
  const segments = useSegments();

  const isInitializing = segments.length === 0;

  const isRootIndex =
    segments.length === 1 && segments[0] === '(accountCreation)';

  const isAuthFlow = segments[0] === '(accountCreation)';

  const isScanScreen = segments.includes('ScanScreen');

  // If ANY of these are true, don't render the button
  if (isInitializing || isRootIndex || isAuthFlow || isScanScreen) {
    return null;
  }

  return (
    <>
      <Portal>
        {/* Botão flutuante fixado no canto inferior direito do ecrã */}
        <FAB
          icon="qrcode-scan"
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: Platform.OS == 'ios' ? 90 : 80 + insets.bottom,
            backgroundColor: theme.colors.primary,
          }}
          onPress={() => router.push('/(tabs)/ScanScreen')}
          color={theme.colors.onPrimary}
        />
      </Portal>
    </>
  );
};

export default QrCodeFAB;
