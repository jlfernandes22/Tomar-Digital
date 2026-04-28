import { ScrollView, StyleSheet, View, Image } from "react-native";
import React, { useCallback, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Map from "./Map";
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { API_URL } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  IconButton,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import MapRefType from "@/constants/Interfaces/MapRefType";
import NegocioInterface from "@/constants/Interfaces/Negocio";

const DetalhesBusiness = () => {
  const businessId = useLocalSearchParams();
  const [business, setBusiness] = useState<NegocioInterface>();
  const [loading, setLoading] = useState(true); // Começa em true para mostrar o spinner inicial
  const router = useRouter();
  const theme = useTheme();
  const mapRef = useRef<MapRefType>(null);

  const handleBusiness = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/negocios/${businessId.id}`);
      const dados = await response.json();
      setBusiness(dados);
      //console.log(dados.location);
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

  // 1. ESTADO DE CARREGAMENTO (Mostra um spinner enquanto espera pela API)
  if (loading) {
    return (
      <Surface
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.background,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  // 2. ESTADO DE SUCESSO
  if (business) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={["top", "left", "right"]}
      >
        <Stack.Screen options={{ headerShown: false }} />

        {/* --- CABEÇALHO LIMPO --- */}
        <View className="flex-row items-center px-2 py-1">
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => router.back()}
          />
        </View>

        {/* --- CORPO DA PÁGINA --- */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 60 }}
        >
          {/* HERÓI (Imagem) - Bleed ligeiro nas margens para um look moderno */}
          <View className="px-4">
            {business.logo !== "" && (
              <Image
                source={{ uri: business.logo as string }}
                // Altura reduzida para h-64. Sombras suaves adicionadas.
                className="w-full h-64 rounded-2xl bg-gray-200 shadow-sm"
                resizeMode="cover"
              />
            )}
          </View>

          {/* CONTEÚDO PRINCIPAL (Tudo alinhado perfeitamente à esquerda com px-5) */}
          <View className="px-5 mt-5">
            {/* Título e Categoria */}
            <View className="flex-row items-center justify-between mb-2">
              <Text
                variant="headlineLarge"
                className="font-bold flex-1 mr-3"
                style={{ color: theme.colors.onBackground }}
              >
                {business.name}
              </Text>
            </View>

            {/* Tag da Categoria Limpa */}
            <View
              className="self-start flex-row items-center py-1.5 px-3 rounded-lg mb-6"
              style={{ backgroundColor: theme.colors.secondaryContainer }}
            >
              <Ionicons
                name="pricetag-outline"
                size={14}
                color={theme.colors.onSecondaryContainer}
                style={{ marginRight: 6 }}
              />
              <Text
                variant="labelMedium"
                style={{ color: theme.colors.onSecondaryContainer }}
              >
                {business.category}
              </Text>
            </View>

            {/* Descrição sem margens estranhas */}
            <Text
              variant="bodyLarge"
              className="leading-6 mb-8"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {business.description}
            </Text>

            {/* Galeria de fotos */}
            {business.gallery && business.gallery.length > 0 && (
              <View className="mb-8">
                {/* Cabeçalho de secção minimalista (sem a bolha à volta) */}
                <Text
                  variant="titleLarge"
                  className="font-bold mb-4"
                  style={{ color: theme.colors.onBackground }}
                >
                  Galeria
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {business.gallery.map((uri, index) =>
                    uri ? (
                      <Image
                        key={index}
                        source={{ uri }}
                        className="w-32 h-32 mr-3 rounded-xl bg-gray-200"
                        resizeMode="cover"
                      />
                    ) : null,
                  )}
                </ScrollView>
              </View>
            )}

            {/* Secção do Mapa */}
            <View className="mb-4">
              <Text
                variant="titleLarge"
                className="font-bold mb-4"
                style={{ color: theme.colors.onBackground }}
              >
                Localização
              </Text>

              <View className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 h-[20rem]">
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
    );
  }

  // 3. ESTADO DE ERRO/VAZIO
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Text variant="bodyLarge">Não foi possível carregar o negócio.</Text>
    </SafeAreaView>
  );
};

export default DetalhesBusiness;
