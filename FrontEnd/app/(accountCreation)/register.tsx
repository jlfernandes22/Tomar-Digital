import { Image, Alert, Text, View, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Button, TextInput } from 'react-native-paper'; 
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { images } from '@/constants/images';

const Register = () => {
  const [showRoles, setShowRoles] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('');
  const [city, setCity] = useState('');

  const handleRegister = async () => {
    // 1. Validação local antes de incomodar o servidor!
    if (!email || !password || !role) {
      Alert.alert("Aviso", "Por favor, preencha pelo menos o email, password e cargo.");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Erro", "As palavras-passe não coincidem!");
      return;
    }
    
    try {
      // 2. Enviar dados (normalmente não se envia o confirmPassword para a API)
      const response = await fetch(`${API_URL}/registar`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          role: role,
          city: city
        }),
      });
    
      const dados = await response.json();
    
      if (response.ok) {
        Alert.alert("Sucesso", "Conta criada com sucesso!");
        router.replace('/login');
      } else {
        Alert.alert("Erro", dados.message || "Não foi possível criar a conta.");
      }
    } catch(err) {
      Alert.alert("Erro de Rede", "Verifique a sua ligação à internet.");
    }
  }
  
  return (
    <View className='flex-1'>
      <Image
        source={images.backgroundRegister}
        className="absolute w-full h-full"
        resizeMode="cover"
      />
      <View className="absolute w-full h-full bg-convento-900/60" />
    
      <SafeAreaView className='flex-1 bg-transparent'>
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            bounces={false} 
          >
           
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}> 
              
             
              <View className="flex-1 w-[85%] self-center pt-10 space-y-4">
                
                <Text className='mb-10 text-center text-5xl font-bold text-neutral-300'>
                  Criar conta
                </Text>

                {/* Campo Email */}
                <TextInput 
                  mode="outlined"
                  label="Email" 
                  value={email} 
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                {/* Cidade */}
                <TextInput 
                  mode="outlined"
                  label="Cidade (Ex: Tomar)" 
                  value={city} 
                  onChangeText={setCity}

                />

                {/* Cargo */}
                <View className="mt-2 z-10">
                  <Text className="font-bold mb-2 text-neutral-300">Tipo de Conta</Text>
                  <TouchableOpacity
                    onPress={() => setShowRoles(!showRoles)}
                    className="bg-convento-100 border border-gray-400 rounded-lg px-4 py-4 flex-row justify-between"
                  >
                    <Text className="text-primary text-base">
                      {role === 'cidadao' ? 'Cidadão' : role === 'comerciante' ? 'Comerciante' : role === 'camara' ? 'Câmara' : 'Selecione um cargo...'}
                    </Text>
                    <Text className="text-convento-600 text-xs">
                      {showRoles ? "▲" : "▼"}
                    </Text>
                  </TouchableOpacity>

                  {showRoles && (
                    <View className="border border-gray-300 rounded-lg mt-1 bg-white overflow-hidden shadow-lg absolute top-full left-0 w-full z-20">
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
                          className="px-4 py-4 border-b border-convento-100 active:bg-convento-50"
                        >
                          <Text className="text-primary font-medium ">{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Password */}
                <TextInput 
                  mode="outlined"
                  label="Palavra-passe" 
                  value={password} 
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize='none'
                />

                {/* Confirmar Password */}
                <TextInput 
                  mode="outlined"
                  label="Confirmar Palavra-passe" 
                  value={confirmPassword} 
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize='none'
                />

                {/* Botão de Registo */}
                <View className="mt-8">
                  <Button 
                    mode="contained" 
                    buttonColor="#FF6600" 
                    textColor="#FFFFFF"
                    onPress={handleRegister}
                    className="py-1 shadow-md"
                    labelStyle={{ fontSize: 18, fontWeight: 'bold' }}
                  >
                    Criar Conta
                  </Button>
                </View>
                
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

export default Register;