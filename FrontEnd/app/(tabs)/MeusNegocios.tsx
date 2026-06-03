import React, { useState, useCallback } from "react";
import { Image, FlatList, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import BusinessList from "../components/BusinessList";
import { useAuth } from "@/context/AuthContext";
import { images } from "@/constants/images";
import {
  Surface,
  useTheme,
  Text,
  TouchableRipple,
  ActivityIndicator,
  Divider,
} from "react-native-paper";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";

interface Business {
  _id: string;
  name: string;
  category: string;
  location: {
    lat: number;
    long: number;
  };
  address?: string;
  status: string;
  owner: {
    _id: string;
    name: string; 
  };
}

const MyBusinesses = () => {
  const { user } = useAuth();
  const [negocios, setNegocios] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const theme = useTheme();

  const carregarNegocios = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/meusNegocios`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`, 
        },
      });

      if (!response.ok) {
        throw new Error("Não foi possível carregar os teus estabelecimentos.");
      }

      const dados = await response.json();
      setNegocios(Array.isArray(dados) ? dados : []);
    } catch (error: any) {
      setSnackbarMessage("Erro ao carregar os negócios:\n" + error.message);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarNegocios();
    }, [user?.token]),
  );

  return (
    <SafeAreaView
      className="p-4"
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right"]}
    >
      <Text
        variant="headlineMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        Os Meus Negócios
      </Text>

      <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator
            animating={true}
            size="large"
            color={theme.colors.primary}
          />
        </View>
      ) : (
        <FlatList
          data={negocios}
          keyExtractor={(item: Business) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className="relative">
              <Surface
  elevation={1}
  style={{
    backgroundColor: theme.colors.secondaryContainer,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    // Remova o overflow: "hidden" daqui
  }}
>
  {/* Adicione uma View interna para gerir o corte */}
  <View style={{ 
    borderRadius: 12, 
    overflow: "hidden" 
  }}>
    <TouchableRipple
      onPress={() => {
        router.push({
          pathname: "/components/DetalhesBusiness",
          params: { businessId: item._id},
        });
      }}
      rippleColor="rgba(150, 150, 150, 0.2)"
    >
      <View className="p-4">
        <BusinessList
          name={item.name}
          category={item.category}
          location={item.location}
        />
        
        <Text
          variant="bodySmall"
          style={{
            marginTop: 8,
            color: theme.colors.onSecondaryContainer,
            fontStyle: "italic",
            opacity: 0.8,
          }}
        >
          Dono do Estabelecimento: {item.owner?.name || "N/A"}
        </Text>
      </View>
    </TouchableRipple>
  </View>
</Surface>
            </View>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-10 pb-20">
              <Image
                source={images.bagImg}
                className="w-64 h-64 mb-8"
                style={{
                  tintColor: theme.colors.onSurfaceVariant,
                  opacity: 0.6,
                }}
                resizeMode="contain"
              />

              <Text
                variant="headlineSmall"
                style={{ color: theme.colors.onSurface, fontWeight: "bold" }}
                className="text-center mb-2"
              >
                Nenhum negócio registado
              </Text>
              <Text
                variant="bodyLarge"
                style={{ color: theme.colors.onSurfaceVariant }}
                className="text-center mb-10 opacity-70"
              >
                Ainda não adicionou nenhum estabelecimento à rede sob a sua conta de comerciante.
              </Text>

              <CustomButton
                buttonColor={theme.colors.primary}
                textColor={theme.colors.onPrimary}
                onPress={() => router.push("/(tabs)/AddBusiness")}
                className="w-full h-14"
                icon="plus"
              >
                Registar Novo Negócio
              </CustomButton>
            </View>
          }
        />
      )}

      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </SafeAreaView>
  );
};

export default MyBusinesses;