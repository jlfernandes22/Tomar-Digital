import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
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
      
      // 🚨 IMPORTANTE: Extrair o email e o saldo que vêm da API
      const emailEncontrado = dados.user?.email || email; // se a API não devolver, usa o do estado
      const saldoEncontrado = dados.user?.saldo || 0;

      if (idEncontrado && tokenEncontrado) {
        // Chamada corrigida com os 5 argumentos na ordem certa:
        await login(
          idEncontrado, 
          roleEncontrado, 
          tokenEncontrado, 
          emailEncontrado, 
          saldoEncontrado
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
    <SafeAreaView className='flex-1 bg-tomar-50'>
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
                            text-primary
                            '

        >Iniciar Sessão</Text>
      </View>

      <View className=' '>
        <Text className='
                          mt-4
                          font-bold
                          text-center
                          text-primary'
                          
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

                          text-primary'
                        
                        >Palavra-passe</Text>

        
        
        
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
  )
}

export default Login

const styles = StyleSheet.create({})