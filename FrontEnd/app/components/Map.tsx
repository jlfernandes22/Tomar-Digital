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
import * as Location from 'expo-location';
import { useClusterer, isClusterFeature } from 'react-native-clusterer';

// Contexts & Constants
import { useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import darkMapStyle, { lightMapStyle } from '@/constants/DarkMapStyle';
import MapProps from '@/constants/Interfaces/MapProps';
import MapRefType from '@/constants/Interfaces/MapRefType';
import NegocioInterface from '@/constants/Interfaces/Negocio';

// Components
import CustomDialog from './CustomDialog';
import CustomMarker from './CustomMarker';

// --- Constants ---
// Default map region centered on Tomar, Portugal
const TOMAR_REGION = {
  latitude: 39.6035,
  longitude: -8.4154,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

// =======================================================
// 1. SingleMap Component (Used in BusinessDetails)
// =======================================================
/**
 * A simple map component that displays a single pin for a specific business.
 * Used when we only need to show one location without clustering or user tracking.
 */
const SingleMap = forwardRef<MapRefType, MapProps>(
  ({ showPin, location, onLocationSelect, readOnly = false }, ref) => {
    // --- Hooks ---
    const { currentTheme: theme } = useAppTheme();
    const mapRef = useRef<MapView>(null);

    // --- State ---
    const [selectedLocation, setSelectedLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

    // --- Effects ---
    /**
     * Syncs the incoming `location` prop with internal state and animates the map
     * to center on the new coordinates whenever the location prop changes.
     */
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
          1000, // Animation duration in ms
        );
      }
    }, [location]);

    // --- Imperative Handle ---
    /**
     * Exposes the `focusOnLocation` function to the parent component via a ref.
     * This allows the parent to programmatically move the map camera.
     */
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

    // --- Render ---
    // NOTE: `key` forces the MapView to fully remount when the theme mode toggles.
    // react-native-maps with the Google provider only reads `customMapStyle` on
    // initial mount — changing the prop dynamically has no effect on the native
    // map instance. Without this key, the map style gets "stuck" on whatever
    // mode (light/dark) it first rendered with.
    const mapKey = `single-map-${theme.dark ? 'dark' : 'light'}`;

    return (
      <View style={{ flex: 1 }}>
        <MapView
          key={mapKey}
          provider="google"
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={TOMAR_REGION}
          scrollEnabled={true}
          onPress={e => {
            if (readOnly) return;
            const novasCoordenadas = e.nativeEvent.coordinate;
            setSelectedLocation(novasCoordenadas);
            if (onLocationSelect) onLocationSelect(novasCoordenadas);
          }}
          // Apply custom dark mode styling if the app theme is dark.
          // NOTE: We use an explicit lightMapStyle (not []) for light mode because
          // Android's Google Maps base map follows the system dark mode — an empty
          // array would let the system-dark base map bleed through.
          customMapStyle={theme.dark ? darkMapStyle : lightMapStyle}
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
// 2. ClusterMap Component (Used in Home Screen)
// =======================================================
/**
 * An advanced map component featuring marker clustering, user location tracking,
 * and a GPS re-centering FAB. Used when displaying multiple businesses at once.
 */
const ClusterMap = forwardRef<MapRefType, MapProps>(
  ({ businesses = [], onMarkerPress, onUserLocationUpdate }, ref) => {
    // --- Hooks ---
    const { currentTheme: theme } = useAppTheme();
    const { t } = useTranslation();
    const mapRef = useRef<MapView>(null);

    // --- State ---
    const [mapRegion, setMapRegion] = useState(TOMAR_REGION);
    const [userLocation, setUserLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);

    // UI Feedback state
    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogTitle, setDialogTitle] = useState('');
    const [dialogText, setDialogText] = useState('');
    const [loading, setLoading] = useState(false);

    // --- Memoized Values ---
    // Get screen dimensions once. Used by the clusterer to calculate visible grid sections.
    const MAP_DIMENSIONS = useMemo(() => {
      const { width, height } = Dimensions.get('window');
      return { width, height };
    }, []);

    /**
     * Transforms the array of businesses into GeoJSON Point format.
     * This is the required input format for the `react-native-clusterer` library.
     * Memoized to prevent recalculation unless the `businesses` array changes.
     */
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

    // useClusterer processes the GeoJSON points and returns clustered/non-clustered points
    const [points] = useClusterer(geoJsonPoints, MAP_DIMENSIONS, mapRegion);

    // --- Effects ---
    /**
     * Notifies the parent component whenever the user's location changes.
     * The parent (Home.tsx) uses this to calculate nearby businesses.
     */
    useEffect(() => {
      if (onUserLocationUpdate) {
        onUserLocationUpdate(userLocation);
      }
    }, [userLocation, onUserLocationUpdate]);

    /**
     * Starts a background location tracking subscription on mount.
     * This continuously updates the user's location on the map.
     * The returned cleanup function removes the subscription when the component unmounts
     * to prevent memory leaks.
     */
    useEffect(() => {
      let subscription: Location.LocationSubscription | null = null;

      const tracking = async () => {
        try {
          setLoading(true);
          const { status } = await Location.requestForegroundPermissionsAsync();
          if (status !== 'granted') return;

          // Watch position updates every time the user moves 10 meters
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

      // Cleanup subscription on unmount
      return () => {
        if (subscription) subscription.remove();
      };
      // Intentionally leaving dependency array empty so this only runs once on mount
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --- Imperative Handle ---
    // Exposes map control functions to the parent component
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

    // --- Handlers ---
    /**
     * Handles the GPS FAB press.
     * Checks if device location services are enabled before attempting to fetch the current position.
     * If successful, animates the map to center on the user. If GPS is off, shows a warning dialog.
     */
    const handleGpsPress = async () => {
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
          accuracy: Location.Accuracy.Low, // Low accuracy is faster and uses less battery for a manual re-center
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

        setTimeout(() => setLoading(false), 1500); // Delay hiding the spinner to match animation
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
    };

    // --- Render ---
    // NOTE: `key` forces the MapView to fully remount when the theme mode toggles.
    // react-native-maps with the Google provider only reads `customMapStyle` on
    // initial mount — changing the prop dynamically has no effect on the native
    // map instance. Without this key, the map style gets "stuck" on whatever
    // mode (light/dark) it first rendered with.
    //
    // To preserve the user's camera position across the remount, we feed the
    // last known `mapRegion` (tracked via onRegionChangeComplete) back in as
    // `initialRegion`. On first mount, `mapRegion` defaults to TOMAR_REGION.
    const mapKey = `cluster-map-${theme.dark ? 'dark' : 'light'}`;

    return (
      <>
        <View style={{ flex: 1 }}>
          <MapView
            key={mapKey}
            provider="google"
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={mapRegion}
            showsUserLocation={true}
            scrollEnabled={true}
            onRegionChangeComplete={region => setMapRegion(region)}
            // NOTE: We use an explicit lightMapStyle (not []) for light mode because
            // Android's Google Maps base map follows the system dark mode — an empty
            // array would let the system-dark base map bleed through.
            customMapStyle={theme.dark ? darkMapStyle : lightMapStyle}
            showsMyLocationButton={false} // Using custom FAB instead
            toolbarEnabled={false} // Disables default Google Maps toolbar on marker press
          >
            {/* Proximity Radius Circle */}
            {userLocation && (
              <Circle
                center={userLocation}
                radius={250} // 250 meter radius
                strokeWidth={2}
                strokeColor={theme.colors.primary}
                // '80' appends hex opacity (50%) to the color string
                fillColor={theme.colors.primaryContainer + '80'}
              />
            )}

            {/* Render Clustered Points or Individual Markers */}
            {points.map(point => {
              if (isClusterFeature(point)) {
                // Render a cluster marker showing the count of points
                return (
                  <Marker
                    key={`cluster-${point.properties.cluster_id}`}
                    coordinate={{
                      latitude: point.geometry.coordinates[1],
                      longitude: point.geometry.coordinates[0],
                    }}
                    anchor={{ x: 0.5, y: 0.5 }}
                    onPress={() => {
                      // Zoom in when a cluster is pressed
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
                          paddingHorizontal: 12,
                          paddingVertical: 8,
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

              // Render an individual business marker using CustomMarker component
              return (
                <CustomMarker
                  key={point.properties.businessData._id}
                  biz={point.properties.businessData}
                  mapRef={mapRef}
                  onMarkerPress={onMarkerPress}
                  theme={theme}
                  // Pass the current map region so the marker can calculate a dynamic zoom level
                  currentRegion={mapRegion}
                />
              );
            })}
          </MapView>

          {/* GPS Re-centering Floating Action Button */}
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
            onPress={handleGpsPress}
          />
        </View>

        {/* Error/Warning Dialog */}
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
// 3. Main Map Wrapper Component
// =======================================================
/**
 * Main Map Wrapper.
 * Acts as a router between the `ClusterMap` (for multiple points) and `SingleMap` (for a single point).
 * It passes the `ref` through to the selected sub-component.
 */
const Map = forwardRef<MapRefType, MapProps>((props, ref) => {
  // If we have an array of businesses, use the advanced clustering map
  if (props.businesses && props.businesses.length > 0) {
    return <ClusterMap ref={ref} {...props} />;
  }

  // Otherwise, use the simple single-pin map
  return <SingleMap ref={ref} {...props} />;
});

Map.displayName = 'Map';

export default Map;
