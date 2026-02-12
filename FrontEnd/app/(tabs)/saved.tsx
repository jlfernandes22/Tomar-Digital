import React, { useState, useCallback } from "react";
import { FlatList, Text, View, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { useAuth } from "@/context/AuthContext";

const Saved = () => {
interface Favorito {
  _id: string;
  userId: string;
  businessId: {
    _id: string;
    name: string;
    category: string;
    location: any;
  } | null; // Pode ser null se o negócio tiver sido apagado
}

  const { user } = useAuth();
const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  
  const carregarFavoritos = async () => {
  if (!user?.id) {
    return;
  }

  setLoading(true);
  try {
    console.log("Saved: A procurar favoritos para o ID:", user.id);
    const response = await fetch(`${API_URL}/meusFavoritos/${user.id}`);
    const dados = await response.json();
    const listaFinal = Array.isArray(dados) ? dados : (dados.favoritos || []);
    setFavoritos(listaFinal);
    
    console.log("Saved: Dados recebidos do servidor:", JSON.stringify(dados, null, 2));
    setFavoritos(dados); 
  } catch (error) {
    console.log("Erro ao carregar favoritos:", error);
  } finally {
    setLoading(false);
  }
};
  // Recarrega sempre que o utilizador entra nesta aba
  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [user?.id])
  );

const retirarFavorito = async (businessId: string) => {
  //Removemos logo da lista visual para ser instantâneo
  setFavoritos(prev => prev.filter(item => item.businessId?._id !== businessId));

  try {
    const response = await fetch(`${API_URL}/retirarFavorito`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user?.id, businessId })
    });

    if (!response.ok) {
      // Se o servidor der erro, recarregamos a lista original para não enganar o user
      carregarFavoritos();
      Alert.alert("Erro", "Não foi possível remover no servidor.");
    }
  } catch (error) {
    carregarFavoritos(); // Reverte em caso de erro de rede
  }
};
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Os Meus Favoritos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="red" />
      ) : (
        <FlatList
  data={favoritos}
  keyExtractor={(item) => item._id} // Agora o TS reconhece o _id
  renderItem={({ item }) => (
    <View className="relative">
      <BusinessList
        // Usamos encadeamento opcional (?.) para segurança
        name={item.businessId?.name || "Negócio não disponível"}
        category={item.businessId?.category || "N/A"}
        location={item.businessId?.location || ""}
      />
      
      {/* Botão de Remover */}
      <TouchableOpacity 
        onPress={() => {
          if(item.businessId) retirarFavorito(item.businessId._id)
        }}
        className="absolute right-4 top-5 bg-red-500 p-2 rounded-full shadow-sm"
      >
        <Text className="text-white font-bold px-1">Remover</Text>
      </TouchableOpacity>
    </View>
  )}
  ListEmptyComponent={() => (
    <View className="mt-20 items-center">
      <Text className="text-gray-400">A tua lista de favoritos está vazia.</Text>
    </View>
  )}
/>
      )}
    </SafeAreaView>
  );
};

export default Saved;