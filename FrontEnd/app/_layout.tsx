import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { PaperProvider } from 'react-native-paper';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import QrCodeFAB from './components/QrCodeFAB';
import {
  ThemeProvider as NavThemeProvider,
  DefaultTheme,
} from '@react-navigation/native';
import './globals.css';
import { initI18n } from '../i18n';
import * as SplashScreen from 'expo-splash-screen';
import { LoadingProvider } from '@/context/LoadingContext';

SplashScreen.preventAutoHideAsync();

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
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initI18n();
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemeSelector>
          <LoadingProvider>
            <SafeAreaProvider>
              {/* O Stack gere a navegação base da aplicação */}
              <Stack>
                <Stack.Screen
                  name="(accountCreation)"
                  options={{ headerShown: false, gestureEnabled: true }}
                />

                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
              <QrCodeFAB />
            </SafeAreaProvider>
          </LoadingProvider>
        </ThemeSelector>
      </ThemeProvider>
    </AuthProvider>
  );
}
