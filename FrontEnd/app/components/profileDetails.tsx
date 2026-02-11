import { ActivityIndicator, Alert, StyleSheet, Text, View,  } from 'react-native'
import React, { useCallback, useState } from 'react'
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';

const ProfileDetails = ({name,email,city} :any) => {
  
  const [user,setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)

    const loadProfile = async () => {
  try {
    setLoading(true);
    const jsonValue = await SecureStore.getItemAsync("userInfo");
    console.log("DEBUG - Dados no Store:", jsonValue);

    if (jsonValue) {
      const userData = JSON.parse(jsonValue);
      
      // Criamos o nome a partir do email caso o campo 'name' não exista
      const email = userData.email || "";
      const nomeExtraido = email.split('@')[0]; 

      // Atualizamos o estado com o nome processado
      setUser({
        ...userData,
        name: nomeExtraido
      });
    }
  } catch (err) {
    console.error("Erro ao carregar utilizador", err);
  } finally {
    setLoading(false);
  }
};

    useFocusEffect(
        useCallback(() =>{

            loadProfile()

        },[]),
    )
  
    return (
        <View>
  {loading ? (
    <ActivityIndicator size="large" color="red" />
  ) : (
    // Forçamos a exibição do nome que acabámos de processar
    <Text style={{ fontSize: 20 }}>
      Olá {user?.name ? user.name : "Visitante"}
    </Text>
  )}
</View>
  )
}

export default ProfileDetails

const styles = StyleSheet.create({})