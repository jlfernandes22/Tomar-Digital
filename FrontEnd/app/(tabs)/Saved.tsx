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
  Button,
} from "react-native-paper";
import CustomButton4 from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";

interface Favorito {
  _id: string;
  userId: string;
  businessId: {
    _id: string;
    name: string;
    category: string;
    location: any;
  } | null;
}

const Saved = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const theme = useTheme();

  const carregarFavoritos = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/meusFavoritos/${user.id}`);
      const dados = await response.json();

      const listaFinal = Array.isArray(dados) ? dados : dados.favoritos || [];

      setFavoritos(listaFinal);
    } catch (error) {
      setSnackbarMessage("Erro ao carregar favoritos\n" + error);
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [user?.id]),
  );

  const retirarFavorito = async (businessId: string) => {
  // 1. Atualiza a UI localmente primeiro (Optimistic Update)
  setFavoritos((prev) =>
    prev.filter((item) => item.businessId?._id !== businessId)
  );

  try {
    const response = await fetch(`${API_URL}/retirarFavorito`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user?.id, businessId }),
    });

    if (response.ok) {
      setSnackbarMessage("Removido com sucesso");
      setSnackbarVisible(true);
      // Não precisas de chamar carregarFavoritos() aqui se o filter correu bem
    } else {
      // Se falhar no servidor, recarregamos para repor o item na lista
      carregarFavoritos();
      setSnackbarMessage("Erro ao remover do servidor");
      setSnackbarVisible(true);
    }
  } catch (error) {
    carregarFavoritos();
  }
};

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header Elegante */}
        <View className="p-6">
          <Text
            variant="headlineMedium"
            style={{ 
              fontWeight: 'bold', 
              color: theme.colors.primary,
              letterSpacing: 0.5 
            }}
          >
            Os Meus Favoritos
          </Text>
        </View>

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
            data={favoritos}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 20,
              flexGrow: 1,
            }}
            keyExtractor={(item: any) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View className="relative mb-4">
                {/* Card do Negócio */}
                <Surface
                  elevation={1}
                  style={{ 
                    borderRadius: 20, 
                    backgroundColor: theme.colors.elevation.level1,
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant,
                    overflow: "hidden" 
                  }}
                >
                  <TouchableRipple
                    onPress={() => {
                      router.push({
                        pathname: "/components/DetalhesBusiness",
                        params: { id: item.businessId?._id },
                      });
                    }}
                    rippleColor="rgba(0, 0, 0, .1)"
                  >
                    <View className="p-1">
                      <BusinessList
                        name={item.businessId?.name || "Negócio não disponível"}
                        category={item.businessId?.category || "N/A"}
                        location={item.businessId?.location || ""}
                      />
                    </View>
                  </TouchableRipple>
                </Surface>

                {/* Botão Remover - Integrado com o Tema de Erro */}
                <View className="absolute right-3 top-7">
                  <Button
                    mode="contained"
                    buttonColor={theme.colors.error}
                    textColor={theme.colors.onError}
                    onPress={() => {
                      if (item.businessId) retirarFavorito(item.businessId._id);
                    }}
                    style={{ 
                      borderRadius: 12, 
                      elevation: 4,
                      shadowColor: theme.colors.error 
                    }}
                    labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    contentStyle={{ height: 36, paddingHorizontal: 0 }}
                  >
                    Remover
                  </Button>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center px-10 pb-20">
                <Image
                  source={images.favWaiting}
                  className="w-64 h-64 mb-8"
                  style={{ 
                    tintColor: theme.colors.onSurfaceVariant,
                    opacity: 0.6 
                  }}
                  resizeMode="contain"
                />

                <Text
                  variant="headlineSmall"
                  style={{ color: theme.colors.onSurface, fontWeight: "bold" }}
                  className="text-center mb-2"
                >
                  Lista vazia
                </Text>
                <Text
                  variant="bodyLarge"
                  style={{ color: theme.colors.onSurfaceVariant }}
                  className="text-center mb-10 opacity-70"
                >
                  Parece que ainda não guardou nenhum dos tesouros de Tomar nos
                  seus favoritos.
                </Text>

                <CustomButton4
                  buttonColor={theme.colors.primary}
                  textColor={theme.colors.onPrimary}
                  onPress={() => router.push("/Home")}
                  className="w-full h-14"
                >
                  Descobrir Negócios
                </CustomButton4>
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
    </Surface>
  );
}

export default Saved;
