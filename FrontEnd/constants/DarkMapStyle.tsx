// ============================================================================
// Map Styles for Google Maps (react-native-maps, provider="google")
// ============================================================================
//
// IMPORTANT: Why do we need an explicit lightMapStyle?
//
// On Android, the Google Maps SDK base map automatically follows the system
// dark mode (UiModeManager night mode). If you pass `customMapStyle={[]}`
// (empty array), the SDK interprets that as "use the default appearance" —
// which on a phone in dark mode means a DARK base map that the empty array
// cannot override.
//
// This causes an asymmetry:
//   - Phone in LIGHT mode + app theme DARK → darkMapStyle darkens the light
//     base map → works.
//   - Phone in DARK mode + app theme LIGHT → empty [] defers to the
//     system-dark base map → map stays dark (BUG).
//
// The fix: always pass an EXPLICIT style array. The lightMapStyle below forces
// light geometry/labels regardless of the Android system appearance, so the
// map respects the ThemeContext selection in both system modes.
// ============================================================================

// ---------------------------------------------------------------------------
// DARK STYLE — deep navy/charcoal map with warm accent labels
// ---------------------------------------------------------------------------
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

// ---------------------------------------------------------------------------
// LIGHT STYLE — standard Google Maps light appearance, forced explicitly so
// that Android's system dark mode cannot bleed through into the base map.
// ---------------------------------------------------------------------------
const lightMapStyle = [
  // Base geometry — light parchment/white land
  { elementType: 'geometry', stylers: [{ color: '#f5f3f0' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#3c4043' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },

  // Administrative labels
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }],
  },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }],
  },

  // Points of interest
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#e6efd9' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3c8a3c' }],
  },

  // Roads
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d5d3d0' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e8eaed' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#c3c5c8' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#3c4043' }],
  },

  // Transit
  {
    featureType: 'transit',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5f6368' }],
  },

  // Water — light blue
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#aadaff' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#1a73e8' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }],
  },
];

export { lightMapStyle };
export default darkMapStyle;
