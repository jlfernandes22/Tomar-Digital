import { router } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ActivityIndicator } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { isTokenExpired } from '@/utils/jwt';

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
 *
 * TOKEN EXPIRY CHECK:
 * The backend JWT expires after 1 day (expiresIn: "1d"). If the user hasn't
 * opened the app in over a day, the stored token is expired. We check this
 * HERE (at app launch) and clear the session before navigating, so the user
 * is sent to login instead of being stuck in the app with every API call
 * returning 401 "Token inválido ou expirado".
 */
const Index = () => {
  // --- Hooks ---
  const { currentTheme: theme } = useAppTheme();

  // --- Handlers ---

  /**
   * Checks SecureStore for an existing user session.
   * If a session exists AND the token is still valid, redirects to Home.
   * If the session is missing OR the token is expired, clears the stored
   * data and redirects to Login.
   */
  const verifyLogin = async () => {
    try {
      // Must match the key used by AuthContext (STORAGE_KEY = 'user_data').
      const savedUser = await SecureStore.getItemAsync('user_data');

      if (savedUser) {
        // Validate that the stored JSON is parseable and contains a token.
        // A corrupt or partial record should be treated as "not logged in".
        const userData = JSON.parse(savedUser);

        //
        // CORRUPT TOKEN FOR TESTING (uncomment to force expired token):
        //
        // const payload = JSON.parse(
        //   atob(
        //     userData.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'),
        //   ),
        // );
        // payload.exp = Math.floor(Date.now() / 1000) - 3600; // expired 1 hour ago
        // const newPayload = btoa(JSON.stringify(payload));
        // userData.token =
        //   userData.token.split('.')[0] + '.' + newPayload + '.fake-signature';
        // // Write it back to SecureStore so AuthContext also sees the expired token:
        // await SecureStore.setItemAsync('user_data', JSON.stringify(userData));
        if (userData && userData.token) {
          // --- Check if the JWT token has expired ---
          // The backend sets expiresIn: "1d". If the token is expired, we
          // clear the stored session and redirect to login. Without this
          // check, the user would land on the Home screen with an expired
          // token and see "Could not load businesses" / "Error fetching
          // data" on every screen.
          if (isTokenExpired(userData.token)) {
            console.warn(
              '[index.tsx] Stored JWT is expired — clearing session and ' +
                'redirecting to login.',
            );
            await SecureStore.deleteItemAsync('user_data');
            router.replace('/(accountCreation)/Login');
            return;
          }

          // Token is valid — proceed to the main app.
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
