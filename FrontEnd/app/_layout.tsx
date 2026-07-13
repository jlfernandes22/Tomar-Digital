import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { PaperProvider } from 'react-native-paper';
import {
  ThemeProvider as NavThemeProvider,
  DefaultTheme,
} from '@react-navigation/native';

// Contexts
import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider, useAppTheme } from '../context/ThemeContext';
import { LoadingProvider } from '@/context/LoadingContext';

// Components & Config
import QrCodeFAB from './components/QrCodeFAB';
import { initI18n } from '../i18n';
import './globals.css';

// Prevent the splash screen from hiding automatically until we finish initializing resources.
SplashScreen.preventAutoHideAsync();

/**
 * ThemeSelector Component
 *
 * Bridges the app's custom Material Design 3 (MD3) theme with React Navigation's theme system.
 * React Navigation doesn't natively understand MD3 color tokens, so we map our app's dynamic
 * colors to the specific properties React Navigation expects (like `card`, `text`, `border`).
 * This ensures native stack headers and tab bars match the active app theme.
 */
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
    // PaperProvider applies the MD3 theme to all React Native Paper components
    <PaperProvider theme={currentTheme}>
      {/* NavThemeProvider applies the mapped theme to React Navigation components */}
      <NavThemeProvider value={navTheme}>{children}</NavThemeProvider>
    </PaperProvider>
  );
};

/**
 * RootLayout Component
 *
 * The root layout for the entire application. It sets up the initial loading sequence,
 * initializes global services like internationalization (i18n), and establishes the
 * context provider hierarchy (Auth, Theme, Loading, SafeArea) required by all screens.
 */
export default function RootLayout() {
  // --- State ---
  // Tracks whether essential app resources (like translations) have finished loading.
  const [appIsReady, setAppIsReady] = useState(false);

  // --- Effects ---

  /**
   * Initialize core app services on mount.
   * We wait for i18n to load before rendering the main UI to prevent
   * a "flash of untranslated text" on cold starts.
   */
  useEffect(() => {
    async function prepare() {
      try {
        await initI18n();
      } catch (e) {
        console.warn('Error initializing app resources:', e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // Hide the native splash screen once the app is ready to render UI.
  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  // --- Early Return ---
  // Render nothing while i18n is loading. The native splash screen covers this gap.
  if (!appIsReady) {
    return null;
  }

  // --- Render ---
  return (
    // 1. AuthProvider: Manages user session, tokens, and role globally. Must be at the top.
    <AuthProvider>
      {/* 2. ThemeProvider: Loads saved theme preferences and provides the active MD3 palette. */}
      <ThemeProvider>
        {/* 3. ThemeSelector: Wraps the app in Paper and React Navigation theme providers. */}
        <ThemeSelector>
          {/* 4. LoadingProvider: Manages global loading state (used to toggle the global QrCodeFAB). */}
          <LoadingProvider>
            {/* 5. SafeAreaProvider: Ensures UI respects device notches and safe areas. */}
            <SafeAreaProvider>
              {/* The Stack navigator manages the base routing (Auth Flow vs Main App Tabs). */}
              <Stack>
                <Stack.Screen
                  name="(accountCreation)"
                  options={{ headerShown: false, gestureEnabled: true }}
                />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>

              {/* Global floating action button, rendered above all screens via Portal. */}
              <QrCodeFAB />
            </SafeAreaProvider>
          </LoadingProvider>
        </ThemeSelector>
      </ThemeProvider>
    </AuthProvider>
  );
}
