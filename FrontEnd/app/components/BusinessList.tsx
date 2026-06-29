import { Text } from 'react-native-paper';
import { View } from 'react-native';
import React from 'react';

/**
 * Defines the expected props for the BusinessList component.
 * Using specific types instead of 'any' improves type safety and developer experience.
 */
interface BusinessListProps {
  name: string;
  category: string;
  location?: { lat: number; long: number } | string;
  ownerName?: string;
}

/**
 * BusinessList Component
 *
 * A purely presentational component used to render a summary card for a business.
 * It displays the business name, category, and conditionally shows either the
 * owner's name or the business location depending on what data is available.
 */
const BusinessList = ({
  name,
  category,
  location,
  ownerName,
}: BusinessListProps) => {
  /**
   * Formats the location data for display.
   * Handles both coordinate objects (lat/long) and legacy string addresses.
   */
  const formatLocation = () => {
    if (!location) return 'Localização indisponível';

    // If location is an object with lat/long properties, format it as a coordinate string
    if (typeof location === 'object' && location.lat && location.long) {
      return `Lat: ${location.lat.toFixed(4)} | Long: ${location.long.toFixed(4)}`;
    }

    // Fallback for string-based locations (e.g., physical addresses)
    return String(location);
  };

  return (
    <View className="flex-row items-start justify-between p-4">
      <View className="flex-1">
        <Text variant="titleLarge" className="font-bold">
          {name}
        </Text>

        <Text variant="bodyMedium" className="mb-1 italic opacity-80">
          {category}
        </Text>

        <View className="flex-row items-center">
          {/*
           * Prioritize showing the owner's name if provided.
           * Otherwise, fall back to displaying the formatted location.
           */}
          <Text variant="bodySmall" className="opacity-60">
            {ownerName ? `Dono: ${ownerName}` : formatLocation()}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default BusinessList;
