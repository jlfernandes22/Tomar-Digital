import { ScrollView, StyleSheet, View } from "react-native";
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

const DetalhesBusiness = () => {
  type BusinessType = {
    _id: string;
    name: string;
    category: string;
    location: {
      lat: number;
      long: number;
    };
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
        {/* O flex-1 na SafeAreaView é essencial para ocupar o ecrã todo */}
        <SafeAreaView style={{ flex: 1 }}>
          <Stack.Screen options={{ headerShown: false }} />

          {/* --- CABEÇALHO (Botão Voltar) --- */}

          <CustomButton
            buttonColor={theme.colors.primaryContainer}
            className="self-start px-3 py-2 "
            onPress={() => router.back()}
            icon={() => (
              <Ionicons name="chevron-back" size={20} color="white" />
            )}
          >
            Voltar
          </CustomButton>
          <Divider />

          {/* --- CORPO DA PÁGINA --- */}
          {/* Usar ScrollView é mais seguro caso o ecrã seja pequeno */}
          <ScrollView className="px-5 pt-6">
            {/* Título e Categoria */}
            <View className="mb-6 " style={{ alignItems: "center" }}>
              <Text variant="displaySmall" className="text-3xl mb-1 ">
                {business.name}
              </Text>

              <View className="flex-row mt-1 ">
                <View
                  className="flex-row items-center px-3 py-3"
                  style={{
                    backgroundColor: theme.colors.primaryContainer,
                    borderRadius: 11,
                  }}
                >
                  <Ionicons
                    name="pricetag-outline"
                    size={16}
                    color={theme.colors.onSecondaryContainer}
                    style={{ alignSelf: "flex-start", marginRight: 10 }}
                  />
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                    }}
                  >
                    {business.category}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text variant="headlineSmall">Descrição</Text>

              {/* Colocar a descrição do negócio ou informação extra */}
            </View>

            {/* Secção do Mapa */}
            <View className="mt-2 ">
              <Text
                variant="headlineSmall"
                className="font-bold text-gray-800 mb-3"
              >
                Localização
              </Text>

              {/* Caixa com sombra e cantos arredondados para conter o mapa */}
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
      <SafeAreaView>
        <Stack.Screen options={{ headerShown: false }} />
        <Text>Não foi recebido negócio</Text>
      </SafeAreaView>
    );
  }
};

export default DetalhesBusiness;

const styles = StyleSheet.create({});
