import React, { useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, FlatList, RefreshControl, Alert, ScrollView } from "react-native";
import { Surface, Searchbar, IconButton, TouchableRipple, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import Map from "../components/Map";
import BusinessList from "../components/BusinessList";
import CustomSnackBar from "../components/CustomSnackBar";
import { useAuth } from "@/context/AuthContext";
import { LayoutAnimation } from 'react-native';
import CustomChip from "../components/CustomChip";

export default function Index() {
  const [listaNegocios, setListaNegocios] = useState([]);
  const [listaFiltrada, setListaFiltrada] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const mapRef = useRef<any>(null);
  const { user } = useAuth();

  const categories = [
    "Património & Museus", // Para o Convento, Sinagoga, Mata dos Sete Montes
    "Restauração", // Restaurantes e Tabernas
    "Cafés & Pastelarias", // Essencial para as "Fatias de Tomar"
    "Alojamento", // Hotéis e ALs
    "Comércio Local", // Lojas do centro histórico
    "Lazer & Natureza", // Rio Nabão, Parque do Mouchão
    "Serviços",
  ];

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
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

    const filteredPins = listaNegocios.filter((pin: any) => {
      if (category === "") return true; 
      // Caso contrário, mostra apenas os que coincidem
      return pin.category === category;
    });

return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      
      {/* MAPA - Fundo total */}
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Map ref={mapRef} showPin={false} businesses={filteredPins} />
      </View>

      {/* Interface por cima do mapa */}
      <SafeAreaView 
        style={{ flex: 1 }} 
        pointerEvents="box-none" // Permite clicar no mapa através dos espaços vazios
      >
        {/* Container da Searchbar e Categorias */}
        <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
          
          <Searchbar
            placeholder="Procurar negócio..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ borderRadius: 12 }}
          />

          {/* LISTA DE RESULTADOS DA PESQUISA (Suspensa) */}
          {listaFiltrada.length > 0 && (
            <View style={{ marginTop: 8, maxHeight: 300 }}>
              <FlatList
                data={listaFiltrada}
                keyExtractor={(item: any) => item._id}
                renderItem={({ item }) => (
                  <Surface elevation={2} style={{ borderRadius: 12, marginBottom: 8, overflow: 'hidden'}}>
                    <TouchableRipple onPress={() => focarNoMapa(item)}>
                       <BusinessList name={item.name} category={item.category} />
                    </TouchableRipple>
                  </Surface>
                )}
              />
            </View>
          )}

          {/* BARRA DE CATEGORIAS */}
          <View style={{ height: 60, marginTop: 8 }}> 
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                alignItems: 'center', 
                paddingRight: 20 
              }}
            >
              {categories.map((cat) => (
                <CustomChip
                  key={cat}
                  isSelected={category === cat}
                  onPress={() => {
                    setCategory(category === cat ? "" : cat);
                  }}
                  className="mx-1" 
                >
                  {cat}
                </CustomChip>
              ))}
            </ScrollView>
          </View>
        </View>

      </SafeAreaView>

      <CustomSnackBar 
        visible={snackbarVisible} 
        onDismiss={() => setSnackbarVisible(false)} 
        message={snackbarMessage} 
      />
    </View>
  );
}
