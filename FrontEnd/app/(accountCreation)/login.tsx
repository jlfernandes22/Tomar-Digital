import {Image,Alert, StyleSheet, Text, View } from 'react-native'
import { Button, TextInput } from 'react-native-paper' 
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { images } from '@/constants/images';

const Login = () => {



  //Guardar os estados das variáveis que queremos obter para fazer o login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const { login } = useAuth();
  
  const handleLogin = async () => {
  try {
    console.log("tentar conectar ao servidor");

    const response = await fetch(`${API_URL}/iniciarSessao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const dados = await response.json();

    if (response.ok) {
      const idEncontrado = dados.userId;
      const roleEncontrado = dados.role || dados.userRole || dados.user?.role;
      const tokenEncontrado = dados.token;
      
      
      const emailEncontrado = dados.user?.email || email; // se a API não devolver, usa o do estado
      const saldoEncontrado = dados.user?.saldo || 0;
      const nomeEncontrado = dados.user?.name || email 
      const cidadeEncontrada = dados.user?.city 
      const NIFEncontrado = dados.user?.NIF

      if (idEncontrado && tokenEncontrado) {
        console.log({idEncontrado, 
          roleEncontrado, 
          tokenEncontrado, 
          emailEncontrado, 
          saldoEncontrado,
          nomeEncontrado,
          cidadeEncontrada,
          NIFEncontrado})
        // Chamada corrigida com os 5 argumentos na ordem certa:
        await login(
          idEncontrado, 
          roleEncontrado, 
          tokenEncontrado, 
          emailEncontrado, 
          saldoEncontrado,
          nomeEncontrado,
          cidadeEncontrada,
          NIFEncontrado
        );

        router.replace('/(tabs)/search');
      }
    } else {
    
      Alert.alert("Erro no Login", dados.message || "Credenciais inválidas");
    }

  } catch (error) {
    console.error(error);
    Alert.alert("Erro de Rede", "Não foi possível contactar o servidor.");
  }
};



  return (
   <View className="flex-1">
    <Image 
      source={images.backgroundLogin}
      className="absolute w-full h-full"
      resizeMode="cover"
    />
    
    <View className="absolute w-full h-full bg-convento-900/60" />
    <SafeAreaView className='flex-1 bg-transparent'>
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        // No iOS usamos padding, no Android usamos height para ele empurrar o ecrã
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 30 }}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            
            <View className="w-[85%] self-center">

              <Text className='mb-10 text-center text-5xl font-bold text-neutral-300'>
                Iniciar Sessão
              </Text>

              {/* Campo Email */}
              <TextInput 
                mode="outlined"
                label="Email" 
                value={email} 
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                activeOutlineColor="#FF6600" 
              />

              {/* Campo Palavra-passe */}
              <TextInput 
                mode="outlined"
                label="Palavra-passe"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize='none'
                activeOutlineColor="#FF6600"
              />

              {/* Botão */}
              <View className="mt-8">
                <Button 
                  mode="contained" 
                  buttonColor="#FF6600" 
                  textColor="#FFFFFF"
                  onPress={handleLogin}
                  className="py-1 shadow-md"
                  labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                >
                  Iniciar Sessão
                </Button>
              </View>

            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  </View>
  )
}

export default Login

const styles = StyleSheet.create({})