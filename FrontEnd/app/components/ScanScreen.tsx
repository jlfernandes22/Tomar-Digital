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
  const [permission, requestPermission] = useCameraPermissions();
  const { loadingQR, setLoadingQR } = useLoadingState();
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);

  // Estados para gerir os Termos e Condições
  const [acceptedTerms, setAcceptedTerms] = useState(
    user?.acceptedInvoiceTerms || false,
  );
  const [termsDialogVisible, setTermsDialogVisible] = useState(false);

  const isProcessing = useRef(false);
  const cameraRef = useRef<any>(null);
  const qrTimeoutRef = useRef<any>(null);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // Sincroniza o estado local com o AuthContext caso mude externamente
  useEffect(() => {
    setAcceptedTerms(user?.acceptedInvoiceTerms || false);
  }, [user?.acceptedInvoiceTerms]);

  useEffect(() => {
    requestPermission();
  }, []);

  // Limpa o temporizador ao desmontar o componente
  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    const handlePermissionPress = () => {
      if (permission.canAskAgain) {
        requestPermission();
      } else {
        // The user denied permission permanently, send them to settings
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
            onPress={handlePermissionPress} // <-- Use the new function
            className="rounded-xl p-4"
            style={{ backgroundColor: theme.colors.primary }}
          >
            <Text
              className="font-bold"
              style={{ color: theme.colors.onPrimary }}
            >
              {/* Change button text if they need to go to settings */}
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

  const handleBarcodeScanned = ({ type, data }: any) => {
    if (isProcessing.current) return;
    setScannedQr(data);

    // Reinicia o temporizador de expiração do QR Code (sugestão temporária)
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    qrTimeoutRef.current = setTimeout(() => {
      setScannedQr(null);
    }, 1500);
  };

  const handleConfirmTerms = async () => {
    setTermsDialogVisible(false);

    // Se houve alteração no consentimento em relação ao que está guardado
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
          updateUser({ acceptedInvoiceTerms: acceptedTerms });
          setSnackbarMessage(
            acceptedTerms
              ? t('scan.terms_accepted_msg')
              : t('scan.terms_revoked_msg'),
          );
          setSnackbarVisible(true);
        } else {
          // Reverte o estado visual para sincronizar com o do contexto em caso de falha
          setAcceptedTerms(user?.acceptedInvoiceTerms || false);
          setDialogTitle(t('common.error'));
          setDialogText(
            `${t('scan.error_terms_update')}${result.message || t('common.error')}`,
          );
          setDialogVisible(true);
        }
      } catch (error) {
        console.error('Erro ao atualizar termos no servidor:', error);
        // Reverte o estado visual em caso de falha de ligação
        setAcceptedTerms(user?.acceptedInvoiceTerms || false);
        setDialogTitle(t('common.error'));
        setDialogText(t('scan.error_comm_server'));
        setDialogVisible(true);
      }
    }
  };

  const handleTakeAndSend = async () => {
    if (isProcessing.current) return;
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

      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error('Falha ao capturar a imagem da fatura.');
      }

      const formData = new FormData();
      formData.append('ReceiptImage', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'fatura.jpg',
      } as any);
      formData.append('QRCodeData', scannedQr || '');

      const response = await fetch(`${API_URL}/lerFatura`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      if (response.status === 429) {
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        setPhotoLoading(false);
        return;
      }

      const result = await response.json();

      if (response.ok) {
        updateUser({ Points: result.saldoAtual ?? result.novoSaldoTotal });

        setSnackbarMessage(
          t('scan.success_earned', {
            pontos: result.pontosGanhos,
            saldo: result.saldoAtual,
          }),
        );
        setSnackbarVisible(true);
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

  useEffect(() => {
    setLoadingQR(loading);
  }, [loading]);

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
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={handleBarcodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        />

        {/* Container Principal sobre a câmara */}
        <View className="flex-1 justify-between">
          {/* Topo: Instruções Únicas */}
          <View
            className="mx-4 mt-14 rounded-2xl p-4"
            style={{ backgroundColor: theme.colors.background }}
          >
            <Text className="text-center text-sm font-semibold leading-5 text-white">
              {t('scan.instruction')}
            </Text>
          </View>

          {/* Centro: Retângulo de Enquadramento Dinâmico */}
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

          {/* Base: Painel de Controlo */}
          <View
            className="items-center rounded-t-3xl px-6 py-8"
            style={{ backgroundColor: theme.colors.background }}
          >
            {/* Gestão dos Termos e Condições (Link Discreto) */}
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

            {/* Botão de Captura (Shutter) */}
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

              {/* Texto auxiliar inferior */}
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

        {/* DIALOG: Termos e Condições */}
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

        {/* Indicador de carregamento em ecrã inteiro */}
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
