import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import ThemeSelectorFAB from "../app/components/ThemeSelectorFAB";
import "./globals.css";

// O ThemeSelector extrai o tema dinâmico do contexto e injeta-o no PaperProvider
const ThemeSelector = ({ children }: { children: React.ReactNode }) => {
  const { currentTheme } = useAppTheme();
  return <PaperProvider theme={currentTheme}>{children}</PaperProvider>;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemeSelector>
          <SafeAreaProvider>
            {/* O Stack gere a navegação base da aplicação */}
            <Stack>
              <Stack.Screen
                name="(accountCreation)"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            </Stack>

            {/* Injeção do FAB ao nível da raiz. 
              Ao ser colocado fora do Stack mas dentro do SafeAreaProvider e PaperProvider, 
              ele sobrepõe-se a qualquer ecrã ativo sem perder a formatação do tema.
            */}
            <ThemeSelectorFAB />
          </SafeAreaProvider>
        </ThemeSelector>
      </ThemeProvider>
    </AuthProvider>
  );
}
