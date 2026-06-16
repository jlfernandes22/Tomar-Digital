import { View, Image, Dimensions } from 'react-native';
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import MapView, { Marker, Circle } from 'react-native-maps';
import { FAB, Text } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import * as Location from 'expo-location';
import CustomDialog from './CustomDialog';
import { useTranslation } from 'react-i18next';
import MapProps from '@/constants/Interfaces/MapProps';
import MapRefType from '@/constants/Interfaces/MapRefType';
import darkMapStyle from '@/constants/DarkMapStyle';
import { images } from '@/constants/images';
import NegocioInterface from '@/constants/Interfaces/Negocio';
import { useClusterer, isClusterFeature } from 'react-native-clusterer';

// 1. Get screen dimensions for the cluster algorithm
const { width, height } = Dimensions.get('window');
const MAP_DIMENSIONS = { width, height };

// --- INLINE COMPONENT FOR CUSTOM MARKERS ---
// Wrapped in React.memo to prevent flickering as clusters form/break
const InlineBusinessMarker = React.memo(
  ({
    biz,
    mapRef,
    onMarkerPress,
    theme,
  }: {
    biz: NegocioInterface;
    mapRef: React.RefObject<MapView | null>;
    onMarkerPress?: (biz: NegocioInterface) => void;
    theme: any;
  }) => {
    const [loaded, setLoaded] = useState(false);

    let iconSource = images.storeFront;
    if (biz.category === 'Restauração') iconSource = images.silverware;
    else if (biz.category === 'Alojamento') iconSource = images.bed;
    else if (biz.category === 'Cafés & Pastelarias') iconSource = images.coffee;
    else if (biz.category === 'Comércio Local') iconSource = images.shopping;
    else if (biz.category === 'Património & Museus') iconSource = images.bank;
    else if (biz.category === 'Lazer & Natureza') iconSource = images.tree;
    else if (biz.category === 'Serviços') iconSource = images.briefcase;

    return (
      <Marker
        coordinate={{
          latitude: biz.location.lat,
          longitude: biz.location.long,
        }}
        tracksViewChanges={!loaded}
        anchor={{ x: 0.5, y: 0.5 }}
        onPress={() => {
          mapRef.current?.animateToRegion(
            {
              latitude: biz.location.lat,
              longitude: biz.location.long,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            },
            1500,
          );
          if (onMarkerPress) onMarkerPress(biz);
        }}
      >
        <Image
          source={iconSource}
          resizeMode="contain"
          style={{ width: 44, height: 44 }}
          fadeDuration={0}
          onLoad={() => setLoaded(true)}
          tintColor={theme.colors.primary}
        />
      </Marker>
    );
  },
);

InlineBusinessMarker.displayName = 'InlineBusinessMarker';

