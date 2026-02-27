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
  
  const [showRoles, setShowRoles] = useState(false);

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
    <SafeAreaView className='flex-1 bg-tomar-50'>
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
              <Text className='mb-10 mt-9 text-center text-5xl font-bold text-primary'>
                Criar conta
              </Text>
            </View>

            {/*Email */}
            <View>
              <Text className='mt-4 font-bold text-primary text-center'>Email</Text>
              <TextInput 
                value={email}
                onChangeText={(text) => setEmail(text)}
                className='bg-tomar-100 p-4 rounded-xl border-2 border-tomar-300 text-primary min-w-[85%]' 
              />
            </View>

            {/* Cidade */}
            <View className='w-full items-center'>
              <Text className='mt-4 font-bold text-primary'>Cidade</Text>
              <TextInput 
                value={city} // Certifique-se de criar o state [city, setCity]
                onChangeText={(text) => setCity(text)}
                placeholder="Ex: Lisboa"
                className='bg-tomar-100 p-4 rounded-xl border-2 border-tomar-300 text-primary min-w-[85%]' 
              />
            </View>

            {/*  Role */}
            <View className="min-w-[85%] mt-4">
                <Text className="font-bold mb-1 text-primary text-center">Cargo</Text>

                {/* botão dropdown */}
                <TouchableOpacity
                  onPress={() => setShowRoles(!showRoles)}
                  className="bg-tomar-100 border-2 border-tomar-300 rounded-xl px-4 py-4"
                >
                  <Text className="text-primary text-base">
                    {role
                      ? role === 'cidadao'
                        ? 'Cidadão'
                        : role === 'comerciante'
                        ? 'Comerciante'
                        : 'Câmara'
                      : 'Selecione um cargo...'}
                  </Text>
                </TouchableOpacity>

              {/* lista */}
              {showRoles && (
                <View className="border-2 border-tomar-300 rounded-xl mt-1 bg-white overflow-hidden shadow-lg">
                  {[
                    { label: 'Cidadão', value: 'cidadao' },
                    { label: 'Comerciante', value: 'comerciante' },
                    { label: 'Câmara', value: 'camara' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      onPress={() => {
                        setRole(item.value);
                        setShowRoles(false);
                      }}
                      className="px-4 py-4 border-b border-tomar-100 active:bg-tomar-50"
                    >
                      <Text className="text-primary font-medium">{item.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
  )}
</View>


            {/*  Password */}
            <View className="w-full items-center">
              <Text className='mt-4 font-bold text-primary'>Palavra-passe</Text>
              <TextInput
                secureTextEntry
                value={password} 
                onChangeText={(text) => setPassword(text)}
                className='bg-tomar-100 p-4 rounded-xl border-2 border-tomar-300 text-primary min-w-[85%]'
              />
            </View>

            {/*  Confirmar Password */}
            <View className="w-full items-center">
              <Text className='mt-4 font-bold text-primary'>Confirmar Palavra-passe</Text>
              <TextInput 
                secureTextEntry
                value={confirmPassword}
                onChangeText={(text) => setConfirmPassword(text)}
                className='bg-tomar-100 p-4 rounded-xl border-2 border-tomar-300 text-primary min-w-[85%]'
              />
            </View>

            <TouchableOpacity 
              onPress={handleRegister}
              className='bg-accent h-14 rounded-full min-w-[75%] justify-center items-center mt-12 mb-10'
            >
              <Text className='font-bold text-xl text-white'>Criar Conta</Text>
            </TouchableOpacity>
            
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

export default Register

const styles = StyleSheet.create({})