import { Text } from "react-native-paper";
import { View } from "react-native";
import React from "react";

const BusinessList = ({ name, category, location }: any) => {
  const formatLocation = () => {
    if (!location) return "Localização indisponível";

    // Se for o novo formato (Objeto com lat e long)
    if (typeof location === "object" && location.lat && location.long) {
      return `Lat: ${location.lat.toFixed(4)} | Long: ${location.long.toFixed(4)}`;
    }

    // Se for o formato antigo ou uma string simples
    return String(location);
  };

  return (
    <View className="p-4 ">
      <View className="flex-row justify-between items-start">
        <View className="flex-1">
          <Text variant="titleLarge" className="font-bold">
            {name}
          </Text>

          <Text variant="bodyMedium" className="italic mb-1 opacity-80">
            {category}
          </Text>

          <View className="flex-row items-center">
            <Text variant="bodySmall" className="opacity-60">
              {formatLocation()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default BusinessList;
