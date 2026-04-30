import * as Location from "expo-location";
import { useState } from "react";
import business from "../../constants/Interfaces/Negocio";

export default async function getAddress(
  locat?: { latitude: number; longitude: number },
  business?: business,
) {
  let finalLat: number;
  let finalLong: number;

  if (business && business.location) {
    finalLat = business.location.lat;
    finalLong = business.location.long;
  } else if (locat) {
    finalLat = locat.latitude;
    finalLong = locat.longitude;
  } else {
    return "Erro:\nNão foram recebidas nenhumas coordenadas";
  }

  try {
    const geocode = await Location.reverseGeocodeAsync({
      latitude: finalLat,
      longitude: finalLong,
    });

    if (geocode.length > 0) {
      //console.log(geocode);
      const address = geocode[0].formattedAddress;
      return address;
    }
  } catch (err) {
    console.error("Erro ao converter coordenadas em morada:", err);
  }

  return null;
}
