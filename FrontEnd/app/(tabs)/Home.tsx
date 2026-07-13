/**
 * Home Screen (Map Explorer)
 *
 * The primary dashboard for users to explore businesses on an interactive map.
 * It handles search, category filtering, proximity detection (businesses within 250m),
 * favorites management, and deep-linking to native map applications.
 */
import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import {
  View,
  ActivityIndicator,
  Linking,
  Platform,
  LayoutAnimation,
  FlatList,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import {
  Surface,
  Searchbar,
  IconButton,
  TouchableRipple,
  Text,
  FAB,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { ExpandingDot } from 'react-native-animated-pagination-dots';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { useTranslation } from 'react-i18next';

// Utils & Constants
import { images } from '../../constants/images';
import MapFocous from '@/constants/MapFocous';
import { calcularDistancia } from '../../utils/locationUtils';
import delay from '@/utils/delay';

// Components
import Map from '../components/Map';
import BusinessList from '../components/BusinessList';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import CustomChip from '../components/CustomChip';
import LoadingScreen from '../components/LoadingScreen';

// Types
import Negocio from '@/constants/Interfaces/Negocio';

import { useApiFetch } from '@/utils/apiFetch';
export default function Index() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState();
  const apiFetch = useApiFetch(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [listaNegocios, setListaNegocios] = useState<Negocio[]>([]);
  const [listaFiltrada, setListaFiltrada] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // UI Feedback state
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // Map & Proximity state
  const [showCloseBusiness, setShowCloseBusiness] = useState(false);
  const [itemVisivelId, setItemVisivelId] = useState<string | null>(null);
  const [loadingBusiness, setLoadingBusiness] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [bizInArea, setBizInArea] = useState<Negocio[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(
    null,
  );

  // Favorites state
  const [idsFavorite, setIdsFavorite] = useState<string[]>([]);
  const [loadingFav, setLoadingFav] = useState(false);

  // --- Refs ---
  const mapRef = useRef<any>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  // Config for determining when a carousel item is considered "visible" (50% threshold)
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  // --- Static Configuration ---
  const categories = [
    'Património & Museus',
    'Restauração',
    'Cafés & Pastelarias',
    'Alojamento',
    'Comércio Local',
    'Lazer & Natureza',
    'Serviços',
  ];

  // --- Derived/Memoized Values ---
  // Filter businesses based on selected category. Memoized to prevent unnecessary re-renders.
  const filteredPins = useMemo(() => {
    return listaNegocios.filter(
      pin => category === '' || pin.category === category,
    );
  }, [listaNegocios, category]);

  const isSelectedFavorite = negocioSelecionado
    ? idsFavorite.includes(negocioSelecionado._id)
    : false;

  // --- Handlers ---

  /** Fetches all approved businesses from the backend. */
  const fetchNegocios = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiFetch(`/negocios`);
      const dados = await response.json();
      const apenasAprovados = dados.filter(
        (item: Negocio) => item.status === 'aprovado',
      );
      setListaNegocios(apenasAprovados);
    } catch (error) {
      console.log('Erro ao obter negócios', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Fetches the user's favorite business IDs to sync heart icons. */
  const fetchFavorite = useCallback(async () => {
    if (!user?.id) return;
    try {
      // The /meusFavoritos endpoint requires JWT authentication
      // (authorize(["cidadao", "comerciante", "camara"]) middleware).
      // Without this header the request is rejected with 401 and the
      // heart icons on the map never reflect the user's favorites.
      const response = await apiFetch(`/meusFavoritos/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const dados = await response.json();
      const lista = Array.isArray(dados) ? dados : dados.favoritos || [];
      const ids = lista.map(
        (fav: any) => fav.businessId?._id || fav.businessId._id,
      );
      setIdsFavorite(ids);
    } catch (error) {
      console.log('Erro ao obter favoritos:', error);
    }
  }, [user?.id, user?.token]);

  /** Toggles favorite status using Optimistic UI updates for instant feedback. */
  const toggleFavorite = async (businessId: string) => {
    if (!user?.id) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('home.warning_session'));
      setDialogVisible(true);
      return;
    }

    setLoadingFav(true);
    const currentFav = idsFavorite.includes(businessId);
    const endpoint = currentFav ? '/retirarFavorito' : '/guardarFavorito';

    // Optimistic Update: Update UI immediately
    if (currentFav) {
      setIdsFavorite(prev => prev.filter(id => id !== businessId));
    } else {
      setIdsFavorite(prev => [...prev, businessId]);
    }

    try {
      const response = await apiFetch(`${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id, businessId }),
      });
      if (!response.ok) throw new Error('Failed to update favorite');
    } catch (error) {
      // Revert UI on failure
      if (currentFav) {
        setIdsFavorite(prev => [...prev, businessId]);
      } else {
        setIdsFavorite(prev => prev.filter(id => id !== businessId));
      }
      setDialogTitle(t('common.error'));
      setDialogText(t('home.error_update_fav'));
      setDialogVisible(true);
    } finally {
      setLoadingFav(false);
    }
  };

  /** Filters businesses based on search query and triggers a smooth layout animation. */
  const onChangeSearch = (query: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery(query);

    if (query === '') {
      setListaFiltrada([]);
    } else {
      const filtrados = listaNegocios.filter(item => {
        const coincideNome = item.name
          ?.toLowerCase()
          .includes(query.toLowerCase());
        const coincideCategoria = category === '' || item.category === category;
        return coincideNome && coincideCategoria;
      });
      setListaFiltrada(filtrados);
    }
  };

  /** Calculates which businesses are within 250m of the user's location. */
  const inRange = (isManualClick = false) => {
    if (listaNegocios.length === 0 || !userLocation) {
      if (isManualClick) {
        setDialogTitle(t('common.warning'));
        setDialogText(t('home.warning_no_nearby'));
        setDialogVisible(true);
      }
      return;
    }

    setLoadingBusiness(true);
    const closeBiz = filteredPins.filter(negocio => {
      const distancia = calcularDistancia(
        negocio.location.lat,
        negocio.location.long,
        userLocation.latitude,
        userLocation.longitude,
      );
      return (!category || negocio.category === category) && distancia <= 250;
    });

    if (closeBiz.length === 0 && isManualClick) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('home.warning_no_nearby'));
      setDialogVisible(true);
    }

    setBizInArea(closeBiz);
    setLoadingBusiness(false);
  };

  /** Opens the native map app (Apple Maps or Google Maps) via deep linking. */
  const openExternalMap = (business: Negocio) => {
    const { lat, long } = business.location;
    if (Platform.OS === 'ios') {
      // Apple Maps URL scheme
      const url = `maps://?q=${business.name}&ll=${lat},${long}`;
      Linking.openURL(url).catch(() => {
        setDialogTitle(t('common.error'));
        setDialogText(t('home.error_apple_maps'));
        setDialogVisible(true);
      });
    } else {
      // Android Geo URI scheme
      const url = `geo:${lat},${long}?q=${lat},${long}(${business.name})`;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback to web browser Google Maps
          Linking.openURL(
            `https://www.google.com/maps/search/?api=1&query=${lat},${long}`,
          );
        }
      });
    }
  };

  /** Tracks which carousel item is currently in view to sync with map focus. */
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems.length > 0) {
        const itemVisivel = viewableItems[0].item;
        setItemVisivelId(itemVisivel._id);
        setNegocioSelecionado(itemVisivel);
        MapFocous(itemVisivel, mapRef);
      }
    },
  ).current;

  /** Callback for Map component to pass user location updates back to Home. */
  const handleUserLocationUpdate = useCallback(
    (coord: { latitude: number; longitude: number } | null) => {
      setUserLocation(coord);
    },
    [],
  );

  /**
   * Handles navigation to Business Details.
   * Clears the selected business and proximity list so the card disappears when returning.
   */
  const handleNavigateToDetails = async (id: string) => {
    setNegocioSelecionado(null);
    setShowCloseBusiness(false);

    setLoadingBusiness(true);
    await delay(300); // Small delay to show loading state before navigation
    setLoadingBusiness(false);

    router.push({
      pathname: '/components/BusinessDetails',
      params: { id },
    });
  };

  // --- Effects ---

  /** Fetches data when the screen gains focus. */
  useFocusEffect(
    useCallback(() => {
      fetchNegocios();
      fetchFavorite();
    }, [fetchNegocios, fetchFavorite]),
  );

  /** Re-calculates nearby businesses when the selected category changes. */
  useEffect(() => {
    inRange(false);
    if (
      category !== '' &&
      negocioSelecionado != null &&
      filteredPins.length > 0
    ) {
      setNegocioSelecionado(filteredPins[0]);
      mapRef.current?.focusOnLocation(
        filteredPins[0].location.lat,
        filteredPins[0].location.long,
      );
    }
  }, [category]);

  /** Syncs local loading state with global context to hide global FAB during fetches. */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <Map
          ref={mapRef}
          showPin={false}
          businesses={filteredPins}
          readOnly
          onMarkerPress={biz => {
            setNegocioSelecionado(biz);
            setShowCloseBusiness(false);
            setListaFiltrada([]);
          }}
          onUserLocationUpdate={handleUserLocationUpdate}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        <View style={{ marginTop: 10 }}>
          <Searchbar
            placeholder={t('home.search_placeholder')}
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ borderRadius: 12, marginHorizontal: 12 }}
          />

          {listaFiltrada.length > 0 && (
            <View style={{ marginTop: 8, maxHeight: 300 }}>
              <FlatList
                key={category || 'all'}
                data={listaFiltrada}
                keyExtractor={item => item._id}
                renderItem={({ item }) => (
                  <Surface
                    elevation={2}
                    style={{
                      borderRadius: 12,
                      marginBottom: 8,
                      overflow: 'hidden',
                    }}
                  >
                    <TouchableRipple
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={item.name}
                      accessibilityHint={t('accessibility.focus_business')}
                      onPress={() => {
                        MapFocous(item, mapRef);
                        setListaFiltrada([]);
                        setNegocioSelecionado(item);
                      }}
                    >
                      <BusinessList
                        name={item.name}
                        category={t(`categories.${item.category}` as any, {
                          defaultValue: item.category,
                        })}
                      />
                    </TouchableRipple>
                  </Surface>
                )}
              />
            </View>
          )}

          <ScrollView
            style={{ minHeight: 44, height: 55 }}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {categories.map(cat => (
              <CustomChip
                key={cat}
                isSelected={category === cat}
                onPress={() => setCategory(category === cat ? '' : cat)}
                className="mr-1 mt-2 h-[40px]"
              >
                {t(`categories.${cat}` as any, { defaultValue: cat })}
              </CustomChip>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Selected Business Card (Bottom Sheet style) */}
      {negocioSelecionado && !showCloseBusiness && (
        <View
          style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            height: 250,
            elevation: 10,
            zIndex: 1000,
          }}
          pointerEvents="box-none"
        >
          <TouchableRipple
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={negocioSelecionado.name}
            accessibilityHint={t('accessibility.open_details')}
            disabled={loadingBusiness}
            style={{
              flex: 1,
              justifyContent: 'flex-end',
              paddingHorizontal: 20,
              paddingBottom: 10,
            }}
            onPress={() => {
              handleNavigateToDetails(negocioSelecionado._id);
            }}
          >
            <Surface
              elevation={5}
              style={{
                width: 320,
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 20,
                padding: 20,
                alignSelf: 'center',
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      fontSize: 22,
                      fontWeight: 'bold',
                    }}
                  >
                    {negocioSelecionado.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      fontSize: 14,
                    }}
                  >
                    {t(`categories.${negocioSelecionado.category}` as any, {
                      defaultValue: negocioSelecionado.category,
                    })}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  accessible={true}
                  accessibilityLabel={t('common.close_window')}
                  accessibilityHint={t('accessibility.close_info')}
                  iconColor={theme.colors.onSecondaryContainer}
                  onPress={() => setNegocioSelecionado(null)}
                />
              </View>

              <View
                style={{
                  marginVertical: 15,
                  borderTopWidth: 0.5,
                  borderColor: theme.colors.outlineVariant,
                  paddingTop: 15,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    marginBottom: 5,
                  }}
                >
                  {negocioSelecionado.address
                    ? negocioSelecionado.address
                    : `Lat: ${negocioSelecionado.location.lat.toFixed(4)} | long: ${negocioSelecionado.location.long.toFixed(4)}`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {/* Favorite Button */}
                <TouchableRipple
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={
                    isSelectedFavorite
                      ? `Remover ${negocioSelecionado.name} dos favoritos`
                      : `Adicionar ${negocioSelecionado.name} aos favoritos`
                  }
                  disabled={loadingFav}
                  style={{
                    backgroundColor: isSelectedFavorite
                      ? theme.colors.errorContainer
                      : theme.colors.surfaceVariant,
                    paddingHorizontal: 15,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isSelectedFavorite
                      ? theme.colors.error
                      : theme.colors.outlineVariant,
                  }}
                  onPress={() => toggleFavorite(negocioSelecionado._id)}
                >
                  {loadingFav ? (
                    <ActivityIndicator size={24} color={theme.colors.primary} />
                  ) : (
                    <IconButton
                      icon={isSelectedFavorite ? 'heart' : 'heart-outline'}
                      accessible={true}
                      accessibilityLabel={
                        isSelectedFavorite
                          ? t('accessibility.remove_favorite_name', {
                              name: negocioSelecionado.name,
                            })
                          : t('accessibility.add_favorite_name', {
                              name: negocioSelecionado.name,
                            })
                      }
                      iconColor={theme.colors.error}
                      style={{ margin: 0 }}
                    />
                  )}
                </TouchableRipple>

                {/* Open in Maps Button */}
                <TouchableRipple
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={negocioSelecionado.name}
                  accessibilityHint={t('accessibility.open_map')}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.primary,
                    paddingVertical: 14,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onPress={() => openExternalMap(negocioSelecionado)}
                >
                  <Text
                    style={{
                      color: theme.colors.onPrimary,
                      fontWeight: 'bold',
                      fontSize: 16,
                    }}
                  >
                    {t('home.see_on_map')}
                  </Text>
                </TouchableRipple>
              </View>
            </Surface>
          </TouchableRipple>
        </View>
      )}

      {/* Nearby Businesses Carousel */}
      {bizInArea.length > 0 && showCloseBusiness && (
        <View
          style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            right: 0,
            zIndex: 2000,
            elevation: 20,
          }}
        >
          <FlatList
            key={category || 'all'}
            data={bizInArea}
            keyExtractor={item => item._id}
            horizontal={true}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: (Dimensions.get('window').width - 320) / 2,
              paddingBottom: 40,
            }}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // Pagination snapping: item width (320) + margin (15) = 335
            snapToInterval={335}
            decelerationRate="fast"
            snapToAlignment="start"
            renderItem={({ item }) => {
              const isFavorite = idsFavorite.includes(item._id);
              return (
                <TouchableRipple
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={item.name}
                  accessibilityHint={t('accessibility.open_details')}
                  disabled={loadingBusiness}
                  onPress={() => {
                    handleNavigateToDetails(item._id);
                  }}
                >
                  <Surface
                    elevation={5}
                    style={{
                      width: 320,
                      marginRight: 15,
                      backgroundColor: theme.colors.secondaryContainer,
                      borderRadius: 20,
                      padding: 20,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            color: theme.colors.onSecondaryContainer,
                            fontSize: 22,
                            fontWeight: 'bold',
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.onSecondaryContainer,
                            fontSize: 14,
                          }}
                        >
                          {t(`categories.${item.category}` as any, {
                            defaultValue: item.category,
                          })}
                        </Text>
                      </View>
                      <IconButton
                        icon="close"
                        accessible={true}
                        accessibilityLabel={t('common.close_window')}
                        accessibilityHint={t('accessibility.close_business')}
                        iconColor={theme.colors.onSecondaryContainer}
                        onPress={() => {
                          setNegocioSelecionado(null);
                          setShowCloseBusiness(false);
                        }}
                      />
                    </View>

                    <View
                      style={{
                        marginVertical: 15,
                        borderTopWidth: 0.5,
                        borderColor: theme.colors.outlineVariant,
                        paddingTop: 15,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onSecondaryContainer,
                          marginBottom: 5,
                        }}
                      >
                        {item.address
                          ? item.address
                          : `Lat: ${item.location.lat.toFixed(4)} | long: ${item.location.long.toFixed(4)}`}
                      </Text>
                    </View>

                    <View
                      style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}
                    >
                      {/* Favorite Button */}
                      <TouchableRipple
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={
                          isFavorite
                            ? `Remover ${item.name} dos favoritos`
                            : `Adicionar ${item.name} aos favoritos`
                        }
                        disabled={loadingFav}
                        style={{
                          backgroundColor: isFavorite
                            ? theme.colors.errorContainer
                            : theme.colors.surfaceVariant,
                          paddingHorizontal: 15,
                          borderRadius: 12,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1,
                          borderColor: isFavorite
                            ? theme.colors.error
                            : theme.colors.outlineVariant,
                        }}
                        onPress={() => toggleFavorite(item._id)}
                      >
                        {loadingFav ? (
                          <ActivityIndicator
                            size={24}
                            color={theme.colors.primary}
                          />
                        ) : (
                          <IconButton
                            icon={isFavorite ? 'heart' : 'heart-outline'}
                            accessible={true}
                            accessibilityLabel={
                              isFavorite
                                ? t('accessibility.remove_favorite_name', {
                                    name: item.name,
                                  })
                                : t('accessibility.add_favorite_name', {
                                    name: item.name,
                                  })
                            }
                            iconColor={theme.colors.error}
                            style={{ margin: 0 }}
                          />
                        )}
                      </TouchableRipple>

                      {/* Open in Maps Button */}
                      <TouchableRipple
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={item.name}
                        accessibilityHint={t('accessibility.open_map')}
                        style={{
                          flex: 1,
                          backgroundColor: theme.colors.primary,
                          paddingVertical: 14,
                          borderRadius: 12,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => openExternalMap(item)}
                      >
                        <Text
                          style={{
                            color: theme.colors.onPrimary,
                            fontWeight: 'bold',
                            fontSize: 16,
                          }}
                        >
                          {t('home.see_on_map')}
                        </Text>
                      </TouchableRipple>
                    </View>
                  </Surface>
                </TouchableRipple>
              );
            }}
          />
          <ExpandingDot
            data={bizInArea}
            expandingDotWidth={20}
            scrollX={scrollX}
            inActiveDotOpacity={0.6}
            activeDotColor={theme.colors.primary}
            inActiveDotColor={theme.colors.primary}
            dotStyle={{ width: 5, height: 5, borderRadius: 5 }}
            containerStyle={{
              width: 320,
              backgroundColor: theme.colors.secondaryContainer,
              borderRadius: 20,
              padding: 10,
            }}
          />
        </View>
      )}

      {/* Floating Action Button for Proximity Search */}
      <FAB
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={t('home.search_near')}
        accessibilityHint={t('accessibility.search_area')}
        icon={images.bagImg}
        style={{
          position: 'absolute',
          margin: 16,
          right: 0,
          bottom: 160,
          backgroundColor: theme.colors.primary,
        }}
        color={theme.colors.onPrimary}
        loading={loadingBusiness}
        onPress={() => {
          setShowCloseBusiness(true);
          inRange(true);
        }}
        disabled={loadingBusiness}
      />

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
    </View>
  );
}
