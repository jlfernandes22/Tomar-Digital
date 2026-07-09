/**
 * ValidatePack Screen (Camara Staff — Pack Delivery Validation)
 *
 * This screen is used by Camara staff to validate a citizen's pickup code
 * when they arrive in person to collect their pack/prize.
 *
 * Flow:
 *   1. The staff member enters the pickup code (e.g. "TD-2026-A3F8K2") that
 *      the citizen shows them (from the MyPurchases screen on their phone).
 *   2. The code is sent to POST /packs/validar.
 *   3. The backend validates the code atomically and returns either:
 *      - Success: the reward description, citizen name, campaign title
 *        → staff hands over the physical prize
 *      - Error: already delivered / expired / not found
 *        → staff informs the citizen
 *
 * This screen respects the app's theme system (useAppTheme), uses the custom
 * feedback components (CustomDialog, CustomTextInput,
 * CustomButton), and is fully commented to match the codebase's standards.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import {
  Surface,
  Text,
  Divider,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';

// Components
import CustomButton from './CustomButton';
import CustomTextInput from './CustomTextInput';
import CustomDialog from './CustomDialog';

const ValidatePack = () => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();

  // --- Local State ---
  const [pickupCode, setPickupCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation result dialog state
  const [resultDialogVisible, setResultDialogVisible] = useState(false);
  const [resultData, setResultData] = useState<{
    success: boolean;
    title: string;
    message: string;
    rewardDescription?: string;
    citizenName?: string;
    citizenEmail?: string;
    campaignTitle?: string;
  } | null>(null);

  // Error dialog state (for validation errors and network errors)
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogText, setErrorDialogText] = useState('');

  // --- Handlers ---

  /**
   * Sends the pickup code to the backend for validation.
   * On success, shows a dialog with the prize to deliver.
   * On failure, shows a dialog with the error reason.
   */
  const handleValidate = async () => {
    // --- Client-side validation ---
    if (!pickupCode.trim()) {
      setErrorDialogTitle(t('common.warning', { defaultValue: 'Aviso' }));
      setErrorDialogText(t('packs.validation_enter_code', { defaultValue: 'Introduza o código de levantamento.' }));
      setErrorDialogVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/packs/validar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ pickupCode: pickupCode.trim() }),
      });

      // --- Safely parse the response as JSON ---
      // Same pattern as CampaignDetails: read as text first, then parse.
      // Prevents SyntaxError if the server returns HTML (e.g. 404 page).
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          '[ValidatePack] Resposta não-JSON do servidor (provável HTML 404).',
          'Status:', response.status,
          'Primeiros 100 chars:', responseText.substring(0, 100),
        );
        setErrorDialogTitle(t('common.error_alert', { defaultValue: 'Erro' }));
        setErrorDialogText(
          t('packs.server_not_available', {
            defaultValue:
              'Não foi possível contactar o servidor. Verifique se o backend está a correr e se a rota /packs/validar existe.',
          }),
        );
        setErrorDialogVisible(true);
        return;
      }

      if (response.ok) {
        // --- Success: show the prize to deliver ---
        setResultData({
          success: true,
          title: t('packs.validation_success_title', { defaultValue: 'Pacote Validado' }),
          message: t('packs.validation_deliver_prize', { defaultValue: 'Entregar o prémio ao cidadão.' }),
          rewardDescription: data.rewardDescription,
          citizenName: data.citizenName,
          citizenEmail: data.citizenEmail,
          campaignTitle: data.campaignTitle,
        });
        setResultDialogVisible(true);
        setPickupCode(''); // Clear the input for the next validation
      } else {
        // --- Error: already delivered, expired, or not found ---
        setResultData({
          success: false,
          title: t('packs.validation_error_title', { defaultValue: 'Código Inválido' }),
          message: data.message || t('packs.validation_error_default', { defaultValue: 'Não foi possível validar este código.' }),
        });
        setResultDialogVisible(true);
      }
    } catch (error) {
      console.error('[ValidatePack] Erro de rede:', error);
      setErrorDialogTitle(t('common.error_alert', { defaultValue: 'Erro' }));
      setErrorDialogText(t('common.error_comm_server', { defaultValue: 'Não foi possível comunicar com o servidor.' }));
      setErrorDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('packs.validate_title', { defaultValue: 'Validar Pacotes' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header Section */}
            <Text
              variant="headlineSmall"
              style={{ fontWeight: 'bold', color: theme.colors.primary, marginTop: 16, marginBottom: 8 }}
            >
              {t('packs.validate_subtitle', { defaultValue: 'Levantamento de Prémios' })}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 24 }}>
              {t('packs.validate_instructions', { defaultValue: 'Peça ao cidadão o código de levantamento que recebeu na aplicação quando comprou o pacote. Introduza o código abaixo para validar e entregar o prémio.' })}
            </Text>

            <Divider style={{ marginBottom: 24 }} />

            {/* Code Input */}
            <View style={{ marginBottom: 24 }}>
              <CustomTextInput
                label={t('packs.pickup_code_label', { defaultValue: 'Código de levantamento' })}
                value={pickupCode}
                onChangeText={setPickupCode}
                placeholder="TD-2026-XXXXXXXX"
                accessibilityLabel={t('accessibility.pickup_code_input', { defaultValue: 'Campo para introduzir o código de levantamento' })}
                accessibilityHint={t('accessibility.pickup_code_hint', { defaultValue: 'Introduza o código que o cidadão recebeu ao comprar o pacote' })}
              />
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, fontStyle: 'italic' }}>
                {t('packs.code_format_hint', { defaultValue: 'Formato: TD-AAAA-XXXXXXXX (ex.: TD-2026-A3F8K2)' })}
              </Text>
            </View>

            {/* Validate Button */}
            <CustomButton
              onPress={handleValidate}
              disabled={loading || !pickupCode.trim()}
              loading={loading}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              className="w-full"
              accessibilityLabel={t('accessibility.validate_pack_btn', { defaultValue: 'Validar código e entregar prémio' })}
              accessibilityHint={t('accessibility.validate_pack_hint', { defaultValue: 'Clica para verificar o código e marcar o pacote como entregue' })}
            >
              {loading
                ? t('common.processing', { defaultValue: 'A processar...' })
                : t('packs.validate_button', { defaultValue: 'Validar Código' })}
            </CustomButton>
          </ScrollView>
        </SafeAreaView>
      </Surface>

      {/* Validation Result Dialog */}
      <CustomDialog
        visible={resultDialogVisible}
        title={resultData?.title || ''}
        onDismiss={() => {
          setResultDialogVisible(false);
          setResultData(null);
        }}
        onPress={() => {
          setResultDialogVisible(false);
          setResultData(null);
        }}
        buttonText={t('common.ok', { defaultValue: 'OK' })}
        buttonColor={resultData?.success ? theme.colors.primary : theme.colors.error}
        textColor={resultData?.success ? theme.colors.onPrimary : theme.colors.onError}
        icon={resultData?.success ? 'check-circle' : 'alert-circle'}
      >
        {resultData ? (
          <View>
            <Text variant="bodyMedium" style={{ marginBottom: 16, textAlign: 'center', color: resultData.success ? theme.colors.primary : theme.colors.error }}>
              {resultData.message}
            </Text>

            {resultData.success ? (
              <View style={{ gap: 8 }}>
                {/* Prize to deliver — the most important info for the staff */}
                <View
                  style={{
                    padding: 16,
                    borderRadius: theme.roundness,
                    borderWidth: 2,
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.surfaceVariant,
                    alignItems: 'center',
                  }}
                >
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                    {t('packs.prize_to_deliver', { defaultValue: 'Prémio a entregar' })}
                  </Text>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.primary, textAlign: 'center' }}>
                    {resultData.rewardDescription}
                  </Text>
                </View>

                {/* Citizen details */}
                {resultData.citizenName ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    <Text style={{ fontWeight: 'bold' }}>{t('packs.citizen', { defaultValue: 'Cidadão' })}:</Text> {resultData.citizenName}
                  </Text>
                ) : null}
                {resultData.citizenEmail ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    <Text style={{ fontWeight: 'bold' }}>Email:</Text> {resultData.citizenEmail}
                  </Text>
                ) : null}
                {resultData.campaignTitle ? (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    <Text style={{ fontWeight: 'bold' }}>{t('packs.campaign_label', { defaultValue: 'Campanha' })}:</Text> {resultData.campaignTitle}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </View>
        ) : null}
      </CustomDialog>

      {/* Error dialog for validation/network errors */}
      <CustomDialog
        title={errorDialogTitle}
        visible={errorDialogVisible}
        onDismiss={() => setErrorDialogVisible(false)}
      >
        <Text>{errorDialogText}</Text>
      </CustomDialog>
    </>
  );
};

export default ValidatePack;
