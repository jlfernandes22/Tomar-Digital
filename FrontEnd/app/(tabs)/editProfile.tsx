import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

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
          router.back()
        }


        }catch{
            Alert.alert("Erro", "Não foi possível guardar as alterações.");
        }
        
    }

    

  return (
    <SafeAreaView >
      
      <View className='items-center'>
        <Text className='text-2xl bg-primary rounded-lg p-4'>Editar Informações Pessoais</Text>
      </View>

      <View className='ml-9 mr-9'>

        <View>
          <Text>Nome</Text>
          <TextInput 
            value={name} 
            onChangeText={(texto) => setName(texto)} 
            className='rounded-lg border-2'
          />
        </View>

        <View>
          <Text>Cidade</Text>
          <TextInput 
            value={city} 
            onChangeText={(texto) => setCity(texto)} 
            className='rounded-lg border-2'
          />
        </View>


        {user.NIF == null && (

          <View>
          <Text>NIF</Text>
          <TextInput 
            value={NIF} 
            onChangeText={(texto) => setNIF(texto)} 
            className='rounded-lg border-2'
          />
          </View>
        )}


        {
          
            
          
        }

        

        <View className='items-center'>
          <TouchableOpacity
          onPress={handleEdit}
          className='bg-accent
                      rounded-lg
                      items-center
                      mt-8
                      p-2
                      min-w-[10rem]'>
          <Text>Confirmar</Text>
        </TouchableOpacity>
        </View>

      </View>
      
    </SafeAreaView>
  )
}

export default EditProfile

const styles = StyleSheet.create({})