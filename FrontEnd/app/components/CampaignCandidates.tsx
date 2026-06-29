/**
 * CampaignCandidates Screen
 *
 * Displays a list of businesses applying to join active campaigns.
 * It allows City Council ('camara') users to approve or reject these applications.
 * Uses an Optimistic UI approach to remove items from the list immediately upon success.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  Surface,
  Text,
  useTheme,
  Button,
  TouchableRipple,
  Divider,
  Appbar,
} from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';

// Components
import CustomDialog from './CustomDialog';
import CustomSnackBar from './CustomSnackBar';
import LoadingScreen from './LoadingScreen';

// Types
import Candidatura from '@/constants/Interfaces/Candidate';

export default function CandidaturasCampanha() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // UI Feedback state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // --- Handlers ---

  /** Fetches pending campaign applications from the backend. */
  const carregarCandidaturas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/candidaturasCampanha`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setCandidaturas(data);
    } catch (err) {
      console.error('Erro ao carregar:', err);
      setDialogTitle(t('common.error'));
      setDialogText(t('campaign.error_load'));
      setDialogVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.token, t]);

  /**
   * Approves or rejects a campaign application.
   * Uses an Optimistic UI pattern: the item is removed from the local list
   * immediately upon a successful API response to give the user instant feedback.
   */
  const handleDecidir = useCallback(
    async (businessId: string, campaignId: string, novoStatus: string) => {
      try {
        const response = await fetch(`${API_URL}/decidirAdesaoCampanha`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${user?.token}`,
          },
          // Backend expects 'acao' instead of 'action' or 'status'
          body: JSON.stringify({
            businessId,
            campaignId,
            acao: novoStatus,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Remove the processed application from the local state
          setCandidaturas(prev =>
            prev.filter(
              c =>
                !(c.businessId === businessId && c.campaignId === campaignId),
            ),
          );

          setSnackbarMessage(
            t('campaign.success_status', {
              status: t(`common.${novoStatus}`, { defaultValue: novoStatus }),
              defaultValue: `Candidatura ${novoStatus} com sucesso!`,
            }),
          );
          setSnackbarVisible(true);
        } else {
          setDialogTitle(t('common.error'));
          setDialogText(
            data.message ||
              t('common.error_process', { defaultValue: 'Erro ao processar' }),
          );
          setDialogVisible(true);
        }
      } catch (err) {
        console.error('Erro na decisão:', err);
      }
    },
    [user?.token, t],
  );

  /** Pull-to-refresh handler. */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarCandidaturas();
  }, [carregarCandidaturas]);

  // --- Effects ---

  // Fetch initial data on mount
  useEffect(() => {
    carregarCandidaturas();
  }, [carregarCandidaturas]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while data is fetching.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  // Placed after all hooks have been declared.
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <>
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

      <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />

        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: 'bold',
            margin: 10,
          }}
        >
          {t('campaign.pending_requests')}
        </Text>
        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        <FlatList
          data={candidaturas}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          keyExtractor={item => `${item.businessId}-${item.campaignId}`}
          renderItem={({ item }) => (
            <Surface
              style={{ marginBottom: 12, borderRadius: 8 }}
              elevation={2}
            >
              <TouchableRipple
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('accessibility.view_application_name', {
                  name: item.businessName,
                  defaultValue: `Ver detalhes da candidatura de ${item.businessName}`,
                })}
                accessibilityHint={t('accessibility.open_campaign_details')}
                onPress={() =>
                  router.push({
                    pathname: '/components/BusinessDetails',
                    params: {
                      businessId: item.businessId,
                      campaignId: item.campaignId,
                    },
                  })
                }
                rippleColor="rgba(150, 150, 150, 0.2)"
              >
                <View style={{ padding: 16 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {item.businessName}
                  </Text>
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    {t('campaign.campaign_name', { title: item.campaignTitle })}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{ marginTop: 8, color: theme.colors.outline }}
                  >
                    {t('campaign.request_date', {
                      date: new Date(item.requestDate).toLocaleDateString(),
                    })}
                  </Text>
                </View>
              </TouchableRipple>

              <View
                style={{
                  flexDirection: 'row',
                  padding: 16,
                  paddingTop: 0,
                  gap: 10,
                }}
              >
                <Button
                  mode="contained"
                  onPress={() =>
                    handleDecidir(item.businessId, item.campaignId, 'aprovado')
                  }
                  style={{ flex: 1, backgroundColor: theme.colors.primary }}
                  accessibilityLabel={t(
                    'accessibility.approve_application_name',
                    {
                      name: item.businessName,
                      defaultValue: `Aprovar candidatura de ${item.businessName}`,
                    },
                  )}
                >
                  {t('common.approve', { defaultValue: 'Aprovar' })}
                </Button>
                <Button
                  mode="outlined"
                  onPress={() =>
                    handleDecidir(item.businessId, item.campaignId, 'rejeitado')
                  }
                  style={{ flex: 1 }}
                  accessibilityLabel={t(
                    'accessibility.reject_application_name',
                    {
                      name: item.businessName,
                      defaultValue: `Rejeitar candidatura de ${item.businessName}`,
                    },
                  )}
                >
                  {t('common.reject', { defaultValue: 'Rejeitar' })}
                </Button>
              </View>
            </Surface>
          )}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              {t('campaign.no_requests')}
            </Text>
          }
        />
      </SafeAreaView>

      {/* Global UI Feedback Components */}
      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
      <CustomDialog
        title={dialogTitle}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>
    </>
  );
}
