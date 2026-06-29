/**
 * ScanScreen Component
 *
 * This screen handles the camera workflow for scanning invoice QR codes.
 * It manages camera permissions, terms of service acceptance, photo capture,
 * and communication with the backend to process the invoice and award points.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { router, Stack } from 'expo-router';
import { delay } from '../../utils/delay';
import CustomSnackBar from './CustomSnackBar';
import CustomDialog from './CustomDialog';
import {
  Checkbox,
  Dialog,
  Portal,
  Button,
  Text,
  Appbar,
} from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useLoadingState } from '@/context/LoadingContext';
import LoadingScreen from './LoadingScreen';

export default function ScanScreen() {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user, updateUser } = useAuth();

  // Hook provided by expo-camera to manage OS-level camera permissions.
  // `permission` holds the status, `requestPermission` triggers the OS dialog.
  const [permission, requestPermission] = useCameraPermissions();

  // Syncs local loading state with global context to hide the global FAB during processing.
  const { loadingQR, setLoadingQR } = useLoadingState();

  // `loading` controls the full-screen processing indicator after taking a photo.
  // `photoLoading` specifically disables the capture button to prevent double-taps.
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);

  // Manages the user's consent to the invoice processing terms.
  // Initialized from AuthContext in case the user has already accepted them previously.
  const [acceptedTerms, setAcceptedTerms] = useState(
    user?.acceptedInvoiceTerms || false,
  );
  const [termsDialogVisible, setTermsDialogVisible] = useState(false);

  // Ref used as a mutation flag to prevent multiple concurrent API calls
  // if the user rapidly taps the capture button. Refs don't trigger re-renders.
  const isProcessing = useRef(false);
  const cameraRef = useRef<any>(null);
  const qrTimeoutRef = useRef<any>(null);

  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // =========================================================
  // USE EFFECTS
  // =========================================================

  // Keeps local terms state synchronized if the AuthContext updates externally.
  useEffect(() => {
    setAcceptedTerms(user?.acceptedInvoiceTerms || false);
  }, [user?.acceptedInvoiceTerms]);

  // Triggers the OS permission prompt as soon as the component mounts.
  useEffect(() => {
    requestPermission();
  }, []);

  // Cleanup function: Clears the QR code debounce timer when the component unmounts
  // to prevent memory leaks or state updates on an unmounted component.
  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  // Propagates the local loading state to the global LoadingContext.
  // This ensures the global QrCodeFAB knows when to hide/show itself.
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading]);

  // =========================================================
  // EARLY RETURNS (Permission Handling)
  // =========================================================

  // 1. Permission status is still being determined by the OS.
  if (!permission) {
    return <View />;
  }

  // 2. Permission has been denied. Provide UI to request again or open settings.
  if (!permission.granted) {
    const handlePermissionPress = () => {
      if (permission.canAskAgain) {
        // We can still show the standard OS prompt.
        requestPermission();
      } else {
        // The user selected "Don't ask again". We must send them to the app settings.
        Linking.openSettings();
      }
    };

    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View
          className="flex-1 items-center justify-center p-6"
          style={{ backgroundColor: theme.colors.background }}
        >
          <Text className="mb-4 text-center">
            {t('scan.camera_permission_reason')}
          </Text>
          <TouchableOpacity
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('scan.give_permission_title')}
            accessibilityHint={t('accessibility.allow_camera')}
            onPress={handlePermissionPress}
            className="rounded-xl p-4"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text
              className="font-bold"
              style={{ color: theme.colors.onPrimary }}
            >
              {permission.canAskAgain
                ? t('scan.give_permission_btn')
                : t('scan.open_settings_btn', {
                    defaultValue: 'Abrir Definições',
                  })}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // =========================================================
  // CORE LOGIC & HANDLERS
  // =========================================================

  /**
   * Handles the barcode scanning event.
   * Implements a debounce mechanism (1.5s) to prevent the scanner from
   * firing multiple times for the same QR code while the camera view is active.
   */
  const handleBarcodeScanned = ({ type, data }: any) => {
    if (isProcessing.current) return;
    setScannedQr(data);

    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    qrTimeoutRef.current = setTimeout(() => {
      setScannedQr(null);
    }, 1500);
  };

  /**
   * Handles the acceptance/revocation of terms.
   * Sends the update to the backend. On failure, reverts the local UI state
   * to match the server state to keep data consistent.
   */
  const handleConfirmTerms = async () => {
    setTermsDialogVisible(false);

    if (acceptedTerms !== user?.acceptedInvoiceTerms) {
      try {
        const response = await fetch(`${API_URL}/aceitarTermosFatura`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ acceptedInvoiceTerms: acceptedTerms }),
        });

        const result = await response.json();

        if (response.ok) {
          // Update global auth state so other screens know terms were accepted.
          updateUser({ acceptedInvoiceTerms: acceptedTerms });
          setSnackbarMessage(
            acceptedTerms
              ? t('scan.terms_accepted_msg')
              : t('scan.terms_revoked_msg'),
          );
          setSnackbarVisible(true);
        } else {
          // Revert local checkbox state on failure
          setAcceptedTerms(user?.acceptedInvoiceTerms || false);
          setDialogTitle(t('common.error'));
          setDialogText(
            `${t('scan.error_terms_update')}${result.message || t('common.error')}`,
          );
          setDialogVisible(true);
        }
      } catch (error) {
        console.error('Erro ao atualizar termos no servidor:', error);
        setAcceptedTerms(user?.acceptedInvoiceTerms || false);
        setDialogTitle(t('common.error'));
        setDialogText(t('scan.error_comm_server'));
        setDialogVisible(true);
      }
    }
  };

  /**
   * Main handler for capturing the photo and sending data to the backend.
   * Uses FormData to send the image file alongside the scanned QR string.
   */
  const handleTakeAndSend = async () => {
    // Guard against double-processing
    if (isProcessing.current) return;

    // Enforce terms acceptance before allowing a scan
    if (!acceptedTerms) {
      setTermsDialogVisible(true);
      return;
    }

    isProcessing.current = true;
    setPhotoLoading(true);

    try {
      if (!cameraRef.current) {
        throw new Error('Câmara não inicializada.');
      }

      // Capture the photo. `skipProcessing: false` ensures EXIF data is handled.
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Falha ao capturar a imagem da fatura.');
      }

      // Construct multipart/form-data for file upload
      const formData = new FormData();
      formData.append('ReceiptImage', {
        uri: photo.uri,
        type: 'image/jpeg', // Standardize mime type
        name: 'fatura.jpg',
      } as any);
      formData.append('QRCodeData', scannedQr || '');

      const response = await fetch(`${API_URL}/lerFatura`, {
        method: 'POST',
        headers: {
          // Note: Do not set 'Content-Type' manually here.
          // React Native fetch sets it automatically including the boundary token.
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      // Handle Rate Limiting
      if (response.status === 429) {
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        setPhotoLoading(false);
        isProcessing.current = false; // Allow retrying later
        return;
      }

      const result = await response.json();

      if (response.ok) {
        // Update user's point balance in global state
        updateUser({ Points: result.saldoAtual ?? result.novoSaldoTotal });

        setSnackbarMessage(
          t('scan.success_earned', {
            pontos: result.pontosGanhos,
            saldo: result.saldoAtual,
          }),
        );
        setSnackbarVisible(true);

        // Brief delay so user can see the success snackbar before navigating
        await delay(1500);
        router.replace('/(tabs)/Home');
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(
          t('scan.error_validation', {
            msg: result.message || result.erro || t('common.error'),
          }),
        );
        setDialogVisible(true);
        isProcessing.current = false;
      }
    } catch (error: any) {
      console.error(error);
      setDialogTitle(t('common.error'));
      setDialogText(
        t('scan.error_validation', {
          msg: error.message || t('scan.error_connection'),
        }),
      );
      setDialogVisible(true);
      isProcessing.current = false;
    } finally {
      setPhotoLoading(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  // Show full-screen loading overlay while the API request is in flight.
  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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

      <View
        className="flex-1"
        style={{ backgroundColor: theme.colors.background }}
      >
        {/* The camera view fills the entire background */}
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Overlay UI Container */}
        <View className="flex-1 justify-between">
          {/* Top: Instructions Banner */}
          <View
            className="mx-4 mt-14 rounded-2xl p-4"
            style={{ backgroundColor: theme.colors.background }}
          >
            <Text className="text-center text-sm font-semibold leading-5 text-white">
              {t('scan.instruction')}
            </Text>
          </View>

          {/* Center: Scanning Frame Indicator */}
          <View className="flex-1 p-8">
            <View
              className={`flex-1 rounded-3xl border-4 ${
                scannedQr
                  ? 'border-solid opacity-80'
                  : 'border-dashed opacity-40'
              }`}
              style={{
                borderColor: scannedQr ? theme.colors.primary : '#ffffff',
              }}
            />
          </View>

          {/* Bottom: Control Panel */}
          <View
            className="items-center rounded-t-3xl px-6 py-8"
            style={{ backgroundColor: theme.colors.background }}
          >
            {/* Terms & Conditions Toggle Link */}
            <TouchableOpacity
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={
                acceptedTerms
                  ? t('scan.terms_accepted')
                  : t('scan.terms_read_accept')
              }
              accessibilityHint={t('accessibility.open_terms')}
              onPress={() => setTermsDialogVisible(true)}
              className="mb-6"
            >
              <Text className="text-s text-sm underline">
                {acceptedTerms
                  ? t('scan.terms_accepted')
                  : t('scan.terms_read_accept')}
              </Text>
            </TouchableOpacity>

            {/* Camera Shutter Button */}
            <View className="items-center justify-center">
              <TouchableOpacity
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('scan.take_photo_title')}
                accessibilityHint={t('accessibility.take_photo')}
                onPress={handleTakeAndSend}
                disabled={!acceptedTerms || photoLoading}
                className="h-20 w-20 items-center justify-center rounded-full"
                style={{
                  backgroundColor:
                    acceptedTerms && !photoLoading
                      ? theme.colors.primary
                      : 'rgba(255, 255, 255, 0.2)',
                  borderWidth: 4,
                  borderColor: theme.colors.primaryContainer,
                }}
              >
                {photoLoading ? (
                  <ActivityIndicator
                    color={theme.colors.primary}
                    size="small"
                  />
                ) : (
                  <View
                    className="h-14 w-14 rounded-full bg-white"
                    style={{
                      opacity: acceptedTerms ? 0.9 : 0.4,
                    }}
                  />
                )}
              </TouchableOpacity>

              <Text
                className="mt-4 text-[10px] font-bold uppercase tracking-widest"
                style={{
                  color: acceptedTerms ? theme.colors.primary : '#aaaaaa',
                }}
              >
                {t('scan.take_photo_btn')}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms & Conditions Dialog */}
        <Portal>
          <Dialog
            visible={termsDialogVisible}
            onDismiss={() => setTermsDialogVisible(false)}
            style={{ backgroundColor: theme.colors.surface }}
          >
            <Dialog.Title style={{ color: theme.colors.onSurface }}>
              {t('campaign.terms')}
            </Dialog.Title>
            <Dialog.Content>
              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 16,
                }}
              >
                {t('scan.privacy_notice')}
              </Text>

              <View className="flex-row items-center rounded-lg border border-gray-300/30 p-3">
                <Checkbox.Android
                  status={acceptedTerms ? 'checked' : 'unchecked'}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                  color={theme.colors.primary}
                />
                <Text
                  className="ml-2 flex-1 text-sm"
                  style={{ color: theme.colors.onSurface }}
                  onPress={() => setAcceptedTerms(!acceptedTerms)}
                >
                  {t('scan.consent_text')}
                </Text>
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                accessible={true}
                accessibilityLabel={t('accessibility.close_message')}
                onPress={handleConfirmTerms}
                textColor={theme.colors.primary}
              >
                {acceptedTerms ? t('common.confirm') : t('common.close_window')}
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        {/* Processing Overlay (shown while waiting for API response) */}
        {loading && (
          <View
            className="absolute inset-0 items-center justify-center"
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
          >
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text className="mt-4 text-base font-bold text-white">
              {t('scan.processing')}
            </Text>
          </View>
        )}

        {/* Global UI Feedback Components */}
        <CustomSnackBar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMessage}
        />
        <CustomDialog
          title={dialogTitle}
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Text>{dialogText}</Text>
        </CustomDialog>
      </View>
    </>
  );
}
