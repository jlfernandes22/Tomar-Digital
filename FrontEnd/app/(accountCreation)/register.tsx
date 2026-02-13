import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  TouchableWithoutFeedback, 
  Keyboard 
} from 'react-native';


const Register = () => {
  
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');

  const handleRegister = async () => {

     //Alert.alert("Dados",`Email: ${email}\nPassword: ${password}` )
    
        //Ligar ao Backend para fazer o login
    
        try{
          
          //enviar dados à api
          const response = await fetch(`${API_URL}/registar`,{ 
            method : 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              email:email,
              password:password,
              confirmPassword: confirmPassword,
              role: role,
              city: city
            }),
          
          });
    
          const dados = await response.json();
    
          console.log(dados)
    
          if(response.ok){
    
            router.replace('/login');
    
          }else{
            Alert.alert("Acesso Negado", dados.message || "Erro desconhecido");
          }
    
    
        }catch(err){
          Alert.alert("Erro ao Iniciar Sessão")
        }

  }
  
  
  return (
    <SafeAreaView className='flex-1'>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            keyboardShouldPersistTaps="handled"
            bounces={false} 
            overScrollMode="never" 
          >
            <View>
              <Text className='ml-auto mr-auto mb-[20%] mt-9 min-w-full justify-center text-center text-5xl font-bold'>
                Criar conta
              </Text>
            </View>

            {/*Email */}
            <View>
              <Text className='mr-auto ml-auto mt-4 font-semibold'>Email</Text>
              <TextInput 
                value={email}
                onChangeText={(text) => setEmail(text)}
                className='bg-primary focus:bg-accent rounded-full border ml-auto mr-auto min-w-[75%]' 
              />
            </View>

            {/* Cidade */}
            <View>
              <Text className='mr-auto ml-auto mt-4 font-semibold'>Cidade</Text>
              <TextInput 
                value={city} // Certifique-se de criar o state [city, setCity]
                onChangeText={(text) => setCity(text)}
                placeholder="Ex: Lisboa"
                className='bg-primary focus:bg-accent rounded-full border ml-auto mr-auto min-w-[75%]' 
              />
            </View>

            {/*  Role */}
            <View className='min-w-[75%] ml-auto mr-auto'>
              <Text className='mr-auto ml-auto mt-4 font-semibold'>Cargo</Text>
              <View className="bg-primary border rounded-full mt-1 overflow-hidden">
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  dropdownIconColor="#000" // Cor da setinha no Android
                >
                  <Picker.Item label="Selecione um cargo..." value="" />
                  <Picker.Item label="Cidadão" value="cidadao" />
                  <Picker.Item label="Comerciante" value="comerciante" />
                  <Picker.Item label="Câmara" value="camara" />
                </Picker>
              </View>
            </View>

            {/*  Password */}
            <View>
              <Text className='ml-auto mr-auto mt-4 font-semibold'>Palavra-passe</Text>
              <TextInput
                secureTextEntry
                value={password} 
                onChangeText={(text) => setPassword(text)}
                className='bg-primary focus:bg-accent rounded-full border ml-auto mr-auto min-w-[75%]'
              />
            </View>

            {/*  Confirmar Password */}
            <View>
              <Text className='ml-auto mr-auto mt-4 font-semibold'>Confirmar Palavra-passe</Text>
              <TextInput 
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => setConfirmPassword(text)}
                className='bg-primary focus:bg-accent rounded-full border ml-auto mr-auto min-w-[75%]'
              />
            </View>

            <TouchableOpacity 
              onPress={handleRegister}
              className='bg-accent mx-4 h-12 rounded-full w-[50%] justify-center items-center mt-10 ml-auto mr-auto'
            >
              <Text className='font-bold text-lg'>Criar Conta</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Register

const styles = StyleSheet.create({})