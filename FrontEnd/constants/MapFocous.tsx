import React from "react";
import Negocio from "./Interfaces/Negocio";
import MapRefType from "./Interfaces/MapRefType";

const MapFocous = (item: Negocio, mapRef: React.RefObject<MapRefType>) => {
  if (mapRef.current?.focusOnLocation) {
    mapRef.current.focusOnLocation(item.location.lat, item.location.long);
  }
};

export default MapFocous;
