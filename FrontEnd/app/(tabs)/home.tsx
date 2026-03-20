import React, { useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, FlatList, RefreshControl, Alert } from "react-native";
import { Surface, Searchbar, IconButton, TouchableRipple, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import Map from "../components/Map";
import BusinessList from "../components/BusinessList";
import CustomSnackBar from "../components/CustomSnackBar";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const [listaNegocios, setListaNegocios] = useState([]);
  const [listaFiltrada, setListaFiltrada] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const mapRef = useRef<any>(null);
  const { user } = useAuth();

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/negocios`);
      const dados = await response.json();
      const apenasAprovados = dados.filter((item: any) => item.status === "aprovado");
      setListaNegocios(apenasAprovados);
    } catch (error) {
      console.log("Erro ao obter negócios", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNegocios(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNegocios();
    setRefreshing(false);
  };

  const onChangeSearch = (query: string) => {
    setSearchQuery(query);
    if (query === "") {
      setListaFiltrada([]);
    } else {
      const filtrados = listaNegocios.filter((item: any) =>
        item.name?.toLowerCase().includes(query.toLowerCase())
      );
      setListaFiltrada(filtrados);
    }
  };

  const focarNoMapa = (item: any) => {
    setListaFiltrada([]); 
    if (mapRef.current?.focusOnLocation) {
      mapRef.current.focusOnLocation(item.location.lat, item.location.long);
    }
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      
      {/* MAPA - todo o fundo */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Map ref={mapRef} showPin={false} businesses={listaNegocios} />
      </View>

      {/* negocios */}
      <SafeAreaView 
        style={{ flex: 1, paddingHorizontal: 16 }} 
        pointerEvents="box-none"
      >
        <View style={{ marginTop: 10, width: '100%' }}>
          
          <Searchbar
            placeholder="Procurar negócio..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ 
              borderRadius: 12, 
              backgroundColor: theme.colors.surface
            }}
          />

          {listaFiltrada.length > 0 && (
            <View style={{ marginTop: 8 }}>
              {loading ? (
                <ActivityIndicator size="large" color="#FF6600" style={{ marginTop: 20 }} />
              ) : (
                <FlatList
                  data={listaFiltrada}
                  keyExtractor={(item: any) => item._id}
                  style={{ maxHeight: 400 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <View style={{ position: 'relative', marginBottom: 12 }}>
                      <Surface 
                        elevation={2} 
                        style={{ 
                          borderRadius: 12, 
                          backgroundColor: theme.colors.surface,
                          overflow: 'hidden'
                        }}
                      >
                        <TouchableRipple
                          onPress={() => focarNoMapa(item)}
                          onLongPress={() => {
                            router.push({ 
                              pathname: "/components/BusinessDetails", 
                              params: { id: item._id } 
                            });
                          }}
                        >
                          <BusinessList
                            name={item.name}
                            category={item.category}
                            location={item.location?.lat ? `${item.location.lat.toFixed(3)}, ${item.location.long.toFixed(3)}` : "N/D"}
                          />
                        </TouchableRipple>
                      </Surface>

                      <View style={{ position: 'absolute', right: 8, top: 8 }}>
                        <IconButton
                          icon="plus"
                          mode="contained"
                          containerColor="#FF6600"
                          iconColor="white"
                          size={20}
                          onPress={() => Alert.alert("Guardar", item.name)}
                        />
                      </View>
                    </View>
                  )}
                />
              )}
            </View>
          )}
        </View>
      </SafeAreaView>

      <CustomSnackBar 
        visible={snackbarVisible} 
        onDismiss={() => setSnackbarVisible(false)} 
        message="Negócio guardado!" 
      />
    </View>
  );
}
