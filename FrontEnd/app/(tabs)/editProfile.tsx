import { ActivityIndicator, Alert, View, Image, ScrollView } from 'react-native'
import React, { useState } from 'react'
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { images } from '@/constants/images';
import { Surface, Text } from 'react-native-paper';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';


const EditProfile = () => {
    const { user, updateUser } = useAuth();
    
    if (!user) return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );

    const [name, setName] = useState(user.name || "");
    const [city, setCity] = useState(user.city || "");
    const [NIF, setNIF] = useState(user.NIF ? String(user.NIF) : "");
    const [loading, setLoading] = useState(false); 

    const handleEdit = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/editar/${user.id}`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: name,
                  city: city,
                  NIF: NIF ? Number(NIF) : null
            }),
          });

          if(response.ok){
            Alert.alert("Sucesso", "Alteração de dados com sucesso");
            updateUser({ 
                  name: name, 
                  city: city, 
                  NIF: NIF ? Number(NIF) : null 
              });
            router.replace("/(tabs)/profile");
          } else {
            Alert.alert("Erro", "O servidor rejeitou as alterações.");
          }
        } catch(error) {
            Alert.alert("Erro", "Falha na ligação ao servidor.");
        } finally {
            setLoading(false);
        }
    }

  return (
    // 1. Flex-1 na Surface e SafeAreaView para ocuparem o ecrã todo
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        
        {/* ScrollView adicionada para ecrãs pequenos e para quando o teclado abre */}
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >

          {/* Cabeçalho */}
          <View className="items-center mt-6 mb-8 px-6">
            <Text variant='headlineSmall' >
              Editar Informações do Perfil
            </Text>
          </View>

          {/* Contentor Principal do Formulário*/}
          <View className="bg-convento-600 border-2 rounded-xl border-convento-500 items-center mx-4 py-8 px-6">

            {/* Zona da Imagem */}
            <View className='relative mb-2'>
                <View className="w-32 h-32 bg-white border-2 border-convento-700 rounded-full items-center justify-center">
                    <Text className="text-primary text-4xl font-bold uppercase">
                      {(user.name || user.email || "V").charAt(0)}
                    </Text>
                </View>
               
                <Image
                  className="absolute size-8 bottom-0 right-2 bg-convento-300 rounded-full border-2 border-convento-400"  
                  source={images.editProfileImg} 
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />   
            </View>
            <Text className='text-convento-700 text-center mb-8 font-medium'>Mudar a Foto de Perfil</Text>


           
            <View className="w-full">
              <CustomTextInput 
                value={name} 
                onChangeText={setName} 
                label="Nome"
                className='w-full mb-4'
              />

              <CustomTextInput 
                label='Cidade'
                value={city} 
                onChangeText={setCity} 
                className="w-full mb-4"
              />

              {user.NIF == null && (
                <CustomTextInput 
                  label='NIF'
                  value={NIF} 
                  onChangeText={setNIF}
                  isNIF
                  className="w-full mb-4"
                />
              )}
            </View>


            
            <View className="w-full mt-6">
              <CustomButton 
                buttonColor='#EF4444' 
                onPress={handleEdit}
                loading={loading}
                className="w-full mb-3"
              >
                Confirmar Alterações
              </CustomButton>

              <CustomButton 
                buttonColor="#6B7280" 
                onPress={() => router.replace("/(tabs)/profile")}
                className="w-full"
                disabled={loading} 
              >
                Cancelar
              </CustomButton>
            </View>

          </View>
        </ScrollView>

      </SafeAreaView>
    </Surface>
  );
}

export default EditProfile;