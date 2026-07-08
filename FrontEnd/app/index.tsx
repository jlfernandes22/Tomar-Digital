import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';

/**
 * Index Screen (App Entry Point)
 *
 * Acts as an initial routing gate. It checks if a user session exists in
 * persistent secure storage and redirects to the appropriate screen
 * (Home or Login). While performing this asynchronous check, it displays
 * a simple themed loading indicator.
 *
 * IMPORTANT: The AuthContext stores the full user object (including the JWT
 * token) in expo-secure-store under the key 'user_data'. This gate reads
 * from the SAME store and key so that a logged-in user is recognized on
 * the next app launch and sent straight to Home — instead of being forced
 * to log in again every time.
 */
const Index = () => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();

  // --- Handlers ---

  /**
   * Checks SecureStore for an existing user session.
   * Redirects to the main app if found, otherwise sends the user to the
   * login flow.
   */
  const verifyLogin = async () => {
    try {
      // Must match the key used by AuthContext (STORAGE_KEY = 'user_data').
      const savedUser = await SecureStore.getItemAsync('user_data');

      if (savedUser) {
        // Validate that the stored JSON is parseable and contains a token.
        // A corrupt or partial record should be treated as "not logged in".
        const userData = JSON.parse(savedUser);
        if (userData && userData.token) {
          // Use replace to overwrite the current route in the history.
          // This prevents the user from hitting the back button and
          // returning to this loading screen.
          router.replace('/(tabs)/Home');
          return;
        }
      }
      // No valid session — go to login.
      router.replace('/(accountCreation)/Login');
    } catch (error) {
      console.log('Erro ao verificar sessão, redirecionado para login', error);
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
