/**
 * JoinCampaign Screen
 *
 * Displays a list of available campaigns for the user to view and join.
 * It fetches campaigns dynamically based on the user's role (e.g., 'comerciante'
 * sees campaigns relevant to their business CAEs, while others see general campaigns).
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import { Card, Divider, Surface, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import DetalhesCampanha from '@/app/components/CampaignDetails';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import LoadingScreen from '../components/LoadingScreen';

export default function JoinCampaign() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

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

  /**
   * Shows a snackbar message. Passed to CampaignDetails via the onSnackbar
   * prop so the modal can trigger feedback without rendering its own snackbar.
   * Used ONLY for success messages.
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

  // --- Handlers ---

  /**
   * Fetches campaigns from the backend.
   * Citizens see all active campaigns (to browse and buy packs).
   * Uses GET /listaCampanhas (no auth required).
   *
   * The `isRefresh` parameter controls whether we set `loading` (full-screen
   * LoadingScreen) or `refreshing` (pull-to-refresh spinner).
   */
  const fetchCampaigns = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`${API_URL}/listaCampanhas`);
      const dados = await response.json();
      setCampaigns(dados);
    } catch (error) {
      console.error('Erro fatal no fetchCampaigns:', error);
      setCampaigns([]); // Fallback to empty array on failure to prevent crashes
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /** Pull-to-refresh handler. */
  const handleRefresh = useCallback(() => {
    fetchCampaigns(true);
  }, [fetchCampaigns]);

  /** Opens the campaign details modal for a specific campaign. */
  const handleOpenDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  /** Render function for individual campaign cards in the FlatList. */
  const renderItem = ({ item }: { item: any }) => (
    <Card
      style={{ marginBottom: 16, marginHorizontal: 4, marginTop: 16 }}
      onPress={() => handleOpenDetails(item)}
    >
      <Card.Content>
        <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
          {String(
            item.titulo || t('common.no_title', { defaultValue: 'Sem título' }),
          )}
        </Text>

        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
          {String(
            item.descricao ||
              t('common.no_description', { defaultValue: 'Sem descrição' }),
          )}
        </Text>

        <View
          style={{
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
          }}
        >
          <Text variant="labelSmall">
            {t('campaign.expires_label', { defaultValue: 'Expira:' })}{' '}
            {item.DataExpiracao
              ? new Date(item.DataExpiracao).toLocaleDateString()
              : 'N/A'}
          </Text>

          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            {t('campaign.see_more')}
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  // --- Effects ---

  // Fetch campaigns on component mount
  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the list is fetching,
   * preventing navigation overlaps.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  // Because we manage 'loading' state here, we don't need a conditional
  // inside the main return block for the FlatList.
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* 1. Title */}
        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: 'bold',
            marginBottom: 10,
          }}
        >
          {t('campaign.join_title_citizen', {
            defaultValue: 'Campanhas a decorrer',
          })}
        </Text>

        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        {/* 2. List */}
        <FlatList
          data={campaigns}
          renderItem={renderItem}
          keyExtractor={item => item._id?.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              {t('campaign.no_campaigns')}
            </Text>
          }
        />

        {/* 3. Modal */}
        {showDetails && selectedCampaign && (
          <DetalhesCampanha
            visible={showDetails}
            campaign={selectedCampaign}
            onClose={() => {
              setShowDetails(false);
              setSelectedCampaign(null); // Clear selection on close
            }}
            onSnackbar={showSnackbar}
            onError={showError}
            onPurchaseSuccess={() => fetchCampaigns(true)}
          />
        )}
      </SafeAreaView>

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
    </Surface>
  );
}
