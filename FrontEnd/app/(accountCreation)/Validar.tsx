import React, { useCallback, useState } from 'react';
import { View, Text, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router'; 
import { API_URL } from '@/constants/api';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';

const Validar = () => {
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [code, setCode] = useState('');
  const [tentativas, setTentativas] = useState(0);

  const handleVerify = async () => {
    try {
      const response = await fetch(`${API_URL}/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: code })
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert("Sucesso!", "Conta validada!");
        router.replace("/Login");
      } else {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        if (novasTentativas >= 3) {
          Alert.alert("Bloqueado", "Excedeu o número de tentativas.");
          router.replace("/Register"); 
        } else {
          Alert.alert("Erro", `Código inválido. Tentativa ${novasTentativas}/3`);
        }
      }
    } catch (error) {
      Alert.alert("Erro", "Erro ao conectar ao servidor");
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Bloqueia o botão físico de voltar do Android
      const onBackPress = () => true; 

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [])
  );

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>      
      
      <Stack.Screen 
  options={{ 
    headerBackVisible: false, 
    gestureEnabled: false,
    title: "Validação"
  }} 
/>
      <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
        Validação
      </Text>

      <CustomTextInput
        placeholder="Digite o código de 6 dígitos"
        onChangeText={setCode}
        keyboardType="numeric"
        label="Código"
        value={code}
      />

      <CustomButton onPress={handleVerify}>
        Confirmar
      </CustomButton>
    </View>
  );
};

export default Validar;