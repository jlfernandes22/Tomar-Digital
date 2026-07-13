/**
 * BusinessMine Screen
 *
 * Displays a list of businesses owned by the authenticated merchant.
 * It fetches data when the screen comes into focus and provides a fallback
 * UI with a call-to-action if the merchant has no registered businesses.
 *
 * TOKEN EXPIRY HANDLING:
 * This screen uses `useApiFetch()` instead of raw `fetch()`. The hook
 * automatically:
 * - Adds the Authorization header with the user's JWT
 * - Detects 401 responses (expired/invalid token) and triggers logout
 * - Redirects the user to the login screen
 *
 * This fixes the bug where a comerciante with an expired token would see
 * "Could not load businesses" on this screen without being logged out.
 */
import React, { useState, useCallback, useEffect } from 'react';
import { Image, FlatList, View, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import {
  Surface,
  useTheme,
  Text,
  TouchableRipple,
  Divider,
} from 'react-native-paper';
import { useTranslation } from 'react-i18next';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useLoadingState } from '@/context/LoadingContext';
import { useApiFetch } from '@/utils/apiFetch';
import { images } from '@/constants/images';

// Components
import BusinessList from '../components/BusinessList';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomButton from '../components/CustomButton';
import LoadingScreen from '../components/LoadingScreen';

// Type Definitions
interface Business {
  _id: string;
  name: string;
  category: string;
  location: {
    lat: number;
    long: number;
  };
  address?: string;
  status: string;
  owner: {
    _id: string;
    name: string;
  };
}

const MyBusinesses = () => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const theme = useTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync with global FAB visibility

  // --- API Fetch (with auto-logout on 401) ---
  // useApiFetch returns a function that automatically:
  //   1. Adds `Authorization: Bearer <token>` to every request
  //   2. Calls `logout()` when the backend returns 401 (expired token)
  // This replaces the old pattern of manually setting the Authorization
  // header and not handling 401s.
  const apiFetch = useApiFetch();

  // --- Local State ---
  const [negocios, setNegocios] = useState<Business[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // --- Handlers ---

  /**
   * Fetches the user's approved businesses from the backend.
   * Wrapped in useCallback to ensure a stable reference for useFocusEffect,
   * preventing unnecessary re-renders when the screen regains focus.
   *
   * Uses apiFetch instead of raw fetch — if the token is expired, the user
   * is automatically logged out and redirected to login by the hook.
   */
  const carregarNegocios = useCallback(
    async (isRefresh = false) => {
      if (!user?.token) return;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        // apiFetch automatically adds the Authorization header and handles 401.
        const response = await apiFetch('/meusNegocios', {
          method: 'GET',
        });

        // If the token was expired, apiFetch already triggered logout and
        // the user is being redirected. We can bail out early.
        if (response.status === 401) {
          return;
        }

        if (!response.ok) {
          throw new Error(t('myBusinesses.error_load'));
        }

        const dados = await response.json();
        setNegocios(Array.isArray(dados) ? dados : []);
      } catch (error: any) {
        console.error('Erro ao carregar negócios', error);
        setSnackbarMessage(
          t('myBusinesses.error_load_msg', { error: error.message }),
        );
        setSnackbarVisible(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.token, apiFetch, t],
  );

  /** Pull-to-refresh handler. */
  const handleRefresh = useCallback(() => {
    carregarNegocios(true);
  }, [carregarNegocios]);

  // --- Effects ---

  /**
   * useFocusEffect triggers the fetch whenever the tab gains focus.
   * This ensures the list is up-to-date if the user adds a new business
   * and navigates back to this tab.
   */
  useFocusEffect(
    useCallback(() => {
      carregarNegocios();
    }, [carregarNegocios]),
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
  // Because we manage 'loading' state here, we don't need a conditional
  // inside the main return block.
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
      <Text
        variant="headlineMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
        {t('myBusinesses.title')}
      </Text>

      <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />

      <FlatList
        data={negocios}
        keyExtractor={(item: Business) => item._id}
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
              }}
            >
              {/*
                Inner View wrapper is used to clip the TouchableRipple effect 
                so the ripple animation respects the 12px border radius.
              */}
              <View style={{ borderRadius: 12, overflow: 'hidden' }}>
                <TouchableRipple
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityHint={t('accessibility.open_details')}
                  onPress={() => {
                    router.push({
                      pathname: '/components/BusinessDetails',
                      params: { id: item._id },
                    });
                  }}
                  rippleColor="rgba(150, 150, 150, 0.2)"
                >
                  <View className="p-4">
                    <BusinessList
                      name={item.name}
                      category={item.category}
                      location={item.location}
                    />

                    <Text
                      variant="bodySmall"
                      style={{
                        marginTop: 8,
                        color: theme.colors.onSecondaryContainer,
                        fontStyle: 'italic',
                        opacity: 0.8,
                      }}
                    >
                      {t('myBusinesses.owner_name', {
                        name: item.owner?.name || 'N/A',
                      })}
                    </Text>
                  </View>
                </TouchableRipple>
              </View>
            </Surface>
          </View>
        )}
        // Rendered when the 'negocios' array is empty.
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-10 pb-20">
            <Image
              source={images.bagImg}
              className="mb-8 h-64 w-64"
              style={{
                tintColor: theme.colors.onSurfaceVariant,
                opacity: 0.6,
              }}
              resizeMode="contain"
            />

            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
              className="mb-2 text-center"
            >
              {t('myBusinesses.no_businesses')}
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
              className="mb-10 text-center opacity-70"
            >
              {t('myBusinesses.empty_message')}
            </Text>

            <CustomButton
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => router.push('/(tabs)/BusinessAdd')}
              className="h-14 w-full"
              icon="plus"
              accessibilityLabel={t('myBusinesses.register_new')}
              accessibilityHint={t('accessibility.register_business')}
            >
              {t('myBusinesses.register_new')}
            </CustomButton>
          </View>
        }
      />

      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
};

export default MyBusinesses;
