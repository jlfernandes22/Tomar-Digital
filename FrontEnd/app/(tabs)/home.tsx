import React, { useState, useCallback, useRef } from "react";
import { View, ActivityIndicator, StyleSheet, FlatList, RefreshControl, Alert, ScrollView, Linking, Platform } from "react-native"; // Adicionado Linking aqui
import { Surface, Searchbar, IconButton, TouchableRipple, useTheme, Text} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import Map from "../components/Map";
import BusinessList from "../components/BusinessList";
import CustomSnackBar from "../components/CustomSnackBar";
import { useAuth } from "@/context/AuthContext";
import { LayoutAnimation } from 'react-native';
import CustomChip from "../components/CustomChip";

// 1. MOVER AS INTERFACES PARA FORA DA FUNÇÃO (Boa prática e evita erros de escopo)
interface BusinessLocation {
  lat: number;
  long: number;
}

interface Negocio {
  _id: string;
  owner: string;
  name: string;
  category: string;
  location: BusinessLocation;
  status: string;
  NIF?: number | null;
  email?: string; 
}

export default function Index() {
  // 2. INICIALIZAR ESTADOS COM TIPAGEM (Essencial para o item.name funcionar)
  const [listaNegocios, setListaNegocios] = useState<Negocio[]>([]);
  const [listaFiltrada, setListaFiltrada] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(null);

  const mapRef = useRef<any>(null);
  const { user } = useAuth();

  const categories = [
    "Património & Museus",
    "Restauração",
    "Cafés & Pastelarias",
    "Alojamento",
    "Comércio Local",
    "Lazer & Natureza",
    "Serviços",
  ];

  const fetchNegocios = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/negocios`);
      const dados = await response.json();
      // Garantir que os dados mapeados seguem a interface
      const apenasAprovados = dados.filter((item: Negocio) => item.status === "aprovado");
      setListaNegocios(apenasAprovados);
    } catch (error) {
      console.log("Erro ao obter negócios", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchNegocios(); }, []));

  const onChangeSearch = (query: string) => {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setSearchQuery(query);

  if (query === "") {
    setListaFiltrada([]);
  } else {
    const filtrados = listaNegocios.filter((item) => {

      const coincideNome = item.name?.toLowerCase().includes(query.toLowerCase());

      const coincideCategoria = category === "" || item.category === category;

      return coincideNome && coincideCategoria;
    });

    setListaFiltrada(filtrados);
  }
};

  const focarNoMapa = (item: Negocio) => {
    setListaFiltrada([]); 
    if (mapRef.current?.focusOnLocation) {
      mapRef.current.focusOnLocation(item.location.lat, item.location.long);
    }
  };

  const filteredPins = listaNegocios.filter((pin) => {
    if (category === "") return true; 
    return pin.category === category;
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        {/* 3. MUDAR showPin PARA TRUE (Se estiver false, os pins não aparecem) */}
        <Map ref={mapRef} showPin={true} businesses={filteredPins} />
      </View>

      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        <View style={{ paddingHorizontal: 12, marginTop: 10 }}>
          <Searchbar
            placeholder="Procurar negócio..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ borderRadius: 12 }}
          />

          {listaFiltrada.length > 0 && (
            <View style={{ marginTop: 8, maxHeight: 300 }}>
              <FlatList
                data={listaFiltrada}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <Surface elevation={2} style={{ borderRadius: 12, marginBottom: 8, overflow: 'hidden'}}>
                    <TouchableRipple onPress={() => {
                        focarNoMapa(item);
                        setNegocioSelecionado(item); // Define o negócio ao clicar na lista
                    }}>
                       <BusinessList name={item.name} category={item.category} />
                    </TouchableRipple>
                  </Surface>
                )}
              />
            </View>
          )}

          <View style={{ height: 60, marginTop: 8 }}> 
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {categories.map((cat) => (
                <CustomChip
                  key={cat}
                  isSelected={category === cat}
                  onPress={() => setCategory(category === cat ? "" : cat)}
                >
                  {cat}
                </CustomChip>
              ))}
            </ScrollView>
          </View>
        </View>

        {negocioSelecionado && (
          <Surface 
            elevation={5} 
            style={{ 
              position: 'absolute', bottom: 30, left: 20, right: 20, 
              backgroundColor: theme.colors.background, borderRadius: 20, padding: 20, zIndex: 1000
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.colors.onBackground, fontSize: 22, fontWeight: 'bold' }}>{negocioSelecionado.name}</Text>
                <Text style={{  color: theme.colors.onBackground,fontSize: 14 }}>{negocioSelecionado.category}</Text>
              </View>
              <IconButton icon="close" onPress={() => setNegocioSelecionado(null)} />
            </View>

            <View style={{ marginVertical: 15, borderTopWidth: 0.5, borderColor: '#eee', paddingTop: 15 }}>
              <Text style={{color: theme.colors.onBackground, marginBottom: 5 }}>📍 Lat: {negocioSelecionado.location.lat} | Long: {negocioSelecionado.location.long}</Text>
            </View>

            <TouchableRipple
              style={{ backgroundColor: theme.colors.primary, paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
              onPress={() => {
  if (!negocioSelecionado) return;

      const { lat, long } = negocioSelecionado.location;

      if (Platform.OS === 'ios') {
              // Esqueleto de URL para Apple Maps (iOS)
              // sll = lat/long do marcador
              const url = `maps://?q=${negocioSelecionado.name}&ll=${lat},${long}`;              
              Linking.openURL(url).catch(err => 
                Alert.alert("Erro", "Não foi possível abrir o Apple Maps")
          );

          } else {
            // Esqueleto de URL para Google Maps (Android)
            const url = `geo:${lat},${long}?q=${lat},${long}(${negocioSelecionado.name})`;
            Linking.canOpenURL(url).then(supported => {
              if (supported) {
                Linking.openURL(url);
              } else {
                // Fallback para o browser caso não tenha a App instalada
                Linking.openURL(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${long}`);
              }
            });
          }
          }}
         >
              <Text style={{color: theme.colors.background, fontWeight: 'bold', fontSize: 16 }}>VER STREET VIEW</Text>
            </TouchableRipple>
          </Surface>
        )}
      </SafeAreaView>

      <CustomSnackBar visible={snackbarVisible} onDismiss={() => setSnackbarVisible(false)} message={snackbarMessage} />
    </View>
  );
}