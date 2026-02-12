import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
const profileDetails = () => {
  const { logout, user } = useAuth();
  const router = useRouter();

  const roleLabels: Record<string, string> = {
    cidadao: "Cidadão",
    comerciante: "Comerciante",
    camara: "Câmara Municipal",
  };

  // Se o user ainda não carregou
  if (!user) return <ActivityIndicator size="large" color="#7c3aed" />;

  return (
    <View className="w-full items-center">
      {/* Avatar */}
      <View className="w-24 h-24 bg-purple-100 rounded-full items-center justify-center mb-4">
        <Text className="text-purple-600 text-3xl font-bold uppercase">
          {(user.name || user.email || "V").charAt(0)}
        </Text>
      </View>

      <Text className="text-2xl text-gray-800 text-center">
        Olá, <Text className="font-bold text-purple-700">
          {user.name || user.email.split('@')[0]}
        </Text>
      </Text>
      
      <View className="bg-gray-100 px-4 py-1 rounded-full mt-2">
        <Text className="text-gray-600 font-medium">
          {roleLabels[user.role] || "Utilizador"}
        </Text>
      </View>

      <View className="bg-purple-600 px-6 py-2 rounded-full mt-4">
        <Text className="text-white font-bold text-lg">
          {/* Validação final para nunca mostrar NaN no ecrã */}
          {(!isNaN(Number(user.saldo))) ? `${Number(user.saldo).toFixed(2)}€` : "0.00€"}
        </Text>
      </View>

      <TouchableOpacity onPress={logout} className="bg-red-500 w-60 py-4 rounded-2xl mt-12 items-center">
        <Text className="text-white font-bold text-lg">Terminar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
};
export default profileDetails;