import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  View,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import BusinessList from "../components/BusinessList";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import CustomTextInput from "../components/CustomTextInput";
import { Surface, TouchableRipple, IconButton } from "react-native-paper";
import CustomSnackBar from "../components/CustomSnackBar";

const Search = () => {
  const [listaNegocios, setListaNegocios] = useState([]);
  const [listaFiltrada, setListaFiltrada] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    try {
      await handleNegocios();
    } catch (err) {
      Alert.alert("erro", "erro: " + err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const { user } = useAuth();

  const handleNegocios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/negocios`);
      const dados = await response.json();
      const apenasAprovados = dados.filter(
        (item: any) => item.status === "aprovado",
      );
      setListaNegocios(apenasAprovados);
      setListaFiltrada(apenasAprovados);
    } catch (error) {
      console.log("Não foi possível obter a lista de negócios", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarGuardar = (negocio: any) => {
    Alert.alert(
      "Guardar Negócio",
      `Deseja guardar "${negocio.name}" na sua lista?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sim, guardar", onPress: () => guardarNaLista(negocio._id) },
      ],
    );
  };

  const guardarNaLista = async (businessId: string) => {
    if (!user?.id) {
      Alert.alert("Aviso", "Tens de ter conta para guardar favoritos!");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/guardarFavorito`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, businessId: businessId }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage("Negócio guardado com sucesso");
        setSnackbarVisible(true);
      } else {
        setSnackbarMessage(
          "Erro: " + data.message || "Não foi possível guardar",
        );
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Erro ao comunicar com o servidor");
      setSnackbarVisible(true);
    }
  };

  const setSearchBar = (texto: string) => {
    setSearch(texto);
    if (texto === "") {
      setListaFiltrada(listaNegocios);
    } else {
      const novaLista = listaNegocios.filter((item: any) => {
        if (!item.name) return false;
        return item.name.toLowerCase().includes(texto.toLowerCase());
      });
      setListaFiltrada(novaLista);
    }
  };

  useFocusEffect(
    useCallback(() => {
      handleNegocios();
    }, []),
  );

  return (
    //  Envolvemos tudo num Surface para o fundo do ecrã adaptar-se ao tema (Dark/Light)
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Barra de Pesquisa */}
        <View
          className="px-4 mt-6 mb-4"
          accessibilityRole="search"
          accessibilityLabel="Barra de pesquisa de negócios"
          accessibilityHint="Filtra a lista de resultados abaixo à medida que escreve"
        >
          <CustomTextInput
            label="Procurar negócio"
            value={search}
            onChangeText={setSearchBar}
          />
        </View>

        {/* Lista de Resultados */}
        <View className="flex-1">
          {loading ? (
            <ActivityIndicator size="large" color="#FF6600" className="mt-20" />
          ) : (
            <FlatList
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              data={listaFiltrada}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 20,
              }}
              keyExtractor={(item: any) => item._id}
              renderItem={({ item }) => (
                <View className="relative mb-4">
                  <Surface
                    className="border border-convento-200 "
                    elevation={1}
                    style={{ borderRadius: 12 }}
                  >
                    <TouchableRipple
                      className="overflow-hidden"
                      onPress={() => {
                        router.push({
                          pathname: "/components/BusinessDetails",
                          params: { id: item._id },
                        });
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalhes de ${item.name}`}
                    >
                      <View>
                        <BusinessList
                          name={item.name}
                          category={item.category}
                          location={
                            item.location?.lat
                              ? `${item.location.lat.toFixed(3)}, ${item.location.long.toFixed(3)}`
                              : "Localização não definida"
                          }
                        />
                      </View>
                    </TouchableRipple>
                  </Surface>

                  <View className="absolute right-2 top-2">
                    <IconButton
                      icon="plus"
                      mode="contained"
                      containerColor="#FF6600"
                      iconColor="white"
                      size={24}
                      onPress={() => confirmarGuardar(item)}
                      accessibilityLabel={`Adicionar ${item.name} aos favoritos`}
                    />
                  </View>
                </View>
              )}
            />
          )}
        </View>
        <CustomSnackBar
          visible={snackbarVisible}
          message={snackbarMessage}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </SafeAreaView>
    </Surface>
  );
};

export default Search;
