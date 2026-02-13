import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useCallback, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import Map from './map'
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router'
import { API_URL } from '@/constants/api'
import { Ionicons } from '@expo/vector-icons'; // Ícones nativos do Expo

const DetalhesBusiness = () => {

  const businessId = useLocalSearchParams()
  const [business, setBusiness] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter();

  const handleBusiness = async () => {
    setLoading(true);
    try {
      //console.log(businessId.id)
      const response = await fetch(`${API_URL}/negocios/${businessId.id}`);
      const dados = await response.json();
  
      console.log(dados)
      setBusiness(dados)
  
    } catch (error) {
      console.log("Não foi possível obter a lista de negócios", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() =>{
      handleBusiness()
            },[])
        )


  if(business){
    return (
    // 1. O flex-1 na SafeAreaView é essencial para ocupar o ecrã todo
    <SafeAreaView className='flex-1 bg-white'>
      <Stack.Screen options={{ headerShown: false }} />

      {/* --- CABEÇALHO (Botão Voltar) --- */}
      <View className='flex-row items-center px-4 py-3 border-b border-gray-100'>
        <TouchableOpacity
          className='flex-row items-center bg-gray-50 px-4 py-2 rounded-full border border-gray-200'
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="#374151" />
          <Text className='ml-1 text-gray-700 font-medium'>Voltar</Text>
        </TouchableOpacity>
      </View>

      {/* --- CORPO DA PÁGINA --- */}
      {/* Usar ScrollView é mais seguro caso o ecrã seja pequeno */}
      <ScrollView className='flex-1 px-5 pt-6' contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Título e Categoria */}
        <View className='mb-6'>
          <Text className='text-3xl font-extrabold text-gray-900 mb-1'>
            {business.name}
          </Text>
          
          <View className='flex-row items-center mt-1'>
            <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
            <Text className='text-base text-gray-500 font-medium ml-2'>
              {business.category}
            </Text>
          </View>
        </View>

        {/* Secção do Mapa */}
        <View className='mt-2'>
          <Text className='text-lg font-bold text-gray-800 mb-3'>Localização</Text>
          
          {/* Caixa com sombra e cantos arredondados para conter o mapa */}
          <View className='rounded-3xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm'>
            <Map location={business.location} />
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
  }else{
    return(
      
      <SafeAreaView>
        <Stack.Screen options={{ headerShown: false }} />
        <Text>Não veio negócio</Text>
      </SafeAreaView>

    )
  }
}

export default DetalhesBusiness

const styles = StyleSheet.create({})