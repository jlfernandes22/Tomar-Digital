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
        role: role
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
    <SafeAreaView className='flex-1'>
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
                            ml-auto
                            mr-auto
                            mb-[50%]
                            mt-9
                            min-w-full
                            justify-center
                            text-center
                            text-5xl
                            font-bold
                            '

        >Iniciar Sessão</Text>
      </View>

      <View className=' '>
        <Text className='
                          ml-auto
                          mr-auto
                          mt-4
                          font-semibold'
                          
                          >Email</Text>

        <TextInput 
                    value={email} 
                    onChangeText={(text)=>setEmail(text)}
                    className='
                    bg-primary 
                    focus:bg-accent 
                      rounded-full 
                      border 
                      ml-auto
                      mr-auto
                      min-w-[75%]' 
                    
                    ></TextInput>
      </View>

      <View className='font-semibold '>

        <Text className='
                          ml-auto
                          mr-auto
                          mt-4
                          font-semibold'
                        
                        >Palavra-passe</Text>

        
        
        
        <TextInput 
        secureTextEntry
        value={password}
        onChangeText={(text) => setPassword(text)}
        className='
                    bg-primary 
                    focus:bg-accent 
                      rounded-full 
                      border 
                      ml-auto
                      mr-auto
                      min-w-[75%]' 
                    
                    ></TextInput>


                    <TouchableOpacity

                      onPress={handleLogin}
                      className='bg-accent mx-4 h-12 rounded-full min-w-[50%] justify-center items-center mt-5 ml-auto mr-auto'
                    
                    >

                      <Text className='font-bold text-lg'>Login</Text>

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