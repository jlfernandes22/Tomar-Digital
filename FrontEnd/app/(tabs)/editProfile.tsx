import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native'
import React, { useState } from 'react'
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { images } from '@/constants/images';

const EditProfile = () => {

    const { user, updateUser } = useAuth();
    if (!user) return <ActivityIndicator size="large" color="#7c3aed" />;

    //informações possíveis de alterar
    //const [email,setEmail] = useState(user.email)
    const [name, setName] = useState(user.name)
    const [city, setCity] = useState(user.city)
    const [NIF, setNIF] = useState( user.NIF ? String(user.NIF) : "")

    const handleEdit = async () => {
        try{

          console.log(name, city, NIF)

            const response = await fetch(`${API_URL}/editar/${user.id}`, {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${user?.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name : name,
                city : city,
                NIF : NIF ? Number(NIF) : null

          }),
        });

        if(response.ok){
          Alert.alert("Aviso","Alteração de dados com sucesso")
          updateUser({ 
                name: name, 
                city: city, 
                NIF: NIF ? Number(NIF) : null 
            });
          router.replace("/(tabs)/profile")
        }


        }catch{
            Alert.alert("Erro", "Não foi possível guardar as alterações.");
        }
        
    }

    

  return (
    <SafeAreaView>
      <View className='absolute top-14 right-5'>
        
        {/* Cabeçalho Estilizado */}
        <View className="items-center mt-6 mb-8 px-6">
          <View className=" w-full py-4 rounded-2xl">
            <Text className="text-black text-2xl font-bold text-center">
              Editar Informações do Perfil
            </Text>
          </View>
        </View>

        <View className="px-4 bg-convento-200 border-2 rounded-xl w-[29rem] border-convento-500 items-center">
          
        <View className='flex-row '>
            
            <View className="w-36 h-36 bg-white border-2 border-convento-700 rounded-full items-center justify-center mt-3 mb-6 left-6 ">
                    <Text className="text-primary text-3xl font-bold uppercase">
                      {(user.name || user.email || "V").charAt(0)}
                    </Text>
            </View>
            <Image
              className="size-10 top-28 bg-convento-300 p-2 rounded-full right-4 border-2 border-convento-400"  
               source={images.editProfileImg} 
               accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants">
            </Image>
            
      </View>
      <Text className='text-convento-700 mb-6 bottom-5 text-center'>Mudar a Foto de Perfil</Text>
          {/* Campo Nome */}
          <View>
            <Text className="text-convento-700 font-bold mb-3 text-center">Nome Completo</Text>
            <TextInput 
              value={name} 
              onChangeText={(texto) => setName(texto)} 
              placeholder="O seu nome"
              placeholderTextColor="#946648"
              className="bg-white rounded-xl border-2 border-convento-700 p-4 text-convento-600 text-lg w-[25rem]"
              accessibilityLabel="Campo de edição de nome"
            />
          </View>

          {/* Campo Cidade */}
          <View>
            <Text className="text-convento-700 font-bold mb-3 mt-4 text-center">Cidade</Text>
            <TextInput 
              value={city} 
              onChangeText={(texto) => setCity(texto)} 
              placeholder="Ex: Tomar"
              placeholderTextColor="#946648"
              className="bg-white rounded-xl border-2 border-convento-700 p-4 text-convento-600 text-lg w-[25rem]"
              accessibilityLabel="Campo de edição de cidade"
            />
          </View>

          {/* Campo NIF */}
          {user.NIF == null && (
            <View>
              <Text className="text-convento-700 font-bold mb-3 mt-4 text-center">NIF</Text>
              <TextInput 
                value={NIF} 
                onChangeText={(texto) => setNIF(texto)} 
                placeholder="NIF (9 dígitos)"
                placeholderTextColor="#946648"
                keyboardType="numeric"
                maxLength={9}
                className="bg-white rounded-xl border-2 border-convento-700 p-4 text-convento-800 text-lg w-[25rem]"
                accessibilityLabel="Campo de edição de NIF"
              />
            </View>
          )}

          {/* Botão de Confirmação */}
          <View className="items-center mt-10">
            <TouchableOpacity
              onPress={handleEdit}
              activeOpacity={0.8}
              className="bg-tabuleiros-600 rounded-2xl items-center p-4 w-full shadow-md active:bg-tabuleiros-800"
              accessibilityRole="button"
              accessibilityLabel="Confirmar e guardar alterações do perfil"
            >
              <Text className="text-white font-bold text-xl">Confirmar Alterações</Text>
            </TouchableOpacity>

            {/* Link para Cancelar */}
            <TouchableOpacity 
              onPress={() => router.replace("/(tabs)/profile")}
              className="mt-4 p-2"
            >
              <Text className="text-white font-medium bg-convento-500 p-4 rounded-2xl">Cancelar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </SafeAreaView>
  );
}

export default EditProfile

const styles = StyleSheet.create({})