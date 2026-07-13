import React, { useState } from 'react';
import { Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';

// Contexts & Constants
import { images } from '@/constants/images';
import NegocioInterface from '@/constants/Interfaces/Negocio';

// --- Constants ---
/**
 * Maps business categories to their corresponding icon assets.
 * Defined outside the component so the object isn't recreated on every render.
 */
const categoryIconMap: Record<string, any> = {
  Restauração: images.silverware,
  Alojamento: images.bed,
  'Cafés & Pastelarias': images.coffee,
  'Comércio Local': images.shopping,
  'Património & Museus': images.bank,
  'Lazer & Natureza': images.tree,
  Serviços: images.briefcase,
};

// --- Types ---
interface CustomMarkerProps {
  biz: NegocioInterface;
  mapRef: React.RefObject<MapView | null>;
  onMarkerPress?: (biz: NegocioInterface) => void;
  theme: any; // Consider replacing 'any' with your specific AppTheme type
  currentRegion?: Region; // Added: Receives current map region for dynamic zoom calculation
}

// --- Component ---
/**
 * CustomMarker Component
 *
 * Renders a categorized map marker for a specific business.
 * Wrapped in React.memo to prevent unnecessary re-renders when the parent Map
 * updates but the individual marker's data hasn't changed.
 */
const CustomMarker = ({
  biz,
  mapRef,
  onMarkerPress,
  theme,
  currentRegion,
}: CustomMarkerProps) => {
  // --- State ---
  // Tracks whether the marker's icon image has finished loading.
  // This is used to optimize map performance via the `tracksViewChanges` prop.
  const [loaded, setLoaded] = useState(false);

  // --- Derived Values ---
  // Fallback to a default storefront icon if the category isn't found in the map
  const iconSource = categoryIconMap[biz.category] || images.storeFront;

  // --- Handlers ---
  const handlePress = () => {
    // Default tight zoom level if region isn't provided yet
    let targetLatDelta = 0.005;
    let targetLngDelta = 0.005;

    if (currentRegion) {
      /**
       * Dynamic Zoom Logic:
       * Halves the current screen view (zooming in by 2x) to mimic cluster behavior.
       * Enforces a minimum street-level delta (0.002) to prevent infinite zooming
       * if the user clicks multiple times.
       */
      targetLatDelta = Math.max(currentRegion.latitudeDelta / 2, 0.002);
      targetLngDelta = Math.max(currentRegion.longitudeDelta / 2, 0.002);
    }

    // Animate the map to center on the pressed marker with the calculated zoom level
    mapRef.current?.animateToRegion(
      {
        latitude: biz.location.lat,
        longitude: biz.location.long,
        latitudeDelta: targetLatDelta,
        longitudeDelta: targetLngDelta,
      },
      1000, // Animation duration in ms
    );

    if (onMarkerPress) onMarkerPress(biz);
  };

  // --- Render ---
  return (
    <Marker
      coordinate={{
        latitude: biz.location.lat,
        longitude: biz.location.long,
      }}
      // Platform-specific optimization (react-native-maps):
      // `tracksViewChanges` defaults to true, which forces the marker to re-render
      // constantly. This causes major performance issues on maps with many markers.
      // By setting it to `false` once the image loads, we freeze the marker,
      // significantly improving map pan/zoom performance.
      tracksViewChanges={!loaded}
      anchor={{ x: 0.5, y: 0.5 }} // Centers the marker exactly on the coordinate
      onPress={handlePress}
    >
      <Image
        source={iconSource}
        resizeMode="contain"
        style={{ width: 44, height: 44, tintColor: theme.colors.primary }}
        fadeDuration={0} // Disables the default Android fade-in for a snappier UI
        onLoad={() => setLoaded(true)}
        tintColor={theme.colors.primary}
      />
    </Marker>
  );
};

// Export the component wrapped in React.memo for performance optimization.
export default React.memo(CustomMarker);
