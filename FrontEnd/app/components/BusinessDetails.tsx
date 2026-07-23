/**
 * BusinessDetails Screen
 *
 * Displays comprehensive details about a specific business, including logo,
 * description, photo gallery, active campaigns, and a location map.
 * It can receive initial data via route params to avoid a loading flash,
 * but always fetches fresh data from the backend on mount.
 *
 * Layout improvements:
 *   - Logo is now a full-width banner (16:9 aspect ratio) instead of a small
 *     circle, giving the screen a more modern "hero image" look.
 *   - Photo gallery is only shown if the business has real photos (the
 *     default empty string in the schema is filtered out).
 *   - Active campaigns section is only shown if there are active campaigns.
 */

import { ScrollView, View, Image, RefreshControl, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Map from './Map';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  IconButton,
  Surface,
  Text,
  useTheme,
  Appbar,
  TouchableRipple,
} from 'react-native-paper';

// Contexts & Constants
import MapRefType from '@/constants/Interfaces/MapRefType';
import { API_URL } from '@/constants/api';
import { useLoadingState } from '@/context/LoadingContext';

// Components
import LoadingScreen from './LoadingScreen';

const DetalhesBusiness = () => {
  // --- Hooks (Context & Router) ---
  const { t, i18n } = useTranslation();
  // Extracts params passed via router.push. 'id' is used for fetching,
  // 'dadosNegocio' is used to pre-populate state for instant UI rendering.
  const { dadosNegocio, id } = useLocalSearchParams<{
    dadosNegocio: string;
    id: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // Screen width — used to calculate the banner image height (16:9 ratio)
  const screenWidth = Dimensions.get('window').width;

  // --- Local State & Refs ---
  const [business, setBusiness] = useState(() =>
    JSON.parse(dadosNegocio || '{}'),
  );
  // Start in loading state immediately IF we don't have preloaded data.
  // This prevents the error screen from flashing before the fetch begins.
  const [loading, setLoading] = useState(!dadosNegocio);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapRefType>(null);

  // --- Effects ---

  /**
   * Fetches the latest business data from the backend.
   * Runs on mount or if the 'id' param changes.
   */
  useEffect(() => {
    if (!id) {
      setLoading(false); // Stop loading if there's no ID to fetch
      return;
    }

    const fetchBusiness = async (isRefresh = false) => {
      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
        const response = await fetch(`${API_URL}/negocios/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar');
        const data = await response.json();
        setBusiness(data);
      } catch (e) {
        console.error('Erro ao buscar negócio:', e);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

    fetchBusiness();
  }, [id]);

  /** Pull-to-refresh handler — refetches the business details. */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/negocios/${id}`);
      if (response.ok) {
        const data = await response.json();
        setBusiness(data);
      }
    } catch (e) {
      console.error('Erro ao atualizar negócio:', e);
    } finally {
      setRefreshing(false);
    }
  };

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the data is fetching.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Derived State ---
  const hasBusinessData = business && Object.keys(business).length > 0;

  // Filters campaigns to only show those that are approved and currently active (date range).
  // Memoized to prevent recalculating the filter on every component render.
  const campanhasAtivas = useMemo(() => {
    if (!business.campaigns) return [];
    const hoje = new Date();
    return business.campaigns.filter((c: any) => {
      const inicio = new Date(c.campaign.DataInicio);
      const fim = new Date(c.campaign.DataExpiracao);
      return c.status === 'aprovado' && hoje >= inicio && hoje <= fim;
    });
  }, [business.campaigns]);

  // --- Gallery filtering ---
  // The Business model has `gallery: { type: [], default: [""] }` which means
  // businesses with no photos still have an array containing one empty string.
  // We filter out empty/null/falsy values so the gallery section is only shown
  // when there are actual photos to display.
  const validGalleryPhotos = useMemo(() => {
    if (!business.gallery || !Array.isArray(business.gallery)) return [];
    return business.gallery.filter(
      (url: any) => url && typeof url === 'string' && url.trim() !== ''
    );
  }, [business.gallery]);

  // --- Helpers ---

  /**
   * Determines the correct URI for images.
   * Handles local file paths (from camera/picker) vs remote server paths.
   */
  const getImageUri = (uri: string) => {
    if (!uri) return '';
    if (
      uri.startsWith('file://') ||
      uri.startsWith('content://') ||
      uri.startsWith('http')
    ) {
      return uri;
    }
    return `${API_URL}${uri}`;
  };

  // --- Early Returns ---
  // Must occur AFTER all hooks (useState, useEffect, useMemo) have been declared.

  // 1. Error State: Show this ONLY if fetching is complete (loading=false) AND we have no data.
  if (!loading && !hasBusinessData) {
    return (
      <Surface
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
          padding: 20,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text
          variant="bodyLarge"
          style={{ marginBottom: 24, textAlign: 'center' }}
        >
          {t('merchant.error_load_business', {
            defaultValue: 'Não foi possível obter a informação deste negócio.',
          })}
        </Text>

        <TouchableRipple
          onPress={() => router.back()}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            backgroundColor: theme.colors.primaryContainer,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.go_back', {
            defaultValue: 'Voltar atrás',
          })}
        >
          <>
            <IconButton
              icon="arrow-left"
              size={20}
              color={theme.colors.onPrimaryContainer}
              style={{ margin: 0 }}
            />
            <Text
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: 'bold',
              }}
            >
              {t('common.back_btn', { defaultValue: 'Voltar' })}
            </Text>
          </>
        </TouchableRipple>
      </Surface>
    );
  }

  // 2. Loading State: Show this WHILE fetching (only if we don't have preloaded data to show yet).
  if (loading && !hasBusinessData) {
    return <LoadingScreen />;
  }

  // --- Render ---
  // If we reach here, we either have preloaded data or successfully fetched data.
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

      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['left', 'right']}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {/* --- Hero Banner (Logo) --- */}
          {/* Full-width banner image instead of a small circle.
              Uses 16:9 aspect ratio for a modern "hero" look.
              Falls back to a themed placeholder if no logo exists. */}
          {business.logo ? (
            <Image
              source={{ uri: getImageUri(business.logo) }}
              style={{
                width: '100%',
                height: screenWidth * 0.45, // ~16:9 aspect ratio
                backgroundColor: theme.colors.surfaceVariant,
              }}
              resizeMode="cover"
            />
          ) : (
            <Surface
              style={{
                width: '100%',
                height: screenWidth * 0.45,
                backgroundColor: theme.colors.surfaceVariant,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <IconButton
                icon="storefront"
                size={64}
                iconColor={theme.colors.onSurfaceVariant}
              />
            </Surface>
          )}

          {/* --- Main Info Section --- */}
          <View className="mt-5 px-5">
            {/* Category badge */}
            <Text
              variant="labelLarge"
              style={{
                color: theme.colors.primary,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {t(`categories.${business.category}`, {
                defaultValue: business.category,
              })}
            </Text>

            {/* Business name */}
            <Text
              variant="headlineMedium"
              className="mt-1 font-bold"
              style={{ color: theme.colors.onBackground }}
            >
              {business.name}
            </Text>

            {/* Owner name */}
            {business.owner?.name && (
              <Text
                variant="bodyMedium"
                className="mt-1"
                style={{ opacity: 0.7 }}
              >
                {t('merchant.by_owner', {
                  owner: business.owner.name,
                  defaultValue: `Por ${business.owner.name}`,
                })}
              </Text>
            )}

            <View className="h-6" />

            {/* Description */}
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {business.description ||
                t('common.no_description_available', {
                  defaultValue: 'Sem descrição disponível.',
                })}
            </Text>

            {/* --- Photo Gallery Section --- */}
            {/* Only rendered if the business has real photos.
                The default empty string in the schema is filtered out
                by the validGalleryPhotos memo above. */}
            {validGalleryPhotos.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', marginBottom: 12 }}
                >
                  {t('merchant.photo_gallery', {
                    defaultValue: 'Galeria de Fotos',
                  })}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {validGalleryPhotos.map((fotoUrl: string, index: number) => (
                    <Image
                      key={index}
                      source={{ uri: getImageUri(fotoUrl) }}
                      style={{
                        width: 200,
                        height: 150,
                        borderRadius: 12,
                        marginRight: 12,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* --- Active Campaigns Section --- */}
            {/* Only rendered if there are active campaigns. */}
            {campanhasAtivas.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', marginBottom: 8 }}
                >
                  {t('merchant.active_campaigns', {
                    defaultValue: 'Campanhas Ativas:',
                  })}
                </Text>

                {campanhasAtivas.map((c: any, index: number) => (
                  <Surface
                    key={index}
                    elevation={1}
                    style={{
                      marginBottom: 10,
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                  >
                    <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                      {c.campaign?.titulo ||
                        t('common.no_title_campaign', {
                          defaultValue: 'Campanha sem título',
                        })}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {t('merchant.valid_until', {
                        defaultValue: 'Válida até:',
                      })}{' '}
                      {new Date(c.campaign.DataExpiracao).toLocaleDateString(
                        i18n.language === 'pt' ? 'pt-PT' : 'en-US',
                      )}
                    </Text>
                  </Surface>
                ))}
              </View>
            )}

            {/* --- Location Map Section --- */}
            <Text
              variant="titleMedium"
              style={{ fontWeight: 'bold', marginTop: 32, marginBottom: 8 }}
            >
              {t('merchant.location', {
                defaultValue: 'Localização',
              })}
            </Text>
            <Surface
              style={{
                borderRadius: 16,
                elevation: 4,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  height: 240,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                }}
              >
                <Map
                  ref={mapRef}
                  location={business.location}
                  showPin={true}
                  readOnly
                />
              </View>
            </Surface>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

export default DetalhesBusiness;
