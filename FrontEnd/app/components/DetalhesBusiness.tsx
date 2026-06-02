import { ScrollView, View, Image, Dimensions } from "react-native";
import React, { useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "./Map";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { IconButton, Surface, Text, useTheme } from "react-native-paper";
import MapRefType from "@/constants/Interfaces/MapRefType";

const { width } = Dimensions.get("window");

interface Business {
  _id: string;
  name: string;
  category: string;
  description: string;
  logo?: string;
  gallery?: string[];
  address?: string;
  listaCAES?: [];
  location: {
    lat: number;
    long: number;
  };
  owner?: {
    _id: string;
    name: string;
  };
}

const DetalhesBusiness = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const theme = useTheme();
  const mapRef = useRef<MapRefType>(null);

  let business: Business | null = null;
  try {
    if (params.dadosNegocio) {
      business = JSON.parse(params.dadosNegocio as string);
    }
  } catch (e) {
    console.error(e);
  }

  if (!business) {
    return (
      <Surface style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />
        <Text variant="bodyLarge">Não foi possível carregar o negócio.</Text>
        <IconButton icon="arrow-left" mode="contained" style={{ marginTop: 16 }} onPress={() => router.back()} />
      </Surface>
    );
  }

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "left", "right"]}>
        <Stack.Screen options={{ headerShown: false }} />

        <View className="flex-row items-center px-3 py-2">
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => router.back()}
          />
          <Text variant="titleMedium" className="font-bold flex-1 ml-1" style={{ color: theme.colors.onBackground }}>
            Voltar
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          
          {/* logo */}
          <View className="px-4">
            {business.logo ? (
              <Image
                source={{ uri: business.logo }}
                className="w-full h-56 rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <View >
                <Text>SEM logo</Text>
              </View>
            )}
          </View>

          <View className="px-5 mt-5">
            
            <Text variant="labelLarge" style={{ color: theme.colors.primary, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1 }}>
              {business.category}
            </Text>

            {/* Nome do Negócio */}
            <Text variant="headlineMedium" className="font-bold mt-1" style={{ color: theme.colors.onBackground, fontWeight: "bold" }}>
              {business.name}
            </Text>

            {/* Dono  */}
            {business.owner?.name && (
              <Text variant="bodyMedium" className="mt-1" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}>
                Por {business.owner.name}
              </Text>
            )}

            {business.listaCAES && (
              <Text variant="bodyMedium" className="mt-1" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.7 }}>
                CAES: {business.listaCAES}
              </Text>
            )}

            <View className="h-6" />

            {/* Descrição */}
            <Text variant="bodyLarge" className="leading-6" style={{ color: theme.colors.onSurfaceVariant }}>
              {business.description || "Sem descrição disponível."}
            </Text>

            {/* Galeria Horizontal */}
            {business.gallery && business.gallery.filter(Boolean).length > 0 && (
              <View className="mt-8">
                <Text variant="titleMedium" className="font-bold mb-3" style={{ color: theme.colors.onBackground }}>
                  Galeria
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 px-5">
                  {business.gallery.map((uri: string, index: number) =>
                    uri ? (
                      <Image
                        key={index}
                        source={{ uri }}
                        className="w-28 h-28 mr-3 rounded-xl"
                        style={{ backgroundColor: theme.colors.surfaceVariant }}
                        resizeMode="cover"
                      />
                    ) : null,
                  )}
                </ScrollView>
              </View>
            )}

            {/* Localização  */}
            <View className="mt-8">
              <Text variant="titleMedium" className="font-bold mb-1" style={{ color: theme.colors.onBackground }}>
                Localização
              </Text>
              
              {business.address ? (
                <Text variant="bodyMedium" className="mb-4" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.8 }}>
                  {business.address}
                </Text>
              ) : <View className="h-2" />}

              {/* Mapa */}
              <View 
                className="rounded-2xl overflow-hidden h-60 border" 
                style={{ borderColor: theme.colors.outlineVariant }}
              >
                <Map
                  ref={mapRef}
                  location={business.location}
                  showPin={true}
                  readOnly
                />
              </View>
            </View>

          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
};

export default DetalhesBusiness;