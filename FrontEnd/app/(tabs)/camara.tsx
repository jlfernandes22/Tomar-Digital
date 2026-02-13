import React, { useEffect, useState } from "react";
import { Text, View, FlatList, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext"; 
import { router } from "expo-router";

export default function CamaraIndex() {

  interface Business {
    _id: string;
    name: string;
    category: string;
    owner: string;
    status: string;
  }

  interface Owner {
    _id: string;
    name: string;
    email: string;
  }

  const [pendentes, setPendentes] = useState<Business[]>([]);
  const [pendOwners, setPendOwners] = useState<Owner[]>([])
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 1. Função para carregar negócios pendentes
  const fetchPendentes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/business/pendentes`, {
        method: 'GET', 
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
    if (response.ok) {
        const data = await response.json();
        setPendentes(data);
      } else {
        console.error("Erro na resposta:", response.status);
      }
    } catch (error) {
      console.log(error)
      Alert.alert("Erro", "Não foi possível carregar os pedidos.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { if (user?.token) fetchPendentes(); }, [user?.token]);


  // 1. Função para carregar negócios pendentes
  const fetchOwner = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/utilizador/negocioPendentes`, {
        method: 'GET', 
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });
    if (response.ok) {
        const data = await response.json();
        
        setPendOwners(data);
      } else {
        console.error("Erro na resposta:", response.status);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os donos.");
    } finally {
      setLoading(false);
    }
  };
    useEffect(() => { if (user?.token) fetchOwner(); }, [user?.token]);

  // para Aprovar
  const handleAprovar = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/business/aprovar/${id}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${user?.token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Negócio aprovado!");
        setPendentes(prev => prev.filter(item => item._id !== id));
      } else {
        Alert.alert("Erro", "O servidor recusou a aprovação.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao aprovar.");
    }
  };

  const handleDescartar = async (id: string) => {
  Alert.alert(
    "Confirmar",
    "Tens a certeza que queres descartar este pedido?",
    [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Descartar", 
        style: "destructive",
        onPress: async () => {
          try {
            // Podes usar o método DELETE ou uma rota específica como /rejeitar
            const response = await fetch(`${API_URL}/business/rejeitar/${id}`, {
              method: 'DELETE',
              headers: { 
                'Authorization': `Bearer ${user?.token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              Alert.alert("Sucesso", "Pedido removido.");
              // Remove da lista local para atualizar a UI na hora
              setPendentes(prev => prev.filter(item => item._id !== id));
            }
          } catch (error) {
            Alert.alert("Erro", "Falha ao descartar.");
          }
        }
      }
    ]
  );
};

  if (loading) return<ActivityIndicator size="large" className="flex-1" />;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 p-4">
      <Text className="text-3xl font-bold text-secondary mb-6">Pedidos Pendentes</Text>

      {pendentes.length === 0 ? (
        <Text className="text-gray-500 text-center mt-10">Não há novos pedidos de Tomar.</Text>
      ) : (
        <FlatList
  data={pendentes}
  keyExtractor={(item) => item._id}
  renderItem={({ item }) => {
    
    // 1. Procuramos o dono específico deste negócio na lista pendOwners
    const donoEspecifico = pendOwners.find((dono) => dono._id === item.owner);

    return (
      <View className="relative border-2 p-2 rounded-3xl mb-4">
        <TouchableOpacity  
          onPress={() => {
            router.push({
              pathname: '/components/detalhesBusiness',
              params: { id: item._id}
            });
          }}
        >
          <View>
            <Text className="text-xl font-bold text-dark">{item.name}</Text>
            <Text className="text-primary italic">{item.category}</Text>
            
            {/* 2. Mostramos o nome do dono. Se ainda não existir, mostra 'A carregar...' */}
            <Text className="text-gray-400 text-xs mt-1">
              Dono: {donoEspecifico?.name || 'A carregar...'}
            </Text>
          </View>

          {/* Contentor dos Botões */}
          <View className="flex-row gap-x-3 mt-4">
            {/* Botão Aceitar */}
            <TouchableOpacity 
              onPress={() => handleAprovar(item._id)}
              className="bg-green-500 py-3 rounded-2xl flex-1 items-center"
            >
              <Text className="text-white font-bold">Aceitar</Text>
            </TouchableOpacity>

            {/* Botão Descartar */}
            <TouchableOpacity 
              onPress={() => handleDescartar(item._id)}
              className="bg-red-50 py-3 rounded-2xl flex-1 items-center border border-red-200"
            >
              <Text className="text-red-600 font-bold">Descartar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  }}
/>
      )}
    </SafeAreaView>
  );
  }
