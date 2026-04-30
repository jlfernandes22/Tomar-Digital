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
  Dimensions,
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
import { router, useFocusEffect } from "expo-router";
import { API_URL } from "@/constants/api";
import Map from "../components/Map";
import BusinessList from "../components/BusinessList";
import CustomSnackBar from "../components/CustomSnackBar";
import { useAuth } from "@/context/AuthContext";
import CustomChip from "../components/CustomChip";
import { calcularDistancia } from "../../utils/locationUtils";
import { images } from "../../constants/images";
import MapFocous from "@/constants/MapFocous";
import getAddress from "../../utils/getAddress";

//interfaces
import Negocio from "@/constants/Interfaces/Negocio";

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
      setLoading(false);
    } catch (error) {
      console.log("Erro ao obter negócios", error);
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
      setSnackbarMessage(
        "Aviso:\nTens de ter sessão inciada para guardar favoritos",
      );
      return;
    }

    setLoadingFav(true);
    const currentFav = idsFavorite.includes(businessId);
    const endpoint = currentFav ? "/retirarFavorito" : "/guardarFavorito";

    //coloca-se logo para atualizar logo para o utilizador
    if (currentFav) {
      setIdsFavorite((prev) => prev.filter((id) => id !== businessId));
    } else {
      setIdsFavorite((prev) => [...prev, businessId]);
    }

    //console.log(isFavorite);
    //console.log(user.id);

    //console.log(negocioSelecionado?._id);
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          businessId: businessId,
        }),
      });

      if (!response.ok) {
      }
    } catch (error) {
      if (currentFav) {
        setIdsFavorite((prev) => [...prev, businessId]);
      } else {
        setIdsFavorite((prev) => prev.filter((id) => id !== businessId));
      }

      setSnackbarMessage("Erro:\n Não foi possível atualizar os favoritos.");
      setSnackbarVisible(true);
    } finally {
      setLoadingFav(false);
    }
  };

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
    setLoading(true);
    if (!userLocation) return;

    const closeBiz = filteredPins.filter((negocio) => {
      const distancia = calcularDistancia(
        negocio.location.lat,
        negocio.location.long,
        userLocation?.latitude,
        userLocation?.longitude,
      );

      setLoading(false);
      return (!category || negocio.category === category) && distancia <= 250;
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

        /*
          aqui é feito o zoom conforme qual está selecionado
          ao fazer desta maneira é mais dinâmico o que torna possível
          usar em outros screens sem muita dificuldade 
        */
        MapFocous(itemVisivel, mapRef);
        //focarNoMapa(itemVisivel);
      }
    },
  ).current;

  const filteredPins = listaNegocios.filter((pin) => {
    if (category === "") return true;
    return pin.category === category;
  });

  const isSelectedFavorite = negocioSelecionado
    ? idsFavorite.includes(negocioSelecionado._id)
    : false;

  useEffect(() => {
    inRange();
  }, [userLocation, category]);

  useFocusEffect(
    useCallback(() => {
      fetchNegocios();
      fetchFavorite(); // Esta função vai à API ver a lista atualizada
      //console.log("chamado")
    }, [user?.id]), // ou id nos Detalhes
  );

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
        <View style={{ marginTop: 10 }}>
          <Searchbar
            placeholder="Procurar negócio..."
            onChangeText={onChangeSearch}
            value={searchQuery}
            style={{ borderRadius: 12, marginHorizontal: 12 }}
          />

          {listaFiltrada.length > 0 && (
            <View style={{ marginTop: 8, maxHeight: 300 }}>
              <FlatList
                key={category || "all"}
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
                        MapFocous(item, mapRef);
                        setListaFiltrada([]);
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

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat) => (
              <CustomChip
                key={cat}
                isSelected={category === cat}
                onPress={() => {
                  setCategory(category === cat ? "" : cat);
                }}
                className="mr-1 h-[40px] mt-2"
              >
                {cat}
              </CustomChip>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>

      {/*Cartão do negócio selecionado*/}
      {negocioSelecionado && !showCloseBusiness && (
        <View
          style={{
            position: "absolute",
            bottom: 50,
            left: 0,
            right: 0,
            height: 250, // 1. Caixa invisível com a mesma altura da FlatList
            elevation: 10,
            zIndex: 1000,
          }}
          pointerEvents="box-none"
        >
          {/* 2. Imitamos o contentContainerStyle da FlatList para ter as margens perfeitas */}
          <TouchableRipple
            style={{
              flex: 1,
              justifyContent: "flex-end",
              paddingHorizontal: 20,
              paddingBottom: 10,
            }}
            onPress={() => {
              router.push({
                pathname: "/components/DetalhesBusiness",
                params: { id: negocioSelecionado._id },
              });
            }}
          >
            <Surface
              elevation={5}
              style={{
                width: 320, // 3. Mesma largura do cartão da lista
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 20,
                padding: 20,
                alignSelf: "center",
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
                      color: theme.colors.onSecondaryContainer,
                      fontSize: 22,
                      fontWeight: "bold",
                    }}
                  >
                    {negocioSelecionado.name}
                  </Text>
                  <Text
                    style={{
                      color: theme.colors.onSecondaryContainer,
                      fontSize: 14,
                    }}
                  >
                    {negocioSelecionado.category}
                  </Text>
                </View>
                <IconButton
                  icon="close"
                  iconColor={theme.colors.onSecondaryContainer}
                  onPress={() => {
                    setNegocioSelecionado(null);
                  }}
                />
              </View>

              <View
                style={{
                  marginVertical: 15,
                  borderTopWidth: 0.5,
                  borderColor: theme.colors.outlineVariant,
                  paddingTop: 15,
                }}
              >
                <Text
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    marginBottom: 5,
                  }}
                >
                  {negocioSelecionado.address
                    ? negocioSelecionado.address
                    : `Lat: ${negocioSelecionado.location.lat.toFixed(4)} | long: ${negocioSelecionado.location.long.toFixed(4)}`}
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
                          ? theme.colors.onErrorContainer
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
                        Alert.alert(
                          "Erro",
                          "Não foi possível abrir o Apple Maps",
                        ),
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
          </TouchableRipple>
        </View>
      )}

      {/* Lista dos negócios perto do utilizador */}
      {bizInArea.length > 0 && showCloseBusiness && (
        <View
          style={{
            position: "absolute",
            bottom: 20, // Mantém a lista na parte inferior
            left: 0,
            right: 0,
            zIndex: 2000, // Força a estar acima do FAB
            elevation: 20, // Força no Android
          }}
        >
          <FlatList
            key={category || "all"}
            data={bizInArea}
            keyExtractor={(item) => item._id}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: (Dimensions.get("window").width - 320) / 2,
              paddingBottom: 40,
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
                <TouchableRipple
                  onPress={() => {
                    router.push({
                      pathname: "/components/DetalhesBusiness",
                      params: { id: itemVisivelId },
                    });
                  }}
                >
                  <Surface
                    elevation={5}
                    style={{
                      width: 320,
                      marginRight: 15,
                      backgroundColor: theme.colors.secondaryContainer,
                      borderRadius: 20,
                      padding: 20,
                      alignSelf: "flex-end",
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
                            color: theme.colors.onSecondaryContainer,
                            fontSize: 22,
                            fontWeight: "bold",
                          }}
                        >
                          {item.name}
                        </Text>
                        <Text
                          style={{
                            color: theme.colors.onSecondaryContainer,
                            fontSize: 14,
                          }}
                        >
                          {item.category}
                        </Text>
                      </View>
                      <IconButton
                        icon="close"
                        iconColor={theme.colors.onSecondaryContainer}
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
                        borderColor: theme.colors.outlineVariant,
                        paddingTop: 15,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onSecondaryContainer,
                          marginBottom: 5,
                        }}
                      >
                        {item.address
                          ? item.address
                          : `Lat: ${item.location.lat.toFixed(4)} | long: ${item.location.long.toFixed(4)}`}
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
                                ? theme.colors.onErrorContainer
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
                </TouchableRipple>
              );
            }}
          />
        </View>
      )}

      <FAB
        icon={images.bagImg}
        style={{
          position: "absolute",
          margin: 16,
          right: 0,
          bottom: 160,
          backgroundColor: theme.colors.primary,
        }}
        color={theme.colors.onPrimary}
        loading={loading}
        onPress={() => {
          setShowCloseBusiness(true);
          inRange();
        }}
        disabled={loading}
      ></FAB>

      <CustomSnackBar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        message={snackbarMessage}
      />
    </View>
  );
}
