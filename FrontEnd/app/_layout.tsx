import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from "../context/AuthContext"; // Ajusta o caminho se necessário
import "./globals.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen name="(accountRelated)" options={{ headerShown: false }} />
          
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </SafeAreaProvider>
    </AuthProvider>
  );
}
