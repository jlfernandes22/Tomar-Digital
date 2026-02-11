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
const { login } = useAuth();

  const handleLogin = async () => {

    //Alert.alert("Dados",`Email: ${email}\nPassword: ${password}` )

    //Ligar ao Backend para fazer o login

      console.log("tentar conectar ao servidor")
      console.log(API_URL)
      //enviar dados à api
      const response = await fetch(`${API_URL}/iniciarSessao`,{ 
        method : 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email:email,
          password:password
        }),
      });

      const dados = await response.json();

      console.log("dadoskugdegq")
      console.log(dados)

     if (response.ok) {
       
        const idEncontrado = dados.userId;
        const nomeReal = dados.user?.name; // O backend envia isto!
        // 2. Procura o ID em vários formatos (userId, _id, id)
        // Tentamos na raiz do objeto E dentro de um sub-objeto 'user' ou 'dados'
       
        if (idEncontrado) {
    // 1. Criamos o objeto que queremos guardar
// 1. Guardamos TUDO o que queremos mostrar no perfil depois
    const userInfo = JSON.stringify({ 
      id: idEncontrado, 
      email: dados.user?.email, 
      name: nomeReal });    
    // 2. Guardamos no SecureStore de forma encriptada
await SecureStore.setItemAsync("userInfo", userInfo);    
    // 3. Atualizamos o contexto para a App reagir
    await login(idEncontrado); 
    
    router.replace('/(tabs)/search');
  }
      }
    }



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