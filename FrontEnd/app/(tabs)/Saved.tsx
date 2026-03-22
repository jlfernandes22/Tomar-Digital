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
    setFavoritos((prev) =>
      prev.filter((item) => item.businessId?._id !== businessId),
    );

    try {
      const response = await fetch(`${API_URL}/retirarFavorito`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, businessId }),
      });

      if (response.ok) {
        carregarFavoritos();
        setSnackbarMessage("Removido com sucesso");
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage("Erro: Não foi possível remover do servidor");
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Erro: " + error);
      carregarFavoritos();
    }
  };

  return (
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View className="p-6">
          <Text
            variant="headlineMedium"
            className="text-center font-bold text-[#FF6600]"
          >
            Os Meus Favoritos
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            animating={true}
            size="large"
            color="#FF6600"
            className="mt-20"
          />
        ) : (
          <FlatList
            data={favoritos}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 20,
              flexGrow: 1,
            }}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }) => (
              <View className="relative mb-4">
                <Surface
                  className="border border-tomar-200 overflow-hidden"
                  elevation={1}
                  style={{ borderRadius: 16 }}
                >
                  <View style={{ borderRadius: 16, overflow: "hidden" }}>
                    <TouchableRipple
                      onPress={() => {
                        router.push({
                          pathname: "/components/BusinessDetails",
                          params: { id: item.businessId?._id },
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalhes de ${item.businessId?.name || "negócio"}`}
                    >
                      <View>
                        <BusinessList
                          name={
                            item.businessId?.name || "Negócio não disponível"
                          }
                          category={item.businessId?.category || "N/A"}
                          location={item.businessId?.location || ""}
                        />
                      </View>
                    </TouchableRipple>
                  </View>
                </Surface>

                <View className="absolute right-3 top-7 shadow-md">
                  <Button
                    mode="contained"
                    buttonColor="#DC2626" // red-600 do Tailwind
                    textColor="white"
                    onPress={() => {
                      if (item.businessId) retirarFavorito(item.businessId._id);
                    }}
                    accessibilityLabel={`Remover ${item.businessId?.name} dos favoritos`}
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
                  className="w-64 h-64 mb-6"
                  style={
                    theme.dark ? { tintColor: "white" } : { tintColor: "black" }
                  }
                  resizeMode="contain"
                  importantForAccessibility="no-hide-descendants"
                  accessibilityElementsHidden={true}
                />

                <Text
                  variant="titleLarge"
                  className="font-bold text-center mb-2"
                >
                  Lista vazia
                </Text>
                <Text
                  variant="bodyMedium"
                  className="text-center opacity-70 mb-8"
                >
                  Parece que ainda não guardou nenhum dos tesouros de Tomar nos
                  seus favoritos.
                </Text>

                <CustomButton4
                  buttonColor="#FF6600"
                  onPress={() => router.push("/search")}
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
};

export default Saved;
