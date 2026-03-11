import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { ActivityIndicator, Text, TextInput, Button } from 'react-native-paper';
import React, { useState } from 'react';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

const EditProfile = () => {
    const { user, updateUser } = useAuth();
    
    // O useState não pode correr se o user for undefined, por isso guardamos logo o loading aqui
    if (!user) return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );

    const [name, setName] = useState(user.name || "");
    const [city, setCity] = useState(user.city || "");
    const [NIF, setNIF] = useState(user.NIF ? String(user.NIF) : "");
    const [loading, setLoading] = useState(false); // Para o botão de loading

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
    <SafeAreaView className="flex-1 bg-convento-50">
      <ScrollView>
        
        {/* Cabeçalho */}
        <View className="items-center mt-6 mb-8 px-6">
          <View className="bg-convento-500 w-full py-4 rounded-2xl shadow-sm items-center">
            <Text className="text-white text-2xl font-bold text-center">
              Editar Informações
            </Text>
          </View>
        </View>

        <View className="px-9 space-y-4">
          
          {/* O TextInput do Paper com a label animada embutida */}
          <TextInput 
            mode="outlined"
            label="Nome Completo"
            value={name} 
            onChangeText={setName} 
            className="bg-white"
            activeOutlineColor="#7c3aed" 
          />

          <TextInput 
            mode="outlined"
            label="Cidade"
            value={city} 
            onChangeText={setCity} 
            placeholder="Ex: Tomar"
            className="bg-white mt-2"
            activeOutlineColor="#7c3aed"
          />

          {user.NIF == null && (
            <TextInput 
              mode="outlined"
              label="NIF"
              value={NIF} 
              onChangeText={setNIF} 
              keyboardType="numeric"
              maxLength={9}
              className="bg-white mt-2"
              activeOutlineColor="#7c3aed"
            />
          )}

          <View className="items-center mt-10">
            {/* O Botão Oficial do Material Design com Loading state! */}
            <Button 
              mode="contained" 
              onPress={handleEdit}
              loading={loading}
              disabled={loading}
              buttonColor="#7c3aed" // Cor do botão (brand-600)
              
              labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
            >
              Confirmar Alterações
            </Button>

            <TouchableOpacity 
              onPress={() => router.replace("/(tabs)/profile")}
              className="mt-6 p-2"
              disabled={loading}
            >
              <Text className="text-tomar-600 font-medium">Cancelar</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default EditProfile;