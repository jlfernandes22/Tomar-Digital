import { View, Dimensions } from 'react-native';
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
import NegocioInterface from '@/constants/Interfaces/Negocio';
import { useClusterer, isClusterFeature } from 'react-native-clusterer';
import CustomMarker from './CustomMarker';
import delay from '@/utils/delay';

const tomar = {
  latitude: 39.6035,
  longitude: -8.4154,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// =======================================================
// 1. MAPA SIMPLES (Apenas para BusinessDetails)
// =======================================================
const SingleMap = forwardRef<MapRefType, MapProps>(
  ({ showPin, location, onLocationSelect, readOnly = false }, ref) => {
    const { currentTheme: theme } = useAppTheme();
    const mapRef = useRef<MapView>(null);
    const [selectedLocation, setSelectedLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

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
          style={{ flex: 1, padding: 16 }}
          initialRegion={tomar}
          scrollEnabled={true}
          onPress={e => {
            if (readOnly) return;
            const novasCoordenadas = e.nativeEvent.coordinate;
            setSelectedLocation(novasCoordenadas);
            if (onLocationSelect) onLocationSelect(novasCoordenadas);
          }}
          customMapStyle={theme.dark ? darkMapStyle : []}
        >
          {showPin && selectedLocation && (
            <Marker coordinate={selectedLocation} />
          )}
        </MapView>
      </View>
    );
  },
);

// =======================================================
// 2. MAPA COM CLUSTERS E GPS (Apenas para Home.tsx)
// =======================================================
const ClusterMap = forwardRef<MapRefType, MapProps>(
  ({ businesses = [], onMarkerPress, onUserLocationUpdate }, ref) => {
    const { currentTheme: theme } = useAppTheme();
    const { t } = useTranslation();
    const mapRef = useRef<MapView>(null);

    const [mapRegion, setMapRegion] = useState(tomar);
    const [userLocation, setUserLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogText, setDialogText] = useState('');
    const [loading, setLoading] = useState(false);

    const MAP_DIMENSIONS = useMemo(() => {
      const { width, height } = Dimensions.get('window');
      return { width, height };
    }, []);

    const geoJsonPoints = useMemo(() => {
      if (!businesses || businesses.length === 0) return [];
      return businesses.map((biz: NegocioInterface) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [Number(biz.location.long), Number(biz.location.lat)],
        },
        properties: { businessData: biz },
      }));
    }, [businesses]);

    const [points] = useClusterer(geoJsonPoints, MAP_DIMENSIONS, mapRegion);

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
          if (status !== 'granted') return;

          subscription = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, distanceInterval: 10 },
            locationUpdate => {
              setUserLocation({
                latitude: locationUpdate.coords.latitude,
                longitude: locationUpdate.coords.longitude,
              });
            },
          );
        } catch (err) {
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

      tracking();
      return () => {
        if (subscription) subscription.remove();
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
      <>
        <View style={{ flex: 1 }}>
          <MapView
            provider="google"
            ref={mapRef}
            style={{ flex: 1, padding: 16 }}
            initialRegion={tomar}
            showsUserLocation={true}
            scrollEnabled={true}
            onRegionChangeComplete={region => setMapRegion(region)}
            customMapStyle={theme.dark ? darkMapStyle : []}
            showsMyLocationButton={false}
            toolbarEnabled={false}
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

            {points.map(point => {
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
                      mapRef.current?.animateToRegion(
                        {
                          latitude: point.geometry.coordinates[1],
                          longitude: point.geometry.coordinates[0],
                          latitudeDelta: mapRegion.latitudeDelta / 3,
                          longitudeDelta: mapRegion.longitudeDelta / 3,
                        },
                        1500,
                      );
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
                        minimumFontScale={0.6}
                      >
                        {point.properties.point_count}
                      </Text>
                    </View>
                  </Marker>
                );
              }
              return (
                <CustomMarker
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
            onPress={async () => {
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
                setUserLocation({
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                });
                mapRef.current?.animateToRegion(
                  {
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  },
                  1500,
                );
                setTimeout(() => setLoading(false), 1500);
              } catch (error) {
                setDialogTitle(t('common.warning'));
                setDialogText(
                  t('map.warning_activate_gps', {
                    defaultValue:
                      'Aviso\nTem de ativar o GPS para aceder a todas as funcionalidades',
                  }),
                );
                setDialogVisible(true);
                setLoading(false);
              }
            }}
          />
        </View>
        <CustomDialog
          title={dialogTitle}
          visible={dialogVisible}
          onDismiss={() => setDialogVisible(false)}
        >
          <Text>{dialogText}</Text>
        </CustomDialog>
      </>
    );
  },
);

// =======================================================
// 3. COMPONENTE PRINCIPAL
// =======================================================
const Map = forwardRef<MapRefType, MapProps>((props, ref) => {
  // Se tiver empresas para mostrar (Home.tsx), usa o ClusterMap
  if (props.businesses && props.businesses.length > 0) {
    return <ClusterMap ref={ref} {...props} />;
  }

  // Se não tiver (BusinessDetails.tsx), usa o SingleMap
  return <SingleMap ref={ref} {...props} />;
});

Map.displayName = 'Map';

export default Map;
