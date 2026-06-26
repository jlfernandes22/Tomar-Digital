import React, { useState } from 'react';
import { Platform } from 'react-native';
import { FAB, Portal, Modal } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';
import { useLoadingState } from '@/context/LoadingContext';

const QrCodeFAB = () => {
  const insets = useSafeAreaInsets();
  const { currentTheme: theme } = useAppTheme();
  const segments = useSegments();

  const isInitializing = segments.length === 0;

  const isRootIndex =
    segments.length === 1 && segments[0] === '(accountCreation)';

  const isAuthFlow = segments[0] === '(accountCreation)';

  const isScanScreen = segments.includes('ScanScreen');

  const isCreateCampaign = segments.includes('CampaignCreate');

  const isAddBusiness = segments.includes('BusinessAdd');

  const isProfile = segments.includes('Profile');

  const { loadingQR } = useLoadingState();

  // If ANY of these are true, don't render the button
  if (
    isInitializing ||
    isRootIndex ||
    isAuthFlow ||
    isScanScreen ||
    isCreateCampaign ||
    isAddBusiness ||
    isProfile ||
    loadingQR
  ) {
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
          onPress={() => router.push('/components/ScanScreen')}
          color={theme.colors.onPrimary}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Ler fatura QR Code"
          accessibilityHint="Clica para abrir a câmara e ler o código QR da tua fatura"
        />
      </Portal>
    </>
  );
};

export default QrCodeFAB;
