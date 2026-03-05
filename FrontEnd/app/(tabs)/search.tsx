import React, { useState, useCallback } from "react";
import {ActivityIndicator, FlatList, Text,TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "react-native-screens";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { router, useFocusEffect } from 'expo-router';
import { Alert } from "react-native";
import { useAuth } from "@/context/AuthContext";

const Search = () => {

  //criar estado para guardar a lista de negócios
  const [listaNegocios, setListaNegocios] = useState([])
  const [listaFiltrada, setListaFiltrada] = useState([]); // Lista que será exibida
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('');

  const { user } = useAuth();
  //carrega a lista do servidor
  const handleNegocios = async () => {
  setLoading(true);
  try {
    const response = await fetch(`${API_URL}/negocios`);
    const dados = await response.json();

    // FILTRO: Apenas negócios com status 'aprovado' entram na lista
    // Se o status não existir (negócios antigos), podemos decidir se mostramos ou não
    const apenasAprovados = dados.filter((item: any) => item.status === 'aprovado');

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
      { 
        text: "Sim, guardar", 
        onPress: () => guardarNaLista(negocio._id) 
      }
    ]
  );
};

const guardarNaLista = async (businessId: string) => {
  if (!user?.id) {
    Alert.alert("Aviso", "Tens de ter conta para guardar favoritos!");
    return;
  }
  
  try {
    const response = await fetch(`${API_URL}/guardarFavorito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id, 
        businessId: businessId 
      })
    });

    const data = await response.json(); // Lemos a resposta mesmo que não seja OK

    if (response.ok) {
      console.log("SUCESSO NO BACKEND:", data);
      Alert.alert("Sucesso", "Negócio guardado!");
    } else {
      // Se o servidor respondeu, mas com erro (ex: 400 ou 500)
      console.log("ERRO DO SERVIDOR:", response.status, data);
      Alert.alert("Erro", data.message || "Não foi possível guardar.");
    }

  } catch (error) {
    // Se nem sequer conseguiu chegar ao servidor (erro de rede ou URL errada)
    console.log("ERRO DE CONEXÃO:", error);
    Alert.alert("Erro de Rede", "Verifica se o servidor está ligado.");
  }
};
// Função chamada sempre que o utilizador escreve
  const aoEscrever = (texto: string) => {
  setSearch(texto);
  console.log("Texto digitado:", texto); // Ver se o texto chega aqui
  
  if (texto === "") {
    setListaFiltrada(listaNegocios);
  } else {
    const novaLista = listaNegocios.filter((item: any) => {
      if (!item.name) return false; // Evita erro se o item não tiver nome
      
      const nomeNegocio = item.name.toLowerCase();
      const textoDigitado = texto.toLowerCase();
      
      return nomeNegocio.includes(textoDigitado);
    });
    
    console.log("Itens encontrados:", novaLista.length); // Ver se encontrou algo
    setListaFiltrada(novaLista);
  }
};

   useFocusEffect(
          useCallback(() =>{
  
              handleNegocios()
  
          },[])
      )

return (
    <SafeAreaView className="flex-1 bg-tomar-50"> 
      
      {/* Barra de Pesquisa */}
      <View className="px-4 mt-6 mb-4">
        <View className="flex-row items-center p-2 bg-tomar-100 rounded-xl border-2 border-tomar-700 shadow-sm">
          <TextInput
            className="text-primary text-lg w-full px-2" 
            placeholder="Procurar negócio..."
            placeholderTextColor="#503626" 
            value={search}
            onChangeText={aoEscrever}
            //Serve para quando o utilizador ativa o TalkBack (no Android) ou o VoiceOver (no iOS).
            accessibilityRole="search"
            accessibilityLabel="Barra de pesquisa de negócios"
            accessibilityHint="Filtra a lista de resultados abaixo à medida que escreve"
          />
        </View>
      </View>

      {/* Lista de Resultados */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#FF6600" className="mt-20" /> 
        ) : (
          <FlatList
            data={listaFiltrada}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            keyExtractor={(item: any) => item._id}
            renderItem={({ item }) => (
              <View className="relative mb-4">
                {/* Card do Negócio */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => {
                    router.push({
                      pathname: '/components/detalhesBusiness',
                      params: { id: item._id }
                    })
                  }}
            //Serve para quando o utilizador ativa o TalkBack (no Android) ou o VoiceOver (no iOS).
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalhes de ${item.name}`}
                  className="bg-white rounded-2xl border border-tomar-200 shadow-sm overflow-hidden"
                >
                  <BusinessList
                    name={item.name}
                    category={item.category}
                    location={
                      item.location?.lat 
                        ? `${item.location.lat.toFixed(3)}, ${item.location.long.toFixed(3)}` 
                        : "Localização não definida"
                    }
                  />
                </TouchableOpacity>

                {/* Botão Guardar/Adicionar */}
                <TouchableOpacity 
                    onPress={() => confirmarGuardar(item)}
                    //Serve para quando o utilizador ativa o TalkBack (no Android) ou o VoiceOver (no iOS).
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Adicionar ${item.name} aos favoritos`}
                    className="absolute right-4 top-4 bg-accent w-12 h-12 rounded-full items-center justify-center shadow-lg"
                  >
                    <Text 
                      className="text-white font-bold text-2xl" 
                     //Serve para quando o utilizador ativa o TalkBack (no Android) ou o VoiceOver (no iOS).                     
                      importantForAccessibility="no-hide-descendants" // Android
                      accessibilityElementsHidden={true}              // iOS
                    >
                      +
                    </Text>
                  </TouchableOpacity>
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};
    



export default Search;
