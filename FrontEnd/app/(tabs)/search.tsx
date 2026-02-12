import React, { useState, useCallback } from "react";
import {ActivityIndicator, FlatList, Text,TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SearchBar } from "react-native-screens";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { useFocusEffect } from 'expo-router';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 15, backgroundColor: '#f9f9f9' }}>
        <TextInput
          style={{
            height: 50,
            backgroundColor: '#fff',
            borderRadius: 12,
            paddingHorizontal: 15,
            borderWidth: 1,
            borderColor: '#e0e0e0',
            fontSize: 16,
            // Sombra leve para parecer mais moderno
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3.84,
            elevation: 2,
          }}
          placeholder="Procurar negócio..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={(text) => aoEscrever(text)}
        />
      </View>
      {/* Lista de Resultados */}
  <View style={{ flex: 1}}>
        {loading ? (
          <ActivityIndicator size="large" color="red" style={{ marginTop: 20 }} />
        ) : (
              <FlatList
  data={listaFiltrada}
  keyExtractor={(item: any) => item._id}
  renderItem={({ item }) => (
    <View className="relative">
      <TouchableOpacity onPress={() => console.log("Ver detalhes")}>
        <BusinessList
          name={item.name}
          category={item.category}
          // Se location for um objeto {lat, long}, passamos uma string formatada
          location={
            item.location?.lat 
              ? `${item.location.lat.toFixed(3)}, ${item.location.long.toFixed(3)}` 
              : "Localização não definida"
          }
        />
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => confirmarGuardar(item)}
        className="absolute right-6 top-6 bg-purple-600 w-10 h-10 rounded-full items-center justify-center shadow-md"
      >
        <Text className="text-white font-bold text-xl">+</Text>
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
