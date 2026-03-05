import {Image,Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { saveToken } from '@/services/tokenService';
import * as SecureStore from 'expo-secure-store';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';
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
    
    
    <View className="absolute w-full h-full bg-tomar-900/60" />
    <SafeAreaView className='flex-1 bg-transparent'>
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}/* 2. Ajusta a altura quando o teclado sobe */
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} /*3. Fecha teclado ao tocar fora */ >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
           
      <View>
        <Text className='
                            mb-12
                            mt-9
                            text-center
                            text-5xl
                            font-bold
                            text-neutral-300
                            '

        >Iniciar Sessão</Text>
      </View>

      <View className=' '>
        <Text className='
                          mt-4
                          font-bold
                          text-center
                           text-neutral-300
'
                          
                          >Email</Text>

        <TextInput 
                    value={email} 
                    onChangeText={(text)=>setEmail(text)}
                    className='
                    p-4 
                    bg-tomar-100 
                    focus:border-accent 
                    rounded-xl 
                    border-2
                    border-tomar-300
                    text-primary
                    min-w-[85%]' 
                    
                    ></TextInput>
      </View>

      <View className='font-semibold '>

        <Text className='
                          mt-4
                          font-bold
                          text-center
                        text-neutral-300
        '>Palavra-passe</Text>

    
        <TextInput 
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
        className='p-4
                    bg-tomar-100 
                    focus:border-accent 
                    rounded-xl 
                    border-2
                    border-tomar-300
                    text-primary
                    min-w-[85%]' 
                    
                    ></TextInput>


                    <TouchableOpacity

                      onPress={handleLogin}
                      className='bg-accent h-14 rounded-full min-w-[75%] justify-center items-center mt-8'
                    
                    >

                      <Text className='font-bold text-xl text-white'>Login</Text>

                    </TouchableOpacity>

      </View>
      
    </ScrollView>
    </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  </SafeAreaView>
  </View>
  )
}

export default Login

const styles = StyleSheet.create({})