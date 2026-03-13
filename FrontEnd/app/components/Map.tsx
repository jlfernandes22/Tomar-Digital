import { View } from 'react-native';
import React, { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from 'react-native-paper'; 

// 2. O estilo JSON para o mapa noturno (fornecido pela Google) a AI que foi buscar
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];


const Map = ({ 
  showPin, 
  location, 
  onLocationSelect,
  readOnly = false
}: { 
  location?: any, 
  showPin: boolean, 
  onLocationSelect?: (coords: { latitude: number, longitude: number }) => void,
  readOnly?:boolean
}) => {
  
  const theme = useTheme();

  const [selectedLocation, setSelectedLocation] = useState({
    latitude: location?.lat ?? 39.6035,
    longitude: location?.long ?? -8.4154
  });

  return (
    <View className='flex-1 w-full align-middle overflow-hidden'>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        
        // impedir que o utilizador 
        // faça zoom ou arraste o mapa noutras páginas, pode descomentar isto:
        scrollEnabled={!readOnly}
        // zoomEnabled={!readOnly}
        // pitchEnabled={!readOnly}
        // rotateEnabled={!readOnly}


        onPress={(e) => {

          if(readOnly){
            return;
          }

          const novasCoordenadas = e.nativeEvent.coordinate;
          
          // Movemos o pino visualmente dentro do mapa
          setSelectedLocation(novasCoordenadas);
          
          // enviar coordenadas para o parent
          if (onLocationSelect) {
            onLocationSelect(novasCoordenadas);
          }
        }}
        
        customMapStyle={theme.dark ? darkMapStyle : []}
      >
        {showPin && <Marker coordinate={selectedLocation} />}
      </MapView>
    </View>
  );
};

export default Map;