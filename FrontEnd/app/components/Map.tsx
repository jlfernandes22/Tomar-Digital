import { View } from "react-native";
import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import MapView, { Callout, Marker } from "react-native-maps";
// Importar Text aqui em baixo
import { Surface, useTheme, Text } from "react-native-paper";
import { router } from "expo-router";

// 1. Definir a Interface para o TypeScript não reclamar
interface MapProps {
  location?: { lat: number; long: number };
  showPin: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
  businesses?: any[];
}

const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#6b9a76" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
  { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] },
];

// Adicionado forwardRef para permitir o controlo remoto pelo Index
const Map = forwardRef(({
  showPin,
  location,
  onLocationSelect,
  readOnly = false,
  businesses = [], 
}: MapProps, ref) => {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null); // Referência interna para o MapView

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: location?.lat ?? 39.6035,
    longitude: location?.long ?? -8.4154,
  });

  // focusOnLocation para o componente pai
  useImperativeHandle(ref, () => ({
    focusOnLocation: (lat: number, lng: number) => {
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000); 
    }
  }));

  
  return (
    <View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
      <MapView
        ref={mapRef} // Conectar a referência
        style={{ flex: 1 }}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.05, 
          longitudeDelta: 0.05,
        }}
        scrollEnabled={!readOnly}
        onPress={(e) => {
          if (readOnly) return;
          const novasCoordenadas = e.nativeEvent.coordinate;
          setSelectedLocation(novasCoordenadas);
          if (onLocationSelect) onLocationSelect(novasCoordenadas);
        }}
        customMapStyle={theme.dark ? darkMapStyle : []}
      >
        {/* Pino de seleção (ex: quando estás a criar um novo negócio) */}
        {showPin && <Marker coordinate={selectedLocation} />}
        
        {/* Renderizar os negócios filtrados pela barra de pesquisa */}
        {businesses.map((item) => (
          <Marker
            key={item._id}
            coordinate={{
              latitude: item.location?.lat ,
              longitude: item.location?.long ,
            }}
            pinColor="#FF6600"
          >
          </Marker>
        ))}
      </MapView>
    </View>
  );
});

export default Map;