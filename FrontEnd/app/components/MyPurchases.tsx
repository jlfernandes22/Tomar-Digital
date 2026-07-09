/**
 * MyPurchases Screen (Voucher Wallet / Transaction History)
 *
 * Displays the citizen's complete purchase history — every pack they've bought
 * with points. Each transaction shows:
 *   - The reward description
 *   - The points spent
 *   - The purchase date
 *   - The pickup code (for active vouchers)
 *   - The status badge (ativo / entregue / expirado)
 *
 * The user can filter transactions by status using filter chips at the top.
 *
 * For active vouchers, the pickup code is prominently displayed so the citizen
 * can read it at the Câmara Municipal front desk.
 *
 * This screen respects the app's theme system (useAppTheme), uses the custom
 * feedback components (CustomDialog), and is fully commented to match the
 * codebase's documentation standards.
 */

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import {
  Surface,
  Text,
  Card,
  Chip,
  Divider,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Appbar } from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';

// Components
import CustomDialog from './CustomDialog';
import LoadingScreen from './LoadingScreen';

// --- Types ---
type PurchaseStatus = 'ativo' | 'entregue' | 'expirado';
type FilterStatus = PurchaseStatus | 'todos';

interface Purchase {
  _id: string;
  pickupCode: string;
  status: PurchaseStatus;
  redeemedAt: string;
  validatedAt: string | null;
  expiresAt: string;
  pack: {
    packId: string;
    rewardDescription: string;
    pointsCost: number;
  };
  campaign: {
    _id: string;
    titulo: string;
    logo?: string;
  } | null;
}

