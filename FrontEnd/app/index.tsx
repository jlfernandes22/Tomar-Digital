import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Index Screen (App Entry Point)
 *
 * Acts as an initial routing gate. It checks if a user token exists in
 * persistent storage and redirects to the appropriate screen (Home or Login).
 * While performing this asynchronous check, it displays a simple themed loading indicator.
 */
const Index = () => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();

  // --- Handlers ---

  /**
   * Checks AsyncStorage for an existing user token.
   * Redirects to the main app if found, otherwise sends the user to the login flow.
   */
  const verifyLogin = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');

      if (token) {
        // Use replace to overwrite the current route in the history.
        // This prevents the user from hitting the back button and returning to this loading screen.
        router.replace('/(tabs)/Home');
      } else {
        router.replace('/(accountCreation)/Login');
      }
    } catch (error) {
      console.log('Erro rederecionado para pagina de criação de conta', error);
      // Fallback to the login screen if storage access fails for any reason
      router.replace('/(accountCreation)/Login');
    }
  };

  // --- Effects ---

  // Run the login verification check once when the component mounts.
  useEffect(() => {
    verifyLogin();
  }, []);

  // --- Render ---
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
