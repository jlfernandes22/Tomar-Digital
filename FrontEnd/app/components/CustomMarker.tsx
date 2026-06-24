import { Dimensions, Image } from "react-native";
import React from "react";
import { Marker } from "react-native-maps";
import {images} from "@/constants/images"
import NegocioInterface from "@/constants/Interfaces/Negocio";
import { useState } from "react";
import MapView from "react-native-maps";


const CustomMarker = React.memo(
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
              latitudeDelta: 0.00005,
              longitudeDelta: 0.00005,
            },
            1500,
          );
          if (onMarkerPress) onMarkerPress(biz);
        }}
      >
        <Image
          source={iconSource}
          resizeMode="contain"
          style={{ width: 44, height: 44, tintColor: theme.colors.primary }}
          fadeDuration={0}
          onLoad={() => setLoaded(true)}
          tintColor={theme.colors.primary}
        />
      </Marker>
    );
  },
);

export default CustomMarker ;