export default interface MapProps {
  location?: { lat: number; long: number };
  showPin: boolean;
  onLocationSelect?: (coords: { latitude: number; longitude: number }) => void;
  readOnly?: boolean;
  businesses?: any[];
  onMarkerPress?: (business: any) => void;
  onUserLocationUpdate?: (
    coords: { latitude: number; longitude: number } | null,
  ) => void;
}
