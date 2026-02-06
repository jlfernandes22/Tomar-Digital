import { ActivityIndicator, Alert, StyleSheet, Text, View,  } from 'react-native'
import React, { useCallback, useState } from 'react'
import * as SecureStore from 'expo-secure-store';
import { useFocusEffect } from 'expo-router';

const ProfileDetails = ({name,email,city} :any) => {
  
  const [user,setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const loadProfile = async () => {

    try{
        setLoading(true)
        const jsonValue = await SecureStore.getItemAsync("userInfo")
        if(!jsonValue){
            return Alert.alert("Erro interno", "Erro ao carregar o utilizador a partir do dispositivo")
        }
        setUser(JSON.parse(jsonValue))
        
    }catch(err){
        console.error("Erro ao carregar utilizador", err)
    }finally{
        setLoading(false)
    }

  }

    useFocusEffect(
        useCallback(() =>{

            loadProfile()

        },[]),
    )
  
    return (
        <View>
            {loading?(
                <ActivityIndicator
                    size="large"
                    color="red"
                />):(
        <Text>Olá {user?.name}</Text>
    )}

    </View>
  )
}

export default ProfileDetails

const styles = StyleSheet.create({})