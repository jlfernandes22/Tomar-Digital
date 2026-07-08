/**
 * CampaignListMerchant Screen (Merchant — Browse & Buy Packs)
 *
 * Standalone screen accessed from the CampaignMerchant hub via router.push.
 *
 * Mirrors the citizen's CampaignJoin.tsx flow but is reachable only from the
 * merchant's campaign hub. The merchant can:
 *   - Browse ALL active campaigns (public GET /listaCampanhas endpoint)
 *   - Tap any campaign to open CampaignDetails
 *   - Inside CampaignDetails, BUY PACKS with their accumulated points
 *     (the backend POST /packs/comprar accepts the comerciante role)
 *
 * This is intentionally separate from CampaignMerchantJoin so that the two
 * merchant flows ("buy packs as a customer" vs "join with my business") are
 * visually and conceptually distinct, mirroring the Camara's split between
 * CampaignList (view) and CampaignCreate (manage).
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
import { API_URL } from '@/constants/api';

// Components
import DetalhesCampanha from './CampaignDetails';
import CustomSnackBar from './CustomSnackBar';
import CustomDialog from './CustomDialog';
import LoadingScreen from './LoadingScreen';

export default function CampaignListMerchant() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState();

  // --- Local State ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Snackbar state — owned by this parent so messages persist after the
  // CampaignDetails modal closes and render above the modal overlay.
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Error dialog state — owned by this parent so error dialogs render above
  // the modal overlay (same reason as the snackbar).
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogText, setErrorDialogText] = useState('');

  // --- Handlers ---

  /**
   * Shows a snackbar message (success only). Passed to CampaignDetails via
   * the onSnackbar prop so the modal can trigger feedback without rendering
   * its own snackbar.
   */
  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarVisible(true);
  };

  /**
   * Shows an error dialog. Passed to CampaignDetails via the onError prop.
   * Used for errors and warnings that require user acknowledgement.
   */
  const showError = (title: string, message: string) => {
    setErrorDialogTitle(title);
    setErrorDialogText(message);
    setErrorDialogVisible(true);
  };

  /**
   * Fetches all campaigns from the backend.
   * Uses GET /listaCampanhas (public endpoint — no auth required).
   *
   * The `isRefresh` parameter controls whether we show the full loading
   * screen or just the pull-to-refresh spinner.
   */
  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`${API_URL}/listaCampanhas`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }
      const dados = await response.json();
      setCampaigns(dados);
    } catch (error) {
      console.error('[CampaignListMerchant] Erro ao buscar campanhas:', error);
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
  }, [t]);

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
   * Determines the campaign status based on its dates.
   * - DataInicio > now    → "agendada" (scheduled)
   * - DataExpiracao < now → "expirada" (expired)
   * - Otherwise           → "ativa" (active)
   */
  const getCampaignStatus = (campaign: any) => {
    const hoje = new Date();
    const inicio = new Date(campaign.DataInicio);
    const fim = new Date(campaign.DataExpiracao);

    if (hoje < inicio) return 'agendada';
    if (hoje > fim) return 'expirada';
    return 'ativa';
  };

  /** Returns the status badge style and label. */
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ativa':
        return {
          color: '#16A34A',
          bg: '#16A34A20',
          icon: 'check-circle',
          label: t('campaign.status_active', { defaultValue: 'Ativa' }),
        };
      case 'agendada':
        return {
          color: '#2563EB',
          bg: '#2563EB20',
          icon: 'clock-outline',
          label: t('campaign.status_scheduled', { defaultValue: 'Agendada' }),
        };
      case 'expirada':
        return {
          color: '#DC2626',
          bg: '#DC262620',
          icon: 'close-circle',
          label: t('campaign.status_expired', { defaultValue: 'Expirada' }),
        };
      default:
        return {
          color: theme.colors.onSurfaceVariant,
          bg: theme.colors.surfaceVariant,
          icon: 'circle-outline',
          label: status,
        };
    }
  };

  /** Render function for individual campaign cards in the FlatList. */
  const renderItem = ({ item }: { item: any }) => {
    const status = getCampaignStatus(item);
    const style = getStatusStyle(status);

    return (
      <Card
        style={{
          marginBottom: 16,
          marginHorizontal: 4,
          marginTop: 16,
          backgroundColor: theme.colors.surfaceVariant,
        }}
        onPress={() => handleOpenDetails(item)}
      >
        <Card.Content>
          {/* Title + status badge */}
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
                item.titulo || t('common.no_title', { defaultValue: 'Sem título' }),
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

          {/* Footer: dates + pack count */}
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
              {item.packs && item.packs.length > 0 ? (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.packs.length} {t('packs.available_packs', { defaultValue: 'pacotes' })}
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
          title={t('merchant.view_campaigns', { defaultValue: 'Ver Campanhas' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }} edges={['left', 'right']}>
          {/* Subtitle / merchant points balance */}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {t('merchant.points_balance_label', {
              defaultValue: 'Saldo: {{points}} pontos',
              points: user?.Points ?? 0,
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
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <IconButton
                  icon="megaphone-off"
                  size={48}
                  iconColor={theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="bodyMedium"
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                >
                  {t('campaign.no_campaigns', { defaultValue: 'Não existem campanhas.' })}
                </Text>
              </View>
            }
          />
        </SafeAreaView>

        {/* Campaign Details Modal */}
        {showDetails && selectedCampaign && (
          <DetalhesCampanha
            visible={showDetails}
            campaign={selectedCampaign}
            onClose={() => {
              setShowDetails(false);
              setSelectedCampaign(null);
              // Refresh after closing so any updated pack stock is reflected
              fetchCampaigns(true);
            }}
            onSnackbar={showSnackbar}
            onError={showError}
            onPurchaseSuccess={() => fetchCampaigns(true)}
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
