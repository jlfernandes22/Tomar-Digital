import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  LayoutAnimation,
  FlatList,
  ScrollView,
} from "react-native";

import {
  Surface,
  Searchbar,
  IconButton,
  TouchableRipple,
  useTheme,
  Text,
  FAB,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import Map from "../components/Map";
import BusinessList from "../components/BusinessList";
import CustomSnackBar from "../components/CustomSnackBar";
import { useAuth } from "@/context/AuthContext";
import CustomChip from "../components/CustomChip";
import { calcularDistancia } from "../utils/locationUtils";

// INTERFACES
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
  // INICIALIZAR ESTADOS COM TIPAGEM (Essencial para o item.name funcionar)
  const [listaNegocios, setListaNegocios] = useState<Negocio[]>([]);
  const [listaFiltrada, setListaFiltrada] = useState<Negocio[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const theme = useTheme();
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [showCloseBusiness, setShowCloseBusiness] = useState(false);
  //vair ser usado para fazer zoom em qual dos negócios estiver perto do utilizador
  const [itemVisivelId, setItemVisivelId] = useState<string | null>(null);

  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [bizInArea, setBizInArea] = useState<Negocio[]>([]);

  const [idsFavorite, setIdsFavorite] = useState<string[]>([]);
  const [loadingFav, setLoadingFav] = useState(false);

  const [negocioSelecionado, setNegocioSelecionado] = useState<Negocio | null>(
    null,
  );

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
      const apenasAprovados = dados.filter(
        (item: Negocio) => item.status === "aprovado",
      );
      setListaNegocios(apenasAprovados);
    } catch (error) {
      console.log("Erro ao obter negócios", error);
    } finally {
      setLoading(false);
    }
  };

  //checkFavorite
  const fetchFavorite = async () => {
    if (!user?.id || !negocioSelecionado?._id) return;

    try {
      const response = await fetch(`${API_URL}/meusFavoritos/${user.id}`);
      const dados = await response.json();
      const lista = Array.isArray(dados) ? dados : dados.favoritos || [];

      // Verificamos se o ID do negócio selecionado está na lista de favoritos
      //const existe = lista.some(
      //  (fav: any) =>
      //    (fav.businessId?._id || fav.businessId) === negocioSelecionado._id,
      //);
      console.log(lista);
      const ids = lista.map(
        (fav: any) => fav.businessId?._id || fav.businessId._id,
      );

      console.log(ids);
      setIdsFavorite(ids);
    } catch (error) {
      console.log("Erro ao obter favoritos:", error);
    }
  };

  // 3. Alternar Favorito (Guardar/Retirar)
  const toggleFavorite = async (businessId: string) => {
    if (!user?.id) {
      //trocar para snackbar
      Alert.alert(
        "Aviso",
        "Tens de ter sessão iniciada para guardar favoritos.",
      );
      return;
    }

    setLoadingFav(true);
    const currentFav = idsFavorite.includes(businessId);
    const endpoint = currentFav ? "/retirarFavorito" : "/guardarFavorito";

    //console.log(isFavorite);
    //console.log(user.id);
    //quando se usa os negócios perto não está a ser selecionado negócio o que causa problema
    console.log(negocioSelecionado?._id);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          businessId: negocioSelecionado?._id,
        }),
      });

      if (response.ok) {
        if (endpoint === "/guardarFavorito") {
          // Chamámos o guardar e deu OK -> adicionamos da lista
          setIdsFavorite((prev) => [...prev, businessId]);
        } else if (endpoint === "/retirarFavorito") {
          // Chamámos o retirar e deu OK -> Removemos da lista
          setIdsFavorite((prev) => prev.filter((id) => id !== businessId));
        }
      }
    } catch (error) {
      //trocar para snackbar
      Alert.alert("Erro", "Não foi possível atualizar os favoritos.");
    } finally {
      setLoadingFav(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNegocios();
      fetchFavorite(); // Esta função vai à API ver a lista atualizada
      //console.log("chamado")
    }, [user?.id]), // ou id nos Detalhes
  );
  const onChangeSearch = (query: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery(query);

    if (query === "") {
      setListaFiltrada([]);
    } else {
      const filtrados = listaNegocios.filter((item) => {
        const coincideNome = item.name
          ?.toLowerCase()
          .includes(query.toLowerCase());

        const coincideCategoria = category === "" || item.category === category;

        return coincideNome && coincideCategoria;
      });

      setListaFiltrada(filtrados);
    }
  };

  //Função para verificar se o negócio está na área do utilizador
  const inRange = () => {
    if (!userLocation) return;

    const closeBiz = listaNegocios.filter((negocio) => {
      const distancia = calcularDistancia(
        negocio.location.lat,
        negocio.location.long,
        userLocation?.latitude,
        userLocation?.longitude,
      );

      return distancia <= 250;
    });

    //console.log(closeBiz)
    //console.log(negocioSelecionado)

    setBizInArea(closeBiz);
  };

  //significa que se o item estiver 50% visivel fica selecionado
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      // viewableItems é um array com todos os itens que estão visíveis neste momento
      if (viewableItems.length > 0) {
        // Como o carrossel mostra um de cada vez, o primeiro do array é o que está em destaque
        const itemVisivel = viewableItems[0].item;
        setItemVisivelId(itemVisivel._id);
        setNegocioSelecionado(itemVisivel);
        //console.log(itemVisivel._id);
        //console.log(negocioSelecionado?._id);
        //arranjar maneira para verificar se é favorito mais depressa :( carregar do servidor logo todos os favoritos e apartir dai

        //aqui é feito o zoom conforme qual está selecionado
        mapRef.current?.focusOnLocation(
          itemVisivel.location.lat,
          itemVisivel.location.long,
        );
      }
    },
  ).current;

  useEffect(() => {
    inRange();
  }, [userLocation, listaNegocios]);

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

  const isSelectedFavorite = negocioSelecionado
    ? idsFavorite.includes(negocioSelecionado._id)
    : false;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {/* showPin TRUE (Se estiver false, os pins não aparecem) */}
        <Map
          ref={mapRef}
          showPin={true}
          businesses={filteredPins}
          readOnly
          onMarkerPress={(biz) => {
            setNegocioSelecionado(biz);
            setShowCloseBusiness(false);
            setListaFiltrada([]);
          }}
          onUserLocationUpdate={(coord) => setUserLocation(coord)}
        />
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
                  <Surface
                    elevation={2}
                    style={{
                      borderRadius: 12,
                      marginBottom: 8,
                      overflow: "hidden",
                    }}
                  >
                    <TouchableRipple
                      onPress={() => {
                        focarNoMapa(item);
                        setNegocioSelecionado(item); // Define o negócio ao clicar na lista
                      }}
                    >
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
      </SafeAreaView>

      {negocioSelecionado && !showCloseBusiness && (
        <Surface
          elevation={5}
          style={{
            position: "absolute",
            bottom: 30,
            left: 20,
            right: 20,
            backgroundColor: theme.colors.secondaryContainer,
            borderRadius: 20,
            padding: 20,
            zIndex: 1000,
            elevation: 10, // Garante que fica acima do mapa no Android
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: theme.colors.onBackground,
                  fontSize: 22,
                  fontWeight: "bold",
                }}
              >
                {negocioSelecionado.name}
              </Text>
              <Text style={{ color: theme.colors.onBackground, fontSize: 14 }}>
                {negocioSelecionado.category}
              </Text>
            </View>
            <IconButton
              icon="close"
              onPress={() => {
                setNegocioSelecionado(null);
                true;
              }}
            />
          </View>

          <View
            style={{
              marginVertical: 15,
              borderTopWidth: 0.5,
              borderColor: "#eee",
              paddingTop: 15,
            }}
          >
            <Text style={{ color: theme.colors.onBackground, marginBottom: 5 }}>
              📍 Lat: {negocioSelecionado.location.lat.toFixed(4)} | Long:{" "}
              {negocioSelecionado.location.long.toFixed(4)}
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            {/* Botão de Favoritos */}
            <TouchableRipple
              disabled={loadingFav}
              style={{
                backgroundColor: isSelectedFavorite
                  ? theme.colors.errorContainer
                  : theme.colors.surfaceVariant,
                paddingHorizontal: 15,
                borderRadius: 12,
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 1,
                borderColor: isSelectedFavorite
                  ? theme.colors.error
                  : theme.colors.outlineVariant,
              }}
              onPress={() => toggleFavorite(negocioSelecionado._id)}
            >
              {loadingFav ? (
                <ActivityIndicator size={24} color={theme.colors.primary} />
              ) : (
                <IconButton
                  icon={isSelectedFavorite ? "heart" : "heart-outline"}
                  iconColor={
                    isSelectedFavorite
                      ? theme.colors.error
                      : theme.colors.onSurfaceVariant
                  }
                  size={24}
                  style={{ margin: 0 }}
                />
              )}
            </TouchableRipple>

            {/* Botão de Navegação (Mapa Externo) */}
            <TouchableRipple
              style={{
                flex: 1,
                backgroundColor: theme.colors.primary,
                paddingVertical: 14,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center",
              }}
              onPress={() => {
                if (!negocioSelecionado) return;
                const { lat, long } = negocioSelecionado.location;

                if (Platform.OS === "ios") {
                  const url = `maps://?q=${negocioSelecionado.name}&ll=${lat},${long}`;
                  Linking.openURL(url).catch(() =>
                    Alert.alert("Erro", "Não foi possível abrir o Apple Maps"),
                  );
                } else {
                  const url = `geo:${lat},${long}?q=${lat},${long}(${negocioSelecionado.name})`;
                  Linking.canOpenURL(url).then((supported) => {
                    if (supported) {
                      Linking.openURL(url);
                    } else {
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${lat},${long}`,
                      );
                    }
                  });
                }
              }}
            >
              <Text
                style={{
                  color: theme.colors.onPrimary,
                  fontWeight: "bold",
                  fontSize: 16,
                }}
              >
                VER NO MAPA
              </Text>
            </TouchableRipple>
          </View>
        </Surface>
      )}

      {bizInArea.length > 0 && showCloseBusiness && (
        <View
          style={{
            position: "absolute",
            bottom: 30,
            left: 0,
            right: 0,
            /* * Configuração crítica para sobreposição em componentes nativos (react-native-maps).
             * É obrigatório definir uma altura estrita (height) e uma elevação (elevation)
             * para garantir que o motor de gestos do Android reconheça a hierarquia de toques.
             */
            height: 250,
            elevation: 10,
            zIndex: 1000,
          }}
          /*
           * pointerEvents="box-none" permite que as áreas transparentes/vazias desta View
           * não retenham os eventos de toque, delegando-os para o mapa subjacente.
           */
          pointerEvents="box-none"
        >
          <FlatList
            data={bizInArea}
            keyExtractor={(item) => item._id}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 10,
            }}
            //props para fazer as animações conforme o id selecionado
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            /* * Configuração de paginação (snapping) do carrossel.
             * O valor 335 é a soma da largura do item (320) + margem direita (15).
             */
            snapToInterval={335}
            decelerationRate="fast"
            snapToAlignment="start"
            renderItem={({ item }) => {
              const isFavorite = idsFavorite.includes(item._id);
              return (
                <Surface
                  elevation={5}
                  style={{
                    /* * Largura fixa deliberada (320px) para garantir que o próximo item
                     * do array fique parcialmente visível, induzindo a ação de scroll horizontal.
                     */
                    width: 320,
                    marginRight: 15,
                    backgroundColor: theme.colors.secondaryContainer,
                    borderRadius: 20,
                    padding: 20,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          color: theme.colors.onBackground,
                          fontSize: 22,
                          fontWeight: "bold",
                        }}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          color: theme.colors.onBackground,
                          fontSize: 14,
                        }}
                      >
                        {item.category}
                      </Text>
                    </View>
                    <IconButton
                      icon="close"
                      // Esvazia o array de resultados de proximidade, o que desmonta este componente da UI
                      onPress={() => {
                        setNegocioSelecionado(null);
                        setShowCloseBusiness(false);
                      }}
                    />
                  </View>

                  <View
                    style={{
                      marginVertical: 15,
                      borderTopWidth: 0.5,
                      borderColor: "#eee",
                      paddingTop: 15,
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.onBackground,
                        marginBottom: 5,
                      }}
                    >
                      📍 Perto de ti!
                    </Text>
                  </View>

                  <View
                    style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
                  >
                    {/* Controlo de estado para adicionar/remover o negócio aos favoritos do utilizador */}
                    <TouchableRipple
                      disabled={loadingFav}
                      style={{
                        backgroundColor: isFavorite
                          ? theme.colors.errorContainer
                          : theme.colors.surfaceVariant,
                        paddingHorizontal: 15,
                        borderRadius: 12,
                        justifyContent: "center",
                        alignItems: "center",
                        borderWidth: 1,
                        borderColor: isFavorite
                          ? theme.colors.error
                          : theme.colors.outlineVariant,
                      }}
                      onPress={() => toggleFavorite(item._id)}
                    >
                      {loadingFav ? (
                        <ActivityIndicator
                          size={24}
                          color={theme.colors.primary}
                        />
                      ) : (
                        <IconButton
                          icon={isFavorite ? "heart" : "heart-outline"}
                          iconColor={
                            isFavorite
                              ? theme.colors.error
                              : theme.colors.onSurfaceVariant
                          }
                          size={24}
                          style={{ margin: 0 }}
                        />
                      )}
                    </TouchableRipple>

                    {/* Ação de Deep Linking para aplicações de navegação externas */}
                    <TouchableRipple
                      style={{
                        flex: 1,
                        backgroundColor: theme.colors.primary,
                        paddingVertical: 14,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      onPress={() => {
                        const { lat, long } = item.location;

                        if (Platform.OS === "ios") {
                          // Protocolo URL Scheme nativo para o Apple Maps
                          const url = `maps://?q=${item.name}&ll=${lat},${long}`;
                          Linking.openURL(url).catch(() =>
                            Alert.alert(
                              "Erro",
                              "Não foi possível abrir o Apple Maps",
                            ),
                          );
                        } else {
                          // Protocolo Geo URI para integração com Google Maps no Android
                          const url = `geo:${lat},${long}?q=${lat},${long}(${item.name})`;
                          Linking.canOpenURL(url).then((supported) => {
                            if (supported) {
                              Linking.openURL(url);
                            } else {
                              // Fallback genérico web caso a app do Google Maps não esteja instalada
                              Linking.openURL(
                                `http://maps.google.com/?q=${lat},${long}`,
                              );
                            }
                          });
                        }
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onPrimary,
                          fontWeight: "bold",
                          fontSize: 16,
                        }}
                      >
                        VER NO MAPA
                      </Text>
                    </TouchableRipple>
                  </View>
                </Surface>
              );
            }}
          />
        </View>
      )}

      <FAB
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 160,
        }}
        loading={loading}
        onPress={() => {
          setShowCloseBusiness(true);
          fetchNegocios();
        }}
      ></FAB>

      <CustomSnackBar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        message={snackbarMessage}
      />
    </View>
  );
}
