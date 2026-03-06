import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
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
    <SafeAreaView className="flex-1 bg-tomar-50">
      <ScrollView>
        
        {/* Cabeçalho Estilizado */}
        <View className="items-center mt-6 mb-8 px-6">
          <View className="bg-primary w-full py-4 rounded-2xl shadow-sm">
            <Text className="text-white text-2xl font-bold text-center">
              Editar Informações
            </Text>
          </View>
        </View>

        <View className="px-9 space-y-6">
          
          {/* Campo Nome */}
          <View>
            <Text className="text-primary font-bold mb-3 text-center">Nome Completo</Text>
            <TextInput 
              value={name} 
              onChangeText={(texto) => setName(texto)} 
              placeholder="O seu nome"
              placeholderTextColor="#946648"
              className="bg-white rounded-xl border-2 border-tomar-200 p-4 text-primary text-lg"
              accessibilityLabel="Campo de edição de nome"
            />
          </View>

          {/* Campo Cidade */}
          <View>
            <Text className="text-primary font-bold mb-3 mt-4 text-center">Cidade</Text>
            <TextInput 
              value={city} 
              onChangeText={(texto) => setCity(texto)} 
              placeholder="Ex: Tomar"
              placeholderTextColor="#946648"
              className="bg-white rounded-xl border-2 border-tomar-200 p-4 text-primary text-lg"
              accessibilityLabel="Campo de edição de cidade"
            />
          </View>

          {/* Campo NIF (Condicional) */}
          {user.NIF == null && (
            <View>
              <Text className="text-primary font-bold mb-3 mt-4 text-center">NIF</Text>
              <TextInput 
                value={NIF} 
                onChangeText={(texto) => setNIF(texto)} 
                placeholder="NIF (9 dígitos)"
                placeholderTextColor="#946648"
                keyboardType="numeric"
                maxLength={9}
                className="bg-white rounded-xl border-2 border-tomar-200 p-4 text-primary text-lg"
                accessibilityLabel="Campo de edição de NIF"
              />
            </View>
          )}

          {/* Botão de Confirmação */}
          <View className="items-center mt-10">
            <TouchableOpacity
              onPress={handleEdit}
              activeOpacity={0.8}
              className="bg-brand-600 rounded-2xl items-center p-4 w-full shadow-md active:bg-tomar-800"
              accessibilityRole="button"
              accessibilityLabel="Confirmar e guardar alterações do perfil"
            >
              <Text className="text-white font-bold text-xl">Confirmar Alterações</Text>
            </TouchableOpacity>

            {/* Link para Cancelar (Opcional, mas boa prática UX) */}
            <TouchableOpacity 
              onPress={() => router.back()}
              className="mt-4 p-2"
            >
              <Text className="text-tomar-600 font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default EditProfile

const styles = StyleSheet.create({})