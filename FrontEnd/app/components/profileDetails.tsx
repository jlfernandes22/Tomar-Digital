import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React from 'react'
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import TabIcon from './Tabicon';
import { images } from "@/constants/images";

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
    <View className="w-full items-center relative p-6 ">
      
      {/* Botão Editar Perfil*/}
      <TouchableOpacity
        onPress={() => router.replace('/(tabs)/editProfile')}
        className='absolute top-2 right-4 bg-tomar-300 p-3 rounded-full z-10 shadow-md'
        accessibilityRole="button"
        accessibilityLabel="Editar informações do meu perfil"
      >
        <Image 
          className="size-6" 
          source={images.editProfileImg} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
      </TouchableOpacity>

      {/* Avatar */}
      <View className="w-28 h-28 bg-white border-4 border-tomar-200 rounded-full items-center justify-center mb-6 ">
        <Text className="text-primary text-3xl font-bold uppercase">
          {(user.name || user.email || "V").charAt(0)}
        </Text>
      </View>

      {/* Saudação */}
      <Text className="text-2xl text-primary text-center">
        Olá, <Text className="font-bold text-tomar-800">
          {user.name || user.email.split('@')[0]}
        </Text>
      </Text>
      
      {/* Badge de Função/Role */}
      <View className="bg-tomar-200 px-6 py-1.5 rounded-full mt-3">
        <Text className="text-tomar-800 font-bold text-sm uppercase">
          {roleLabels[user.role] || "Utilizador"}
        </Text>
      </View>

      {/* Saldo*/}
      <View 
        className="bg-primary px-10 py-4 rounded-3xl mt-20"
        accessible={true}
        accessibilityLabel={`O seu saldo atual é de ${Number(user.saldo).toFixed(2)} euros`}
      >
        <Text className="text-tomar-100 text-sm font-medium text-center uppercase tracking-widest mb-1">
          Saldo Disponível
        </Text>
        <Text className="text-white font-bold text-3xl text-center">
          {(!isNaN(Number(user.saldo))) ? `${Number(user.saldo).toFixed(2)}€` : "0.00€"}
        </Text>
      </View>

      {/* Botão Logout */}
      <TouchableOpacity 
        onPress={logout} 
        className="bg-red-500 w-full max-w-[280px] py-4 rounded-2xl mt-16 items-center shadow-md active:bg-red-800"
        accessibilityRole="button"
        accessibilityLabel="Terminar sessão e sair da conta"
      >
        <Text className="text-white font-bold text-lg">Terminar Sessão</Text>
      </TouchableOpacity>
    </View>
  );
};
export default profileDetails;