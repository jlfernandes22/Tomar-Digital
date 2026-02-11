import React, { useState, useCallback } from "react";
import { FlatList, Text, View, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { useAuth } from "@/context/AuthContext";

const Saved = () => {
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
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
  keyExtractor={(item: any) => item._id}
  renderItem={({ item }) => (
    <BusinessList
      // Acedemos ao objeto businessId que foi "populado" pelo backend
      name={item.businessId?.name || "Negócio não encontrado"}
      category={item.businessId?.category || ""}
      location={item.businessId?.location || ""}
    />
          )}
          ListEmptyComponent={() => (
            <View style={{ marginTop: 50, alignItems: 'center' }}>
              <Text style={{ color: '#999' }}>Ainda não guardaste nenhum negócio.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Saved;