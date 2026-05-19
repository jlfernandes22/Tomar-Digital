import React from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "../context/AuthContext";
import { PaperProvider, useTheme } from "react-native-paper";
import { ThemeProvider, useAppTheme } from "../context/ThemeContext";
import ThemeSelectorFAB from "../app/components/ThemeSelectorFAB";
import {
  ThemeProvider as NavThemeProvider,
  DefaultTheme,
} from "@react-navigation/native";
import "./globals.css";

const ThemeSelector = ({ children }: { children: React.ReactNode }) => {
  const { currentTheme } = useAppTheme();

  const navTheme = {
    ...DefaultTheme,
    dark: currentTheme.dark,
    colors: {
      ...DefaultTheme.colors,
      primary: currentTheme.colors.primary,
      background: currentTheme.colors.background,
      card: currentTheme.colors.surface,
      text: currentTheme.colors.onSurface,
      border: currentTheme.colors.outline,
      notification: currentTheme.colors.error,
    },
  };

  return (
    <PaperProvider theme={currentTheme}>
      <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>
    </PaperProvider>
  );
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
                options={{ headerShown: false, gestureEnabled: true }}
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
