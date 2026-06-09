import React, { useCallback, useState } from 'react';
import { View, Text, Alert, BackHandler } from 'react-native';
import { useLocalSearchParams, router, Stack, useFocusEffect } from 'expo-router'; 
import { API_URL } from '@/constants/api';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { useTranslation } from 'react-i18next';

const Validar = () => {
  const { t } = useTranslation();
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

      if (response.status === 429) {
        Alert.alert(t('common.error'), t('common.error_429'));
        return;
      }

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(t('common.success') + "!", t('validar.success'));
        router.replace("/Login");
      } else {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        if (novasTentativas >= 3) {
          Alert.alert(t('validar.blocked'), t('validar.exceeded_attempts'));
          router.replace("/Register"); 
        } else {
          Alert.alert(t('common.error'), t('validar.invalid_code_attempt', { attempt: novasTentativas }));
        }
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('validar.error_connection'));
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
    title: t('validar.title')
  }} 
/>
      <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
        {t('validar.title')}
      </Text>

      <CustomTextInput
        placeholder={t('validar.placeholder')}
        onChangeText={setCode}
        keyboardType="numeric"
        label={t('validar.code')}
        value={code}
      />

      <CustomButton onPress={handleVerify}>
        {t('common.confirm')}
      </CustomButton>
    </View>
  );
};

export default Validar;