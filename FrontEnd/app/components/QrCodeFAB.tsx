import React from 'react';
import { Platform } from 'react-native';
import { FAB, Portal } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useSegments } from 'expo-router';

// Contexts
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';

/**
 * QrCodeFAB Component
 *
 * A global Floating Action Button (FAB) that allows users to quickly access the
 * invoice QR code scanner from anywhere in the app. It uses Expo Router's `useSegments`
 * to automatically hide itself on authentication screens, the scanner screen itself,
 * or during global loading states to prevent navigation overlaps.
 */
const QrCodeFAB = () => {
  // --- Hooks ---
  const insets = useSafeAreaInsets();
  const { currentTheme: theme } = useAppTheme();
  const segments = useSegments();
  const { loadingQR } = useLoadingState();

  // --- Derived State (Route Hiding Logic) ---
  // Determine if the FAB should be hidden based on the current navigation route.
  const isAuthFlow = segments[0] === '(accountCreation)';
  const isScanScreen = segments.includes('ScanScreen');
  const isCreateCampaign = segments.includes('CampaignCreate');
  const isAddBusiness = segments.includes('BusinessAdd');
  const isProfile =
    segments.includes('Profile') ||
    segments.includes('ProfileEdit') ||
    segments.includes('Preferences');
  const isValidatePack = segments.includes('ValidatePack');
  const isMyPurchases = segments.includes('MyPurchases');
  const isBusinessDetails = segments.includes('BusinessDetails');
  const isViewCampaign =
    segments.includes('CampaignList') ||
    segments.includes('CampaignListMerchant') ||
    segments.includes('CampaignIndex') ||
    segments.includes('CampaignCandidates');
  const isJoinCampaign =
    segments.includes('CampaignMerchant') ||
    segments.includes('CampaignMerchantJoin');
  const isAboutApp = segments.includes('AppAbout');
  const isMerchantsCandidates = segments.includes('MerchantsCandidates');
  const isBusinessCandidates = segments.includes('BusinessCandidates');

  // Hide the FAB on auth screens, specific full-screen forms, the scanner itself,
  // or if a global loading state is active to prevent navigation overlaps.
  const shouldHideFAB =
    isAuthFlow ||
    isScanScreen ||
    isCreateCampaign ||
    isAddBusiness ||
    isProfile ||
    loadingQR ||
    isValidatePack ||
    isMyPurchases ||
    isBusinessDetails ||
    isViewCampaign ||
    isAboutApp ||
    isJoinCampaign ||
    isMerchantsCandidates ||
    isBusinessCandidates;

  // --- Early Return ---
  if (shouldHideFAB) {
    return null;
  }

  // --- Render ---
  return (
    <Portal>
      {/* 
        Portal ensures the FAB renders at the absolute root level of the app, 
        preventing it from being clipped or constrained by parent view hierarchies.
      */}
      <FAB
        icon="qrcode-scan"
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          // Platform-specific positioning:
          // iOS tab bars are generally taller, requiring a larger hardcoded offset (90).
          // Android relies on the safe area insets to clear the gesture navigation bar.
          bottom: Platform.OS === 'ios' ? 90 : 80 + insets.bottom,
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
  );
};

export default QrCodeFAB;