// --- MAIN MAP COMPONENT ---
const Map = forwardRef<MapRefType, MapProps>(
  (
    {
      showPin,
      location,
      onLocationSelect,
      readOnly = false,
      businesses = [],
      onMarkerPress,
      onUserLocationUpdate,
    },
    ref,
  ) => {
    const { currentTheme: theme } = useAppTheme();
    const { t } = useTranslation();
    const mapRef = useRef<MapView>(null);

    const tomar = {
      latitude: 39.6035,
      longitude: -8.4154,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };

    const [userLocation, setUserLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogText, setDialogText] = useState('');
    const [loading, setLoading] = useState(false);

    // 2. Track the map's current region so the clusterer knows what to calculate
    const [currentRegion, setCurrentRegion] = useState(tomar);

    // 3. Convert your 'businesses' array into the GeoJSON format the library requires
    const geoJsonPoints = useMemo(() => {
      return businesses.map((biz: NegocioInterface) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          // Note: GeoJSON requires [longitude, latitude] array order!
          coordinates: [Number(biz.location.long), Number(biz.location.lat)],
        },
        properties: {
          // Pass the whole business object so we can read it later when rendering
          businessData: biz,
        },
      }));
    }, [businesses]);

    // 4. Use the Hook It takes the points, screen size, and map region,
    // and returns the filtered list of points/clusters to draw.
    const [points] = useClusterer<{ businessData: NegocioInterface }>(
      geoJsonPoints,
      MAP_DIMENSIONS,
      currentRegion,
    );

    useEffect(() => {
      if (location?.lat && location?.long) {
        setSelectedLocation({
          latitude: location.lat,
          longitude: location.long,
        });

        mapRef.current?.animateToRegion(
          {
            latitude: location.lat,
            longitude: location.long,
            longitudeDelta: 0.008,
            latitudeDelta: 0.008,
          },
          1000,
        );
      }
    }, [location]);

    /* useeffect para atualizar a localização do utilizador */
    useEffect(() => {
      if (onUserLocationUpdate) {
        onUserLocationUpdate(userLocation);
      }
    }, [userLocation]);

    useEffect(() => {
      let subscription: Location.LocationSubscription | null = null;

      const tracking = async () => {
        try {
          setLoading(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') {
            //dizer ao utilizador que é necessário localização para usar todas as funcionalidades
            return;
          }

          subscription = await Location.watchPositionAsync(
            {
              //precisão da localização
              accuracy: Location.Accuracy.High,
              //distância necessária para atualizar localização
              distanceInterval: 10,
            },
            locationUpdate => {
              setUserLocation({
                latitude: locationUpdate.coords.latitude,
                longitude: locationUpdate.coords.longitude,
              });
            },
          );
        } catch (err) {
          console.log(err);
          setDialogTitle(t('common.error'));
          setDialogText(
            t('map.error_location', {
              defaultValue: 'Erro\nNão foi possível obter a sua localização',
            }),
          );
          setDialogVisible(true);
        } finally {
          setLoading(false);
        }
      };

      //ativar o tracking da localização
      tracking();

      return () => {
        if (subscription) {
          subscription.remove();
        }
      };
    }, []);

    useImperativeHandle(ref, () => ({
      focusOnLocation: (lat: number, lng: number) => {
        mapRef.current?.animateToRegion(
          {
            latitude: lat,
            longitude: lng,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          },
          1000,
        );
      },
    }));

    return (
      <View style={{ flex: 1 }}>
        <MapView
          provider="google"
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={tomar}
          showsUserLocation={true}
          showsMyLocationButton={false}
          scrollEnabled={true}
          onRegionChangeComplete={region => setCurrentRegion(region)}
          onPress={e => {
            if (readOnly) return;
            const novasCoordenadas = e.nativeEvent.coordinate;
            setSelectedLocation(novasCoordenadas);
            if (onLocationSelect) onLocationSelect(novasCoordenadas);
          }}
          customMapStyle={theme.dark ? darkMapStyle : []}
        >
          {userLocation && (
            <Circle
              center={userLocation}
              radius={250}
              strokeWidth={2}
              strokeColor={theme.colors.primary}
              fillColor={theme.colors.primaryContainer + '80'}
            />
          )}

          {showPin && selectedLocation && (
            <Marker coordinate={selectedLocation} />
          )}

          {/* 6. Render the points returned by the useClusterer hook */}
          {points.map(point => {
            // Is it a Cluster (a group)?
            if (isClusterFeature(point)) {
              return (
                <Marker
                  key={`cluster-${point.properties.cluster_id}`}
                  coordinate={{
                    latitude: point.geometry.coordinates[1],
                    longitude: point.geometry.coordinates[0],
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={() => {
                    // Zoom into the cluster when clicked
                    const toRegion = point.properties.getExpansionRegion();
                    mapRef.current?.animateToRegion(toRegion, 500);
                  }}
                >
                  <View
                    style={{
                      backgroundColor: theme.colors.primary,
                      borderRadius: theme.roundness,
                      borderColor: theme.colors.outline,
                      borderWidth: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.onPrimary,
                        fontWeight: 'bold',
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {point.properties.point_count}
                    </Text>
                  </View>
                </Marker>
              );
            }

            // Otherwise, it is a single Business Marker!
            return (
              <InlineBusinessMarker
                key={point.properties.businessData._id}
                biz={point.properties.businessData}
                mapRef={mapRef}
                onMarkerPress={onMarkerPress}
                theme={theme}
              />
            );
          })}
        </MapView>

        <FAB
          style={{
            position: 'absolute',
            margin: 16,
            right: 0,
            bottom: 80,
            backgroundColor: theme.colors.primary,
          }}
          color={theme.colors.onPrimary}
          loading={loading}
          disabled={loading}
          icon="crosshairs-gps"
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('accessibility.find_gps', {
            defaultValue: 'Encontrar a minha localização atual',
          })}
          accessibilityHint={t('accessibility.focus_gps', {
            defaultValue: 'Clica para focar o mapa na tua localização GPS',
          })}
          onPress={async () => {
            console.log('get localization');
            try {
              setLoading(true);
              const gpsSignal = await Location.hasServicesEnabledAsync();

              if (!gpsSignal) {
                setDialogTitle(t('common.warning'));
                setDialogText(
                  t('map.warning_gps_disabled', {
                    defaultValue: 'Aviso\nTem o GPS desativado',
                  }),
                );
                setDialogVisible(true);
                setLoading(false);
                return;
              }

              const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Low,
              });

              // Atualiza o estado (para o pino mexer no mapa)
              setUserLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              });

              // Usa diretamente a constante "currentLocation"
              mapRef.current?.animateToRegion(
                {
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                },
                1500,
              );

              setTimeout(() => {
                setLoading(false);
              }, 1500);
            } catch (error) {
              console.log('get localization error', error);
              setDialogTitle(t('common.warning'));
              setDialogText(
                t('map.warning_activate_gps', {
                  defaultValue:
                    'Aviso\nTem de ativar o GPS para aceder a todas as funcionalidades',
                }),
              );
              setDialogVisible(true);
              setLoading(false); // Desliga se der erro
            }
          }}
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
  },
);

Map.displayName = 'Map';

export default Map;
