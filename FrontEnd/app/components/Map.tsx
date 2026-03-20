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
      if (!lat || !lng) return;
      mapRef.current?.animateToRegion({
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000); 
    }
  }));

  return (<View style={{ flex: 1, width: '100%', overflow: 'hidden' }}>
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        // USAR VALORES GARANTIDOS AQUI:
        initialRegion={{
          latitude: selectedLocation.latitude || 39.6035,
          longitude: selectedLocation.longitude || -8.4154,
          latitudeDelta: 0.05, 
          longitudeDelta: 0.05,
        }}
        scrollEnabled={!readOnly}
        customMapStyle={theme.dark ? darkMapStyle : []}
      >
        {showPin && <Marker coordinate={selectedLocation} />}
        
        {/* Renderizar pins apenas se businesses for um array válido */}
        {Array.isArray(businesses) && businesses.map((item) => {
          // Extração segura: se falhar aqui, o item é ignorado
          const itemLat = item?.location?.lat;
          const itemLng = item?.location?.long;

          if (!itemLat || !itemLng) return null;

          return (
            <Marker
              key={item._id}
              coordinate={{ latitude: itemLat, longitude: itemLng }}
              pinColor="#FF6600"
            >
              <Callout
                tooltip 
                onPress={() => {
                  if (item?._id) {
                    router.push({
                      pathname: "/components/DetalhesBusiness", 
                      params: { id: item._id } 
                    });
                  }
                }}
              >
                <Surface elevation={2} style={{ padding: 12, borderRadius: 12, backgroundColor: theme.colors.surface, minWidth: 150 }}>
                  <Text variant="titleSmall" style={{ fontWeight: "bold" }}>{item.name}</Text>
                  <Text variant="bodySmall">{item.category}</Text>
                  <Text variant="labelSmall" style={{ color: "#FF6600", marginTop: 4 }}>Ver detalhes →</Text>
                </Surface>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
    );
});

export default Map;