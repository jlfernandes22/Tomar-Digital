import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from "../context/AuthContext"; 
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import "./globals.css";

// 1. Clonamos o tema claro do M3 e substituímos as cores principais pelas tuas!
const customTheme = {
  ...MD3LightTheme,
  roundness: 10,
  colors: {
    ...MD3LightTheme.colors,
    
    
    primary: '#2D1F16',             
    onPrimary: '#FFFFFF',           
    
    
    secondary: '#FF6600',           
    onSecondary: '#FFFFFF',         
    
    // Cores de fundo e estrutura
    background: '#FCFAF9',          // Fundo geral da app (Convento 50)
    surface: '#FFFFFF',             // Fundo dos cartões e dos TextInputs
    surfaceVariant: '#F4ECE7',      // Fundo para elementos inativos (Convento 100)
    
    // Cores de estado (Alertas/Erros)
    error: '#CC0000',               // Vermelho clássico (Tabuleiros 600)
    
    // Detalhes do M3 (A linha em volta do TextInput quando focado)
    outline: '#946648',             // Convento 600
    primaryContainer: '#E3D1C5',    // Convento 200 (usado em botões mais suaves)
    onPrimaryContainer: '#2D1F16',
  },
};

export default function RootLayout() {
  return (
    <AuthProvider>
      {/* 2. Injetamos o nosso customTheme aqui! */}
      <PaperProvider theme={customTheme}>
        <SafeAreaProvider>
          <Stack>
            <Stack.Screen name="(accountCreation)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </PaperProvider>
    </AuthProvider>
  );
}