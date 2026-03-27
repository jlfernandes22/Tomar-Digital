import { View } from "react-native";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import MapView, { Marker } from "react-native-maps";
import { useTheme } from "react-native-paper";

interface MapProps {
  location?: { lat: number; long: number };
  showPin: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
  businesses?: any[];
}

// 1. Mantemos a interface para o TypeScript não reclamar do useImperativeHandle
export interface MapRefType {
  focusOnLocation: (lat: number, lng: number) => void;
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

// 2. Adicionamos <MapRefType, MapProps>
const Map = forwardRef<MapRefType, MapProps>(
  (
    { showPin, location, onLocationSelect, readOnly = false, businesses = [] },
    ref,
  ) => {
    const theme = useTheme();
    const mapRef = useRef<MapView>(null);

    const [selectedLocation, setSelectedLocation] = useState({
      latitude: location?.lat ?? 39.6035,
      longitude: location?.long ?? -8.4154,
    });

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
      <View style={{ flex: 1, width: "100%", overflow: "hidden" }}>
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          scrollEnabled={true}
          onPress={(e) => {
            if (readOnly) return;
            const novasCoordenadas = e.nativeEvent.coordinate;
            setSelectedLocation(novasCoordenadas);
            if (onLocationSelect) onLocationSelect(novasCoordenadas);
          }}
          customMapStyle={theme.dark ? darkMapStyle : []}
        >
          {showPin && <Marker coordinate={selectedLocation} />}

          {businesses.map((biz) => (
            <Marker
              key={biz._id || Math.random().toString()}
              coordinate={{
                latitude: biz.location.lat,
                longitude: biz.location.long,
              }}
            ></Marker>
          ))}
        </MapView>
      </View>
    );
  },
);

Map.displayName = "Map";

export default Map;
