import { ActivityIndicator, Alert, StyleSheet, TouchableOpacity, View, Image, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import TabIcon from './Tabicon';
import { images } from "@/constants/images";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, TouchableRipple, useTheme } from 'react-native-paper';

const profileDetails = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const roleLabels: Record<string, string> = {
    cidadao: "Cidadão",
    comerciante: "Comerciante",
    camara: "Câmara Municipal",
  };


  
  // Se o user ainda não carregou
  if (!user) return <ActivityIndicator size="large" color="#7c3aed" />;

return (
  <Surface style={{flex:1}}>
    <SafeAreaView style={{flex:1}} className="items-center">
  
    <View className='items-center bottom-10'>
      {/* Botão Editar Perfil*/} 
      <TouchableRipple
        onPress={() => router.replace('/(tabs)/editProfile')}
        className='absolute top-2 right-4 bg-tomar-300 p-3 rounded-full z-10 shadow-md bg-convento-300 border-2 border-convento-500 '
        accessibilityRole="button"
        accessibilityLabel="Editar informações do meu perfil"
      >
        <Image 
          className="size-6" 
          source={images.editProfileImg} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        />
      </TouchableRipple>

      {/* Avatar , FAZER PRA TER IMAGEM */}
      <View className="w-32 h-32  bg-white border-2 border-convento-200 rounded-full items-center justify-center mb-3 ">
        <Text className="text-primary text-3xl  font-bold uppercase">
          {(user.name || user.email || "V").charAt(0)}
        </Text>
      </View>

      {/* NOME */}
     <Text style={{color:'#946648', fontWeight:'bold'}} className="text-xl">
          {user.email.split('@')[0]}
     </Text>
    
      
      {/* Role */}
      <View className=" p-2 rounded-full">
        <Text style={{color:'#FF3333'}} className=" text-base text-center">
          {roleLabels[user.role] || "Utilizador"}
        </Text>
      </View>

      {/* Saldo*/}
      <View 
        className="bg-convento-100 w-full h-[20rem] rounded-xl mt-5 border-2 border-convento-400"
        accessible={true}
        accessibilityLabel={`Pontos disponíveis: ${Number(user.saldo).toFixed(2)}`}
        >
        <Text style={{color: '#724E37', fontWeight:'bold'}}className="mt-4 text-lg  ml-4 uppercase tracking-widest mb-1">
          Pontos Disponíveis
        </Text>
        <Text style={{color: '#724E37', fontWeight:'bold'}} className=" text-5xl p-4 ml-4 ">
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
        <Text style={{fontWeight:'bold'}} className="text-black text-lg">Ler QR-Code da sua fatura</Text>
        </TouchableOpacity>
        <View className='flex-1 items-center'>
          <Text style={{color:'#C29A80', fontWeight:'light'}} className=' pl-7 pr-7 pt-3  '>Acumula pontos por cada compra efetuada nas lojas aderentes de Tomar</Text>
          <Text style={{color:'#B17E5E', fontWeight:'bold'}} className=' text-lg pb-3'>-Necessário Contribuinte-</Text>
        </View>
      </View>

         
   {/*  e-mail */}
    <View className='bg-convento-100 mt-5 rounded-md border-2 border-convento-400 min-w-[100%] h-[5rem] flex-row'>
    <Image className="size-16 bg-convento-200 rounded-lg mt-1 ml-2" 
          source={images.emailImg} 
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
          ></Image>
      <View className='flex-column'>
        <Text style={{color:'#C29A80', fontWeight:'light'}} className=' ml-2 mt-2'>Endereço de E-mail</Text>
        <Text style={{color: '#724E37'}} className=' ml-2 mt-2'>{user.email}</Text>
      </View>
    </View>


      {/* Botão Logout */}
      <TouchableRipple 
        onPress={logout} 
        className="bg-red-500 w-full min-w-[50%] py-4 rounded-2xl mt-14 items-center shadow-md active:bg-red-800"
        accessibilityRole="button"
        accessibilityLabel="Terminar sessão e sair da conta"
      >
        <Text style={{fontWeight:'bold'}} className="text-black text-lg">Terminar Sessão</Text>
      </TouchableRipple>
    </View>  
    </SafeAreaView>
    </Surface>
  );
};
export default profileDetails;