/**
 * CampaignList Screen (Camara — View All Campaigns)
 *
 * Displays a list of all campaigns (active, scheduled, and expired) for the
 * Camara to review. Each card shows the campaign title, description, status
 * badge (agendada/ativa/expirada), and expiry date.
 *
 * Tapping a campaign opens the CampaignDetails modal (read-only for camara).
 *
 * This screen is accessed from the CampaignIndex hub via router.push.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import {
  Surface,
  Text,
  Card,
  Divider,
  Chip,
  IconButton,
  Appbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';

// Contexts & Hooks
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';

// Components
import DetalhesCampanha from './CampaignDetails';
import CustomDialog from './CustomDialog';
import LoadingScreen from './LoadingScreen';

const CampaignList = () => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Local State ---
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Error dialog state
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogText, setErrorDialogText] = useState('');

  // --- Handlers ---

  /**
   * Fetches all campaigns from the backend.
   * Uses GET /listaCampanhas (returns all campaigns regardless of status).
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
      if (!response.ok) throw new Error('Failed to fetch campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('[CampaignList] Erro ao buscar campanhas:', error);
      setErrorDialogText(
        t('campaign.error_load', {
          defaultValue: 'Não foi possível carregar as campanhas.',
        }),
      );
      setErrorDialogVisible(true);
      setCampaigns([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  /** Pull-to-refresh handler. */
  const handleRefresh = useCallback(() => {
    fetchCampaigns(true);
  }, [fetchCampaigns]);

  /** Opens the campaign details modal. */
  const handleOpenDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  /**
   * Determines the campaign status based on its dates.
   * - DataInicio > now   → "agendada" (scheduled)
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

  // --- Effects ---

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  // --- Render function for individual campaign cards ---
  const renderCampaign = ({ item }: { item: any }) => {
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
              {item.titulo || t('common.no_title', { defaultValue: 'Sem título' })}
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
            {item.descricao || t('common.no_description', { defaultValue: 'Sem descrição' })}
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

  // --- Early Return (Loading) ---
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
          title={t('camara.view_campaigns', { defaultValue: 'Ver Campanhas' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }} edges={['left', 'right']}>
          {/* Campaign count */}
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 8 }}>
            {campaigns.length} {t('campaign.total_campaigns', { defaultValue: 'campanhas no total' })}
          </Text>

          <Divider style={{ marginVertical: 8 }} />

          {/* List */}
          <FlatList
            data={campaigns}
            renderItem={renderCampaign}
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
      </Surface>

      {/* Campaign Details Modal */}
      {showDetails && selectedCampaign && (
        <DetalhesCampanha
          visible={showDetails}
          campaign={selectedCampaign}
          onClose={() => {
            setShowDetails(false);
            setSelectedCampaign(null);
          }}
        />
      )}

      {/* Error Dialog */}
      <CustomDialog
        title={t('common.error_alert', { defaultValue: 'Erro' })}
        visible={errorDialogVisible}
        onDismiss={() => setErrorDialogVisible(false)}
      >
        <Text>{errorDialogText}</Text>
      </CustomDialog>
    </>
  );
};

export default CampaignList;
