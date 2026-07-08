/**
 * Saved Screen (Favorites)
 *
 * Displays a list of businesses the user has saved as favorites.
 * It fetches data when the screen comes into focus and implements an
 * "Optimistic UI" pattern when removing items for instant visual feedback.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Image, FlatList, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Surface, Text, TouchableRipple, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';
import { images } from '@/constants/images';

// Components
import BusinessList from '../components/BusinessList';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import LoadingScreen from '../components/LoadingScreen';

// Types
import Favorito from '@/constants/Interfaces/Favorites';

const Saved = () => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // UI Feedback state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // --- Handlers ---

  /**
   * Fetches the user's favorite businesses from the backend.
   * Wrapped in useCallback to ensure a stable reference for useFocusEffect,
   * preventing unnecessary re-renders when the screen regains focus.
   */
  const carregarFavoritos = useCallback(async (isRefresh = false) => {
    if (!user?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const response = await fetch(`${API_URL}/meusFavoritos/${user.id}`);
      const dados = await response.json();

      // Ensure we always have an array to render, even if the API returns an object or null
      const listaFinal = Array.isArray(dados) ? dados : dados.favoritos || [];
      setFavoritos(listaFinal);
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(`${t('common.error')}\n${error}`);
      setDialogVisible(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id, t]);

  /** Pull-to-refresh handler. */
  const handleRefresh = useCallback(() => {
    carregarFavoritos(true);
  }, [carregarFavoritos]);

  /**
   * Removes a business from favorites using an Optimistic UI approach.
   * The item is removed from the local state immediately for instant feedback.
   * If the API call fails, we revert the state by re-fetching the list.
   */
  const retirarFavorito = useCallback(
    async (businessId: string) => {
      // 1. Optimistic Update: Remove from UI immediately
      setFavoritos(prev =>
        prev.filter(item => item.businessId?._id !== businessId),
      );

      try {
        const response = await fetch(`${API_URL}/retirarFavorito`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?.id, businessId }),
        });

        if (response.ok) {
          setSnackbarMessage(t('common.success'));
          setSnackbarVisible(true);
          // No need to call carregarFavoritos() here; the local state is already correct.
        } else {
          // 2. Revert on failure: Re-fetch to restore the item to the list
          carregarFavoritos();
          setDialogTitle(t('common.error'));
          setDialogText(t('common.error'));
          setDialogVisible(true);
        }
      } catch (error) {
        // 2. Revert on network error
        carregarFavoritos();
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error'));
        setDialogVisible(true);
      }
    },
    [user?.id, carregarFavoritos, t],
  );

  // --- Effects ---

  /**
   * useFocusEffect triggers the fetch whenever the tab gains focus.
   * This ensures the list is up-to-date if the user removes a favorite
   * from another screen (like BusinessDetails) and navigates back.
   */
  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [carregarFavoritos]),
  );

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
  // Placed after all hooks have been declared.
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <SafeAreaView
      className="p-4"
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <Text
        variant="headlineMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
        {t('saved.title')}
      </Text>
      <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />

      <FlatList
        data={favoritos}
        keyExtractor={(item: any) => item._id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        renderItem={({ item }) => (
          <View className="relative">
            <Surface
              elevation={1}
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                overflow: 'hidden', // Clips the TouchableRipple to the border radius
              }}
            >
              <TouchableRipple
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  item.businessId?.name
                    ? t('accessibility.open_details_name', {
                        name: item.businessId.name,
                      })
                    : t('accessibility.open_details_generic')
                }
                accessibilityHint={t('accessibility.open_details')}
                onPress={() => {
                  router.push({
                    pathname: '/components/BusinessDetails',
                    params: { id: item.businessId?._id },
                  });
                }}
                rippleColor="rgba(150, 150, 150, 0.2)"
              >
                <View className="p-1">
                  <BusinessList
                    name={
                      item.businessId?.name || t('saved.business_not_available')
                    }
                    category={
                      item.businessId?.category
                        ? t(`categories.${item.businessId.category}` as any, {
                            defaultValue: item.businessId.category,
                          })
                        : 'N/A'
                    }
                    location={item.businessId?.location || ''}
                  />
                </View>
              </TouchableRipple>

              {/* Remove Button Section */}
              <View className="flex-row gap-x-3 px-4 pb-4">
                <CustomButton
                  className="flex-1"
                  buttonColor={theme.colors.error}
                  accessibilityLabel={
                    item.businessId?.name
                      ? `${t('saved.remove')} ${item.businessId.name}`
                      : t('saved.remove')
                  }
                  accessibilityHint={t('accessibility.remove_favorite')}
                  onPress={() => {
                    if (item.businessId) retirarFavorito(item.businessId._id);
                  }}
                >
                  {t('saved.remove')}
                </CustomButton>
              </View>
            </Surface>
          </View>
        )}
        // Rendered when the 'favoritos' array is empty.
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-10 pb-20">
            <Image
              source={images.favWaiting}
              className="mb-8 h-64 w-64"
              style={{ tintColor: theme.colors.onSurfaceVariant, opacity: 0.6 }}
              resizeMode="contain"
            />

            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
              className="mb-2 text-center"
            >
              {t('common.empty_list')}
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
              className="mb-10 text-center opacity-70"
            >
              {t('saved.empty_message')}
            </Text>

            <CustomButton
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => router.push('/Home')}
              className="h-14 w-full"
              accessibilityLabel={t('saved.discover_businesses')}
              accessibilityHint={t('accessibility.go_home')}
            >
              {t('saved.discover_businesses')}
            </CustomButton>
          </View>
        }
      />

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
    </SafeAreaView>
  );
};

export default Saved;
