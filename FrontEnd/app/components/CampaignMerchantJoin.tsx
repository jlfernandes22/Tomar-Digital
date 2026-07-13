/**
 * CampaignMerchantJoin Screen (Merchant — Manage Business Participation)
 *
 * Standalone screen accessed from the CampaignMerchant hub via router.push.
 *
 * This screen is the merchant's "participation manager" — it shows every
 * campaign relevant to the merchant's CAE codes, each enriched with a
 * participation status badge:
 *   - "Participando"     (green)  → business approved in this campaign
 *   - "Pendente"         (orange) → application submitted, awaiting Camara decision
 *   - "Rejeitado"        (red)    → application was rejected
 *   - "Não participando" (gray)   → not yet applied, can join
 *
 * The merchant can tap a campaign to open CampaignDetails and join (or re-join
 * if rejected). The join flow itself (selecting one of the merchant's businesses
 * and submitting the application) lives inside CampaignDetails.
 *
 * This screen is the equivalent of the OLD CampaignMerchant tab content —
 * extracted into a standalone screen so the tab can become a hub that exposes
 * BOTH merchant campaign flows (buy packs + manage participation).
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import {
  Card,
  Divider,
  Surface,
  Text,
  Chip,
  IconButton,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
// Components
import DetalhesCampanha from './CampaignDetails';
import CustomSnackBar from './CustomSnackBar';
import CustomDialog from './CustomDialog';
import LoadingScreen from './LoadingScreen';

import { useApiFetch } from '@/utils/apiFetch';
export default function CampaignMerchantJoin() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState();
  const apiFetch = useApiFetch();

  // --- Local State ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Snackbar state (success messages)
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Error dialog state (errors and warnings)
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogText, setErrorDialogText] = useState('');

  // --- Handlers ---

  /** Shows a snackbar message (for success only). */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  /** Shows an error dialog (for errors and warnings). */
  const showError = (title: string, message: string) => {
    setErrorDialogTitle(title);
    setErrorDialogText(message);
    setErrorDialogVisible(true);
  };

  /**
   * Fetches campaigns with participation status from the backend.
   * Uses the endpoint GET /campanhas/comerciante-com-status which returns
   * each campaign enriched with a `participacao` object.
   *
   * The `isRefresh` parameter controls whether we show the full loading
   * screen or just the pull-to-refresh spinner.
   */
  const fetchCampaigns = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const response = await apiFetch(`/campanhas/comerciante-com-status`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch campaigns');
        }

        const dados = await response.json();
        setCampaigns(dados);
      } catch (error) {
        console.error('[CampaignMerchantJoin] Erro no fetchCampaigns:', error);
        setCampaigns([]);
        showError(
          t('common.error_alert', { defaultValue: 'Erro' }),
          t('campaign.error_load', {
            defaultValue: 'Não foi possível carregar as campanhas.',
          }),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.token, t],
  );

  /** Pull-to-refresh handler. */
  const handleRefresh = useCallback(() => {
    fetchCampaigns(true);
  }, [fetchCampaigns]);

  /** Opens the campaign details modal for a specific campaign. */
  const handleOpenDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  /**
   * Returns the participation status badge style and label.
   * - aprovado  → green "Participando"
   * - pendente  → orange "Pendente"
   * - rejeitado → red "Rejeitado"
   * - null      → gray "Não participando"
   */
  const getParticipacaoStyle = (status: string | null) => {
    switch (status) {
      case 'aprovado':
        return {
          color: '#16A34A',
          bg: '#16A34A20',
          icon: 'check-circle',
          label: t('campaign.participating', { defaultValue: 'Participando' }),
        };
      case 'pendente':
        return {
          color: '#EA580C',
          bg: '#EA580C20',
          icon: 'clock-outline',
          label: t('campaign.pending_approval', { defaultValue: 'Pendente' }),
        };
      case 'rejeitado':
        return {
          color: '#DC2626',
          bg: '#DC262620',
          icon: 'close-circle',
          label: t('campaign.rejected', { defaultValue: 'Rejeitado' }),
        };
      default:
        return {
          color: theme.colors.onSurfaceVariant,
          bg: theme.colors.surfaceVariant,
          icon: 'circle-outline',
          label: t('campaign.not_participating', {
            defaultValue: 'Não participando',
          }),
        };
    }
  };

  /** Render function for individual campaign cards in the FlatList. */
  const renderItem = ({ item }: { item: any }) => {
    const participacao = item.participacao || { status: null };
    const style = getParticipacaoStyle(participacao.status);

    return (
      <Card
        style={{ marginBottom: 16, marginHorizontal: 4, marginTop: 16 }}
        onPress={() => handleOpenDetails(item)}
      >
        <Card.Content>
          {/* Title + participation badge */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <Text
              variant="titleLarge"
              style={{ color: theme.colors.primary, flex: 1, marginRight: 8 }}
            >
              {String(
                item.titulo ||
                  t('common.no_title', { defaultValue: 'Sem título' }),
              )}
            </Text>
            <Chip
              icon={style.icon}
              compact
              style={{ backgroundColor: style.bg }}
              textStyle={{ color: style.color, fontSize: 11 }}
            >
              {style.label}
            </Chip>
          </View>

          {/* Description */}
          <Text variant="bodyMedium" style={{ marginTop: 4 }}>
            {String(
              item.descricao ||
                t('common.no_description', { defaultValue: 'Sem descrição' }),
            )}
          </Text>

          {/* Footer: expiry + business name (if participating) */}
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text variant="labelSmall">
                {t('campaign.expires_label', { defaultValue: 'Expira:' })}{' '}
                {item.DataExpiracao
                  ? new Date(item.DataExpiracao).toLocaleDateString()
                  : 'N/A'}
              </Text>
              {participacao.businessName ? (
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant }}
                >
                  {t('campaign.business_label', { defaultValue: 'Negócio' })}:{' '}
                  {participacao.businessName}
                </Text>
              ) : null}
            </View>

            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
              {t('campaign.see_more')}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  // --- Effects ---

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the list is fetching.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  if (loading) {
    return <LoadingScreen />;
  }

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
          title={t('merchant.join_campaigns', {
            defaultValue: 'Aderir a Campanhas',
          })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView
          style={{ flex: 1, paddingHorizontal: 16 }}
          edges={['left', 'right']}
        >
          {/* Helper text */}
          <Text
            variant="bodySmall"
            style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}
          >
            {t('merchant.join_helper', {
              defaultValue:
                'Selecione uma campanha para aderir com um dos seus negócios',
            })}
          </Text>

          <Divider style={{ marginVertical: 8 }} />

          {/* List */}
          <FlatList
            data={campaigns}
            renderItem={renderItem}
            keyExtractor={item => item._id?.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <IconButton
                  icon="shopping-outline"
                  size={48}
                  iconColor={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    textAlign: 'center',
                  }}
                >
                  {t('campaign.no_campaigns_merchant', {
                    defaultValue:
                      'Não existem campanhas disponíveis para os seus negócios neste momento.',
                  })}
                </Text>
              </View>
            }
          />
        </SafeAreaView>

        {/* Modal */}
        {showDetails && selectedCampaign && (
          <DetalhesCampanha
            visible={showDetails}
            campaign={selectedCampaign}
            onClose={() => {
              setShowDetails(false);
              setSelectedCampaign(null);
              // Refresh after closing to update participation status
              fetchCampaigns(true);
            }}
            onSnackbar={showSnackbar}
            onError={showError}
            onPurchaseSuccess={() => fetchCampaigns(true)}
            // "Aderir a Campanhas" is the merchant's PARTICIPATION flow —
            // the candidatar-negócio multi-step form MUST appear here.
            showJoinFlow={true}
          />
        )}
      </Surface>

      {/* Snackbar — rendered at the parent level so it appears above the modal */}
      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />

      {/* Error dialog — rendered at the parent level so it appears above the modal */}
      <CustomDialog
        title={errorDialogTitle}
        visible={errorDialogVisible}
        onDismiss={() => setErrorDialogVisible(false)}
      >
        <Text>{errorDialogText}</Text>
      </CustomDialog>
    </>
  );
}
