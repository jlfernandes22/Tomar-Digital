import React, { useState, useCallback } from "react";
import { Image,FlatList, Text, View, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { API_URL } from '@/constants/api';
import BusinessList from "../components/businessList";
import { useAuth } from "@/context/AuthContext";
import { images } from "@/constants/images";

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
};return (
    <SafeAreaView className="flex-1 bg-tomar-50">
      <View className="p-6">
        <Text className="text-3xl text-center font-bold text-primary">Os Meus Favoritos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FF6600" className="mt-20" />
      ) : (
        <FlatList
          data={favoritos}
          contentContainerStyle={{ 
            paddingHorizontal: 16, 
            paddingBottom: 20,
            flexGrow: 1 // Importante para o ListEmptyComponent centrar verticalmente
          }}
          keyExtractor={(item: any) => item._id}
          renderItem={({ item }) => (
            <View className="relative mb-4">
              {/* Card Principal */}
              <TouchableOpacity  
                activeOpacity={0.7}
                onPress={() => {
                  router.push({
                    pathname: '/components/detalhesBusiness',
                    params: { id: item.businessId?._id}
                  })
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Ver detalhes de ${item.businessId?.name || "negócio"}`}
                className="bg-white rounded-2xl border border-tomar-200 shadow-sm overflow-hidden"
              >
                <BusinessList
                  name={item.businessId?.name || "Negócio não disponível"}
                  category={item.businessId?.category || "N/A"}
                  location={item.businessId?.location || ""}
                />
              </TouchableOpacity>
              
              {/* Botão de Remover */}
              <TouchableOpacity 
                onPress={() => {
                  if(item.businessId) retirarFavorito(item.businessId._id)
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Remover ${item.businessId?.name} dos favoritos`}
                className="absolute right-3 top-7 bg-red-600 h-10 px-4 rounded-full shadow-md items-center justify-center"
              >
                <Text className="text-white font-bold">Remover</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center px-10 pb-20">
              <Image 
                source={images.favWaiting}
                className="w-64 h-64 mb-6"
                resizeMode="contain"
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={true}
              />
              <Text className="text-primary text-2xl font-bold text-center mb-2">
                Lista vazia
              </Text>
              <Text className="text-tomar-600 text-center text-base">
                Parece que ainda não guardou nenhum dos tesouros de Tomar nos seus favoritos.
              </Text>
              
              <TouchableOpacity 
                onPress={() => router.push('/search')} // Ajuste para a sua rota de busca
                className="mt-8 bg-brand-600 px-8 py-4 rounded-full shadow-md active:bg-brand-800"
                accessibilityRole="button"
                accessibilityLabel="Ir para a página de pesquisa para adicionar favoritos"
              >
                <Text className="text-white font-bold text-lg">Descobrir Negócios</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default Saved;