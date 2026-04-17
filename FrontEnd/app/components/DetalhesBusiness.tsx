import { ScrollView, StyleSheet, View, Image } from "react-native";
import React, { useCallback, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "./Map";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { API_URL } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons"; // Ícones nativos do Expo
import { Divider, Surface, Text, useTheme } from "react-native-paper";
import CustomButton from "./CustomButton";
import { FlatList } from "react-native-gesture-handler";

const DetalhesBusiness = () => {
  type BusinessType = {
    _id: string;
    name: string;
    category: string;
    location: {
      lat: number;
      long: number;
    };
    logo: string;
    description: string;
    gallery: [""];
  };

  const businessId = useLocalSearchParams();
  const [business, setBusiness] = useState<BusinessType | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const handleBusiness = async () => {
    setLoading(true);
    try {
      //console.log(businessId.id)
      const response = await fetch(`${API_URL}/negocios/${businessId.id}`);
      const dados = await response.json();

      console.log(dados);
      setBusiness(dados);

      console.log(dados.galeriaFotos);
    } catch (error) {
      console.log("Não foi possível obter a informação sobre o negócio", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      handleBusiness();
    }, []),
  );

  if (business) {
    return (
      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1 }}>
          <Stack.Screen options={{ headerShown: false }} />

          {/* --- CABEÇALHO (Botão Voltar) --- */}
          <CustomButton
            buttonColor={theme.colors.primaryContainer}
            className="self-start px-3 py-2"
            onPress={() => router.back()}
            icon={() => (
              <Ionicons name="chevron-back" size={20} color="white" />
            )}
          >
            Voltar
          </CustomButton>
          <Divider />

          {/* --- CORPO DA PÁGINA --- */}
          {/* CRITICAL FIX: Only ONE ScrollView here. Added paddingBottom so the map doesn't get cut off at the bottom */}
          <ScrollView
            className="px-5 pt-6"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            {/* Título e Categoria */}
            <View className="mb-6" style={{ alignItems: "center" }}>
              <Text
                variant="displaySmall"
                className="text-3xl mb-3 text-center"
              >
                {business.name}
              </Text>

              {/* CRITICAL FIX: Changed h-full to h-48 (fixed height) so the image actually renders */}
              {business.logo && (
                <Image
                  source={{ uri: business.logo as string }}
                  className="w-full h-48 rounded-xl bg-gray-200"
                  resizeMode="cover"
                />
              )}

              <View className="flex-row mt-4">
                <View
                  className="flex-row items-center px-3 py-2"
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: 11,
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={theme.colors.onSecondaryContainer}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme.colors.onSecondaryContainer }}>
                    {business.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Descrição */}
            <View className="mb-6">
              <Text variant="headlineSmall" className="mb-2">
                Descrição
              </Text>
              <Text variant="bodyMedium">{business.description}</Text>
            </View>

            {/* Galeria de fotos */}
            {business.gallery && business.gallery.length > 0 && (
              <View className="mb-6">
                <Text variant="headlineSmall" className="mb-3">
                  Galeria de Fotos
                </Text>

                {/* Horizontal scroll for the images so they look like a gallery */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {business.gallery.map((uri, index) =>
                    uri ? (
                      <Image
                        key={index}
                        source={{ uri }}
                        // Increased size from w-11 to w-32 so you can actually see them
                        className="w-32 h-32 mr-3 rounded-lg bg-gray-200"
                        resizeMode="cover"
                      />
                    ) : null,
                  )}
                </ScrollView>
              </View>
            )}

            {/* Secção do Mapa */}
            <View className="mt-2 mb-10">
              <Text
                variant="headlineSmall"
                className="font-bold text-gray-800 mb-3"
              >
                Localização
              </Text>

              <View className="rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm h-[20rem]">
                <Map
                  location={business.location}
                  showPin={true}
                  readOnly={true}
                />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Surface>
    );
  } else {
    return (
      <SafeAreaView
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <Text>Não foi recebido negócio</Text>
      </SafeAreaView>
    );
  }
};

export default DetalhesBusiness;

const styles = StyleSheet.create({});
