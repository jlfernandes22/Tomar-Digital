import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { saveToken } from '@/services/tokenService';
import * as SecureStore from 'expo-secure-store';

const Login = () => {



  //Guardar os estados das variáveis que queremos obter para fazer o login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {

    //Alert.alert("Dados",`Email: ${email}\nPassword: ${password}` )

    //Ligar ao Backend para fazer o login

    try{
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

      console.log(dados)

      if(response.ok){

        console.log("a salvar token...")
        await saveToken(dados.token)
        try{
          await SecureStore.setItemAsync("userInfo",JSON.stringify(dados.user))
          console.log("Informação do utilizador guardada no dispositivo")
        }catch(err){
          console.error("Erro ao guardar o utilizador no dispositivo",err)
        }
        

        router.replace('/(tabs)/home');

      }else{
        Alert.alert("Acesso Negado", dados.message || "Erro desconhecido");
      }


    }catch(err){
      Alert.alert("Erro ao Iniciar Sessão")
    }

  }



  return (
    <SafeAreaView className='flex-1 justify-center items-center'>
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
      
    </SafeAreaView>
  )
}

export default Login

const styles = StyleSheet.create({})