import { router } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { ActivityIndicator } from 'react-native-paper';

const Index = () => {
  const { currentTheme: theme } = useAppTheme();

  useEffect(() => {
    verifyLogin();
  }, []);

  const verifyLogin = async () => {
    try {
      //verificar se existe token guardado
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        router.replace('/(tabs)/Home');
      } else {
        router.replace('/(accountCreation)/Login');
      }
    } catch {
      console.log('Erro rederecionado para pagina de criação de conta');
      router.replace('/(accountCreation)/Login');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
      }}
    >
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
};

export default Index;
