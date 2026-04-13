import { View } from "react-native";
import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
} from "react";
import MapView, { Marker, Circle } from "react-native-maps";
import { FAB, Portal, useTheme } from "react-native-paper";
import * as Location from "expo-location";
import CustomSnackBar from "./CustomSnackBar";

interface MapProps {
  location?: { lat: number; long: number };
  showPin: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
  businesses?: any[];
  onMarkerPress?: (business: any) => void;
  onUserLocationUpdate?: (coords: { latitude: number; longitude: number } | null) => void;
}

// Mantemos a interface para o TypeScript não reclamar do useImperativeHandle
export interface MapRefType {
  focusOnLocation: (lat: number, lng: number) => void;
}

//Estilo escuro do mapa fornecido pela IA
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

// Adicionamos <MapRefType, MapProps>
const Map = forwardRef<MapRefType, MapProps>(
  (
    {
      showPin,
      location,
      onLocationSelect,
      readOnly = false,
      businesses = [],
      onMarkerPress,
      onUserLocationUpdate
    },
    ref,
  ) => {
    const theme = useTheme();
    const mapRef = useRef<MapView>(null);
    //localização do utilizador
    const [userLocation, setUserLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
    const [selectedLocation, setSelectedLocation] = useState({
      latitude: location?.lat ?? 39.6035,
      longitude: location?.long ?? -8.4154,
    });

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
          if (status !== "granted") {
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
            (locationUpdate) => {
              setUserLocation({
                latitude: locationUpdate.coords.latitude,
                longitude: locationUpdate.coords.longitude,
              });
            },
          );
        } catch (err) {
          console.log(err);
          setSnackbarMessage("Erro\nNão foi possível obter a sua localização");
          setSnackbarVisible(true);
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

    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [loading, setLoading] = useState(false);


    return (
      <View
        style={{ flex: 1, width: "100%", overflow: "hidden", elevation: 10 }}
      >
        <MapView
          provider="google"
          ref={mapRef}
          style={{ flex: 1 }}
          initialRegion={{
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          scrollEnabled={true}
          onPress={(e) => {
            if (readOnly) return;
            const novasCoordenadas = e.nativeEvent.coordinate;
            setSelectedLocation(novasCoordenadas);
            if (onLocationSelect) onLocationSelect(novasCoordenadas);
          }}
          customMapStyle={theme.dark ? darkMapStyle : []}
        >
          {userLocation && (
            <>
              <Circle
                center={userLocation}
                radius={250}
                strokeWidth={2}
                strokeColor={theme.colors.primary}
                fillColor={theme.colors.primaryContainer + "80"}
              ></Circle>
            </>
          )}

          {showPin && <Marker coordinate={selectedLocation} />}

          {businesses.map((biz) => (
            <Marker
              tappable={true}
              key={biz._id || Math.random().toString()}
              coordinate={{
                latitude: biz.location.lat,
                longitude: biz.location.long,
              }}
              onPress={() => {
                //Faz o zoom no mapa
                mapRef.current?.animateToRegion(
                  {
                    latitude: biz.location.lat,
                    longitude: biz.location.long,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  },
                  1500,
                );

                // Avisa o ecrã Index qual foi o negócio clicado
                if (onMarkerPress) {
                  onMarkerPress(biz);
                }
              }}
            ></Marker>
          ))}
        </MapView>

        <FAB
          style={{
            position: "absolute",
            margin: 16,
            right: 0,
            bottom: 70,
          }}
          loading={loading}
          icon="crosshairs-gps"
          onPress={async () => {
            console.log("get localization");
            try {
              setLoading(true);
              const gpsSignal = await Location.hasServicesEnabledAsync();

              if (!gpsSignal) {
                setSnackbarMessage("Aviso\nTem o GPS desativado");
                setSnackbarVisible(true);
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
              console.log("get localization error", error);
              setSnackbarMessage(
                "Erro\nTem de ativar o GPS para aceder a todas as funcionalidades",
              );
              setSnackbarVisible(true);
              setLoading(false); // Desliga se der erro
            }
          }}
        />

        <Portal>
          <View
            style={{
              position: "absolute",
              bottom: 90, // Passa por cima do FAB (Temas)
              left: 0, // Fixa à esquerda
              right: 0, // Fixa à direita (dá a largura de 100%)
              zIndex: 10000,
            }}
            // CRÍTICO: "box-none" diz à View invisível para deixar passar os cliques
            // para o mapa e para os botões que estão por trás dela!
            pointerEvents="box-none"
          >
            <CustomSnackBar
              visible={snackbarVisible}
              message={snackbarMessage}
              onDismiss={() => setSnackbarVisible(false)}
            />
          </View>
        </Portal>
      </View>
    );
  },
);

Map.displayName = "Map";

export default Map;
