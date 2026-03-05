import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';

const EditProfile = () => {

    const { user } = useAuth();
    if (!user) return <ActivityIndicator size="large" color="#7c3aed" />;

    //informações possíveis de alterar
    const [email,setEmail] = useState(user.email)
    const [name, setName] = useState(user.name)
    const [city, setCity] = useState(user.city)
    const [NIF, setNIF] = useState(user.NIF)

    const handleEdit = async () => {
        try{

            const response = await fetch(`${API_URL}/iniciarSessao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                name : name,
                city : city,
                NIF : NIF

          }),
        });
        }catch{
            Alert.alert("Erro","Erro ao editar informações")
        }
        
    }

    

  return (
    <View>
      <Text>editProfile</Text>
    </View>
  )
}

export default EditProfile

const styles = StyleSheet.create({})