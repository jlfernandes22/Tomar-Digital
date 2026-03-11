import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native'
import React, { useState } from 'react'
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
    <View className="w-full items-center relative p-4  ">
      
    <Text className='text-center text-2xl font-bold'>Perfil</Text>

      {/* Botão Editar Perfil*/} 
      {/* TROCAR PARA ROLDANA */}
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

      {/* Avatar , FAZER PRA TER IMAGEM */}
      <View className="w-36 h-36 bg-white border-4 border-convento-200 rounded-full items-center justify-center mt-3 mb-6 ">
        <Text className="text-primary text-3xl font-bold uppercase">
          {(user.name || user.email || "V").charAt(0)}
        </Text>
      </View>

      {/* NOME */}
     <Text className="font-bold text-xl text-convento-700">
          {user.email.split('@')[0]}
     </Text>
    
      
      {/* Badge de Função/Role */}
      <View className=" p-2 rounded-full">
        <Text className="text-tabuleiros-500 font-bold text-base text-center">
          {roleLabels[user.role] || "Utilizador"}
        </Text>
      </View>

      {/* Saldo*/}
      <View 
        className="bg-convento-100 w-[27rem] h-[20rem] rounded-xl mt-5 border-2 border-convento-400"
        accessible={true}
        accessibilityLabel={`Pontos disponíveis: ${Number(user.saldo).toFixed(2)}`}
      >
        <Text className=" text-convento-500 font-bold mt-4 text-lg  ml-4 uppercase tracking-widest mb-1">
          Pontos Disponíveis
        </Text>
        <Text className="text-convento-700 font-bold text-5xl p-4 ml-4 ">
          {(!isNaN(Number(user.saldo))) ? `${Number(user.saldo).toFixed(2)}` : "0.00"}
        </Text>

        <TouchableOpacity 
        onPress={() => router.replace('/(tabs)/qrcode')}
       
        className="bg-red-500 max-w-[24rem] flex-row h-[5rem] m-auto p-5 rounded-2xl mt-2 items-center shadow-md active:bg-red-800"
        accessibilityRole="button"
        accessibilityLabel="Ler QR-Code de fatura"
      >
        <Image
        className="size-16" 
          source={images.qrCodeImg} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          ></Image>
        <Text className="text-black font-bold text-lg">Ler QR-Code da sua fatura</Text>
      </TouchableOpacity>
      <Text className='text-convento-500 font-light text-center pl-7 pr-7  '>Acumula pontos por cada compra efetuada nas lojas aderentes de Tomar</Text>
      <Text className='text-convento-500 font-semibold text-lg text-center pb-3'>-Necessário Contribuinte-</Text>
      </View>

         
   {/*  e-mail */}
    <View className='bg-convento-100 mt-5 rounded-md border-2 border-convento-400 w-[27rem] h-[5rem] flex-row'>
    <Image className="size-16 bg-convento-200 rounded-lg mt-1 ml-2" 
          source={images.emailImg} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          ></Image>
      <View className='flex-column'>
        <Text className='text-convento-500 font-light ml-2 mt-2'>Endereço de E-mail</Text>
        <Text className='text-convento-800 ml-2 mt-2'>{user.email}</Text>
      </View>
    </View>
      {/* Botão Logout */}
      <TouchableOpacity 
        onPress={logout} 
        className="bg-red-500 w-full max-w-[280px] py-4 rounded-2xl mt-16 items-center shadow-md active:bg-red-800"
        accessibilityRole="button"
        accessibilityLabel="Terminar sessão e sair da conta"
      >
        <Text className="text-black font-bold text-lg">Terminar Sessão</Text>
      </TouchableOpacity>
    
    </View>
  );
};
export default profileDetails;