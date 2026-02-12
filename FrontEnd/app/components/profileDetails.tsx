import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View,  } from 'react-native'
import React, { useCallback, useState } from 'react'
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

const ProfileDetails = ({name,email,city} :any) => {
  
  const { logout } = useAuth(); // Extrai a função de logout
  const router = useRouter();

  const [user,setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)


  const roleLabels: Record<string, string> = {
  cidadao: "Cidadão",
  comerciante: "Comerciante",
  camara: "Câmara Municipal",
};

    const loadProfile = async () => {
  try {
    setLoading(true);
    const jsonValue = await SecureStore.getItemAsync("userInfo");
    console.log("DEBUG - Dados no Store:", jsonValue);

    if (jsonValue) {
      const userData = JSON.parse(jsonValue);
      
      // Criamos o nome a partir do email caso o campo 'name' não exista
      const email = userData.email || "";
      const nomeExtraido = email.split('@')[0]; 

      // Atualizamos o estado com o nome processado
      setUser({
        ...userData,
        name: nomeExtraido
      });
    }
  } catch (err) {
    console.error("Erro ao carregar utilizador", err);
  } finally {
    setLoading(false);
  }
};

const handleLogout = async () => {
    Alert.alert(
      "Sair",
      "Tens a certeza que queres terminar sessão?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive",
          onPress: async () => {
            await logout(); // Limpa o estado e o SecureStore
            router.replace('/(accountCreation)/login'); // Volta para o ecrã de login
          } 
        }
      ]
    );
  };

    useFocusEffect(
        useCallback(() =>{

            loadProfile()

        },[]),
    )
  
    return (
        <View className="w-full items-center">
          {/* Avatar ou Círculo com Inicial */}
          <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center mb-4">
            <Text className="text-purple-600 text-3xl font-bold uppercase">
              {user?.name?.charAt(0) || "V"}
            </Text>
          </View>

          <Text className="text-2xl text-gray-800 text-center">
            Olá, <Text className="font-bold text-purple-700">{user?.name || "Visitante"}</Text>
          </Text>
          
          <View className="bg-gray-100 px-4 py-1 rounded-full mt-2">
            <Text className="text-gray-600 font-medium">
              {user?.role ? roleLabels[user.role] : "Perfil Geral"}
            </Text>
          </View>

          {/* Botão de Logout Estilizado Direto */}
          <TouchableOpacity 
            onPress={handleLogout}
            activeOpacity={0.7}
            className="bg-red-500 w-60 py-4 rounded-2xl mt-12 shadow-md items-center"
          >
            <Text className="text-white font-bold text-lg">Terminar Sessão</Text>
          </TouchableOpacity>
        </View>
      )}
  


export default ProfileDetails

const styles = StyleSheet.create({})