/**
 * BusinessCandidates Screen
 *
 * Displays a list of pending businesses awaiting approval by the City Council ('camara').
 * It fetches both the pending businesses and their respective owners in parallel,
 * and provides UI actions to approve or reject (discard) each request.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  TouchableRipple,
  Surface,
  Text,
  Divider,
  Appbar,
  Dialog,
  Portal,
} from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
// Components
import CustomButton from './CustomButton';
import CustomDialog from './CustomDialog';
import BusinessList from './BusinessList';
import LoadingScreen from './LoadingScreen';

import { useApiFetch } from '@/utils/apiFetch';
// --- Interfaces ---
interface Business {
  _id: string;
  name: string;
  category: string;
  owner: string;
  status: string;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
}

export default function AprovarNegocios() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState();
  const apiFetch = useApiFetch(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [pendentes, setPendentes] = useState<Business[]>([]);
  const [pendOwners, setPendOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // UI Feedback state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // Discard confirmation dialog state
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [discardId, setDiscardId] = useState<string | null>(null);

  // --- Handlers ---

  /**
   * Fetches pending businesses and their owners concurrently using Promise.all.
   * Wrapped in useCallback to provide a stable reference for useEffect and onRefresh.
   */
  const carregarDados = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [resPendentes, resOwners] = await Promise.all([
        apiFetch(`/business/pendentes`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
        apiFetch(`/utilizador/negocioPendentes`, {
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (resPendentes.ok) setPendentes(await resPendentes.json());
      if (resOwners.ok) setPendOwners(await resOwners.json());
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load'));
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  }, [user?.token, t]);

  /** Approves a business and removes it from the local pending list optimistically. */
  const handleAprovar = async (id: string) => {
    try {
      const response = await apiFetch(`/business/aprovar/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPendentes(prev => prev.filter(item => item._id !== id));
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.server_reject_approve'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.fail_approve'));
      setDialogVisible(true);
    }
  };

  /** Opens the confirmation dialog before discarding a business. */
  const handleDescartar = (id: string) => {
    setDiscardId(id);
    setDiscardDialogVisible(true);
  };

  /** Executes the discard API call after confirmation. */
  const executeDescartar = async (id: string) => {
    try {
      const response = await apiFetch(`/business/rejeitar/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPendentes(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.fail_discard'));
      setDialogVisible(true);
    }
  };

  /** Pull-to-refresh handler. */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await carregarDados();
    } catch (err) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load_info'));
      setDialogVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [carregarDados, t]);

  // --- Effects ---

  // Initial data fetch
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

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

      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['left', 'right']}
        className="p-4"
      >
        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: 'bold',
            marginBottom: 10,
          }}
        >
          {t('camara.businesses_title')}
        </Text>

        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        {pendentes.length === 0 ? (
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
            className="mt-10 text-center"
          >
            {t('camara.no_new_businesses')}
          </Text>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]} // Android
                tintColor={theme.colors.primary} // iOS
              />
            }
            data={pendentes}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              // Find the owner details for the current business
              const donoEspecifico = pendOwners.find(
                dono => dono._id === item.owner,
              );

              return (
                <Surface
                  style={{
                    borderRadius: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant,
                    overflow: 'hidden', // Clips the TouchableRipple to the border radius
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                  elevation={1}
                >
                  <TouchableRipple
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.open_details_name', {
                      name: item.name,
                      defaultValue: `Ver detalhes de ${item.name}`,
                    })}
                    accessibilityHint={t('accessibility.open_details')}
                    onPress={() => {
                      router.push({
                        pathname: '/components/BusinessDetails',
                        params: { id: item._id },
                      });
                    }}
                    rippleColor="rgba(150, 150, 150, 0.2)"
                  >
                    <View className="p-1">
                      <BusinessList
                        name={item.name}
                        category={item.category}
                        ownerName={
                          donoEspecifico?.name ||
                          t('common.loading_short', {
                            defaultValue: 'A carregar...',
                          })
                        }
                      />
                    </View>
                  </TouchableRipple>

                  <View className="flex-row gap-x-3 px-4 pb-4">
                    {/* Approve Button */}
                    <CustomButton
                      className="flex-1"
                      onPress={() => handleAprovar(item._id)}
                      textColor={theme.colors.onPrimary}
                      buttonColor={theme.colors.primary}
                      accessibilityLabel={t(
                        'accessibility.accept_business_name',
                        {
                          name: item.name,
                          defaultValue: `Aceitar negócio ${item.name}`,
                        },
                      )}
                      accessibilityHint={t('accessibility.approve_business')}
                    >
                      {t('common.accept', { defaultValue: 'Aceitar' })}
                    </CustomButton>

                    {/* Discard Button */}
                    <CustomButton
                      className="flex-1"
                      onPress={() => handleDescartar(item._id)}
                      buttonColor={theme.colors.errorContainer}
                      textColor={theme.colors.onErrorContainer}
                      accessibilityLabel={t(
                        'accessibility.discard_business_name',
                        {
                          name: item.name,
                          defaultValue: `Descartar negócio ${item.name}`,
                        },
                      )}
                      accessibilityHint={t('accessibility.reject_business')}
                    >
                      {t('common.discard', { defaultValue: 'Descartar' })}
                    </CustomButton>
                  </View>
                </Surface>
              );
            }}
          />
        )}
      </SafeAreaView>

      {/* Discard Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={discardDialogVisible}
          onDismiss={() => setDiscardDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>{t('common.confirm')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              {t('camara.reject_confirm_biz', {
                defaultValue:
                  'Tens a certeza que queres descartar este pedido?',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <CustomButton
              onPress={() => setDiscardDialogVisible(false)}
              buttonColor={theme.colors.surfaceVariant}
              textColor={theme.colors.onSurface}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </CustomButton>
            <CustomButton
              onPress={async () => {
                setDiscardDialogVisible(false);
                if (discardId) {
                  await executeDescartar(discardId);
                  setDiscardId(null);
                }
              }}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
            >
              {t('common.discard', { defaultValue: 'Descartar' })}
            </CustomButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Global Error/Info Dialog */}
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