const MyPurchases = () => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState();

  // --- Local State ---
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('todos');
  // Error dialog state (errors use dialogs, not snackbars)
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogText, setErrorDialogText] = useState('');

  // --- Handlers ---

  /**
   * Fetches the user's purchase history from the backend.
   * Uses the activeFilter to query by status (or all if 'todos' is selected).
   * The backend performs lazy expiry before returning, so the status is always current.
   */
  const fetchPurchases = useCallback(
    async (filter: FilterStatus) => {
      try {
        const url =
          filter === 'todos'
            ? `${API_URL}/packs/minhas-compras`
            : `${API_URL}/packs/minhas-compras?status=${filter}`;

        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setPurchases(data);
        } else {
          setPurchases([]);
          setErrorDialogTitle(t('common.error_alert', { defaultValue: 'Erro' }));
          setErrorDialogText(t('packs.error_loading', { defaultValue: 'Erro ao carregar compras.' }));
          setErrorDialogVisible(true);
        }
      } catch (error) {
        console.error('[MyPurchases] Erro ao buscar compras:', error);
        setPurchases([]);
        setErrorDialogTitle(t('common.error_alert', { defaultValue: 'Erro' }));
        setErrorDialogText(t('common.error_comm_server', { defaultValue: 'Não foi possível comunicar com o servidor.' }));
        setErrorDialogVisible(true);
      }
    },
    [user?.token, t],
  );

  /**
   * Changes the active filter and re-fetches the data.
   */
  const handleFilterChange = (filter: FilterStatus) => {
    setActiveFilter(filter);
    setLoading(true);
    fetchPurchases(filter).finally(() => setLoading(false));
  };

  /**
   * Pull-to-refresh handler.
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPurchases(activeFilter);
    setRefreshing(false);
  };

  // --- Effects ---

  /**
   * Fetch purchases on component mount.
   */
  React.useEffect(() => {
    fetchPurchases('todos').finally(() => setLoading(false));
  }, [fetchPurchases]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the list is fetching.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  React.useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Derived Values ---

  /**
   * Returns the status badge color and icon based on the purchase status.
   * - ativo    → green (ready to pick up)
   * - entregue → gray  (already picked up)
   * - expirado → red   (pickup deadline passed)
   */
  const getStatusStyle = (status: PurchaseStatus) => {
    switch (status) {
      case 'ativo':
        return {
          color: '#16A34A',
          icon: 'check-circle-outline',
          label: t('packs.status_active', { defaultValue: 'Ativo' }),
        };
      case 'entregue':
        return {
          color: theme.colors.onSurfaceVariant,
          icon: 'check',
          label: t('packs.status_delivered', { defaultValue: 'Entregue' }),
        };
      case 'expirado':
        return {
          color: '#DC2626',
          icon: 'close-circle-outline',
          label: t('packs.status_expired', { defaultValue: 'Expirado' }),
        };
    }
  };

  /** Render function for individual purchase cards in the FlatList. */
  const renderPurchase = ({ item }: { item: Purchase }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <Card
        style={{
          marginBottom: 12,
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <Card.Content>
          {/* Header: Reward description + status badge */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 8,
            }}
          >
            <Text
              variant="titleSmall"
              style={{ fontWeight: 'bold', flex: 1, marginRight: 8 }}
            >
              {item.pack.rewardDescription}
            </Text>
            <Chip
              icon={statusStyle.icon}
              compact
              style={{ backgroundColor: statusStyle.color + '20' }}
              textStyle={{ color: statusStyle.color, fontSize: 11 }}
            >
              {statusStyle.label}
            </Chip>
          </View>

          {/* Campaign title */}
          {item.campaign ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
              {t('packs.campaign_label', { defaultValue: 'Campanha' })}: {item.campaign.titulo}
            </Text>
          ) : null}

          {/* Points spent + date */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 8 }}>
            <Text variant="labelSmall">
              {t('packs.points_spent', { defaultValue: 'Pontos gastos' })}: {item.pack.pointsCost}
            </Text>
            <Text variant="labelSmall">
              {new Date(item.redeemedAt).toLocaleDateString()}
            </Text>
          </View>

          {/* Pickup code — prominently displayed for active vouchers */}
          {item.status === 'ativo' ? (
            <View
              style={{
                marginTop: 8,
                padding: 12,
                borderRadius: theme.roundness,
                borderWidth: 2,
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
              }}
            >
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>
                {t('packs.pickup_code', { defaultValue: 'Código de levantamento' })}
              </Text>
              <Text
                variant="headlineSmall"
                style={{ fontWeight: 'bold', color: theme.colors.primary, fontFamily: 'monospace' }}
              >
                {item.pickupCode}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, textAlign: 'center' }}>
                {t('packs.present_at_camara', { defaultValue: 'Apresente este código na Câmara Municipal' })}
              </Text>
              <Text variant="labelSmall" style={{ color: statusStyle.color, marginTop: 4 }}>
                {t('packs.expires_on', { defaultValue: 'Expira em' })}: {new Date(item.expiresAt).toLocaleDateString()}
              </Text>
            </View>
          ) : (
            /* For non-active vouchers, show the code smaller and the relevant date */
            <View>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, fontFamily: 'monospace' }}>
                {item.pickupCode}
              </Text>
              {item.status === 'entregue' && item.validatedAt ? (
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {t('packs.delivered_on', { defaultValue: 'Entregue em' })}: {new Date(item.validatedAt).toLocaleDateString()}
                </Text>
              ) : null}
              {item.status === 'expirado' ? (
                <Text variant="labelSmall" style={{ color: statusStyle.color }}>
                  {t('packs.expired_on', { defaultValue: 'Expirou em' })}: {new Date(item.expiresAt).toLocaleDateString()}
                </Text>
              ) : null}
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  // --- Filter Chips Configuration ---
  const filters: { key: FilterStatus; label: string }[] = [
    { key: 'todos', label: t('packs.filter_all', { defaultValue: 'Todos' }) },
    { key: 'ativo', label: t('packs.filter_active', { defaultValue: 'Ativos' }) },
    { key: 'entregue', label: t('packs.filter_delivered', { defaultValue: 'Entregues' }) },
    { key: 'expirado', label: t('packs.filter_expired', { defaultValue: 'Expirados' }) },
  ];

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
          title={t('packs.my_purchases_title', { defaultValue: 'Minhas Compras' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
          {/* Points balance header */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {t('packs.your_balance', { defaultValue: 'Saldo de pontos' })}
            </Text>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.primary }}>
              {user?.Points ?? 0} {t('packs.points', { defaultValue: 'pts' })}
            </Text>
          </View>

          <Divider style={{ marginBottom: 8 }} />

          {/* Filter chips */}
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: 16,
              paddingBottom: 8,
              flexWrap: 'wrap',
            }}
          >
            {filters.map(filter => (
              <Chip
                key={filter.key}
                selected={activeFilter === filter.key}
                onPress={() => handleFilterChange(filter.key)}
                mode={activeFilter === filter.key ? 'flat' : 'outlined'}
              >
                {filter.label}
              </Chip>
            ))}
          </View>

          {/* Purchases list */}
          <FlatList
            data={purchases}
            renderItem={renderPurchase}
            keyExtractor={item => item._id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
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
                  style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
                >
                  {activeFilter === 'todos'
                    ? t('packs.no_purchases', { defaultValue: 'Ainda não comprou nenhum pacote.' })
                    : t('packs.no_purchases_filter', { defaultValue: 'Não tem compras neste estado.' })}
                </Text>
              </View>
            }
          />
        </SafeAreaView>
      </Surface>

      {/* Error dialog for error feedback */}
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

export default MyPurchases;
