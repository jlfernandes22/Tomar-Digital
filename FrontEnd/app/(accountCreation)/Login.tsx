/**
 * Login Screen
 *
 * Provides the authentication interface for users. Handles form state,
 * API communication, error handling, and session initialization via the AuthContext.
 */

import {
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  View,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { images } from '@/constants/images';
import CustomButton from '../components/CustomButton';
import CustomTextField from '../components/CustomTextInput';
import { delay } from '../../utils/delay';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import { useAppTheme } from '@/context/ThemeContext';
import { Surface, Text as PaperText } from 'react-native-paper';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Login = () => {
  const { t } = useTranslation();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI feedback state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const [loading, setLoading] = useState(false);

  // Hooks for global state and theming
  const { login } = useAuth();
  const { currentTheme: theme } = useAppTheme();

  /**
   * Handles the login process.
   * Sends credentials to the backend, handles rate limiting,
   * and initializes the user session on success.
   */
  const handleLogin = async () => {
    try {
      setLoading(true); // Disables inputs and shows spinner on the button

      const response = await fetch(`${API_URL}/iniciarSessao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Handle HTTP 429 (Too Many Requests) gracefully without parsing JSON
      if (response.status === 429) {
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        setLoading(false);
        return;
      }

      const dados = await response.json();

      if (response.ok) {
        setSnackbarMessage(t('login.success'));
        setSnackbarVisible(true);

        // Brief pause to let the user see the success snackbar before navigating
        await delay(500);

        // Extract user data from API response, providing safe fallbacks
        const idEncontrado = dados.userId;
        const roleEncontrado = dados.role || dados.userRole || dados.user?.role;
        const tokenEncontrado = dados.token;
        const emailEncontrado = dados.user?.email || email;
        const saldoEncontrado = dados.user?.Points || 0;
        const nomeEncontrado = dados.user?.name || email;
        const cidadeEncontrada = dados.user?.city;
        const NIFEncontrado = dados.user?.NIF;
        const acceptedTermsEncontrado =
          dados.user?.acceptedInvoiceTerms || false;
        const AvatarEncontrado = dados.user?.Avatar;

        // Ensure we received the minimum required data before logging in
        if (idEncontrado && tokenEncontrado) {
          // Update the global AuthContext
          await login(
            idEncontrado,
            roleEncontrado,
            tokenEncontrado,
            emailEncontrado,
            saldoEncontrado,
            nomeEncontrado,
            cidadeEncontrada,
            NIFEncontrado,
            acceptedTermsEncontrado,
            AvatarEncontrado,
          );

          // Replace login screen in the navigation stack so users can't hit "back" to return to it
          router.replace('/(tabs)/Home');
        }
      } else {
        // Handle expected API errors (e.g., invalid credentials)
        setLoading(false);
        setDialogTitle(t('common.error'));
        setDialogText(t('login.error_login') + dados.message);
        setDialogVisible(true);
      }
    } catch (error) {
      // Handle unexpected network or server errors
      setLoading(false);
      setDialogTitle(t('common.error'));
      setDialogText(t('login.error_server'));
      setDialogVisible(true);
    }
  };

  return (
    <View className="flex-1">
      {/* Background Image and Overlay */}
      {/* The overlay adds a semi-transparent layer to ensure text readability over the image */}
      <Image
        source={images.backgroundLogin}
        className="absolute h-full w-full"
        resizeMode="cover"
      />
      <View
        className="absolute h-full w-full"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      />

      <SafeAreaView className="flex-1">
        {/* Language Switcher positioned at the top right */}
        <View
          style={{
            width: '100%',
            alignItems: 'flex-end',
            paddingRight: 10,
            paddingTop: 10,
            zIndex: 10, // Ensures the button is tappable above other elements
          }}
        >
          <LanguageSwitcher />
        </View>

        {/*
          KeyboardAvoidingView shifts the content up when the keyboard appears.
          - 'padding' is generally preferred on iOS to avoid layout jump issues.
          - 'height' works better on Android to prevent resizing artifacts.
        */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: 30,
            }}
            // Prevents the keyboard from dismissing when tapping inside a text field,
            // but allows it to dismiss when tapping outside.
            keyboardShouldPersistTaps="handled"
            bounces={false} // Disables iOS scroll bounce for a more form-like feel
          >
            {/* Wraps the form to allow tapping outside inputs to dismiss the keyboard */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="w-[90%] self-center">
                <Surface
                  elevation={2}
                  style={{
                    backgroundColor: theme.colors.surfaceContainer,
                    padding: 32,
                    borderRadius: theme.roundness === 0 ? 0 : 24,
                  }}
                >
                  <Text
                    className="mb-8 text-center text-4xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    {t('login.title')}
                  </Text>

                  <CustomTextField
                    label={t('login.email')}
                    value={email}
                    onChangeText={setEmail}
                    isEmail
                    className="mb-5"
                  />

                  <CustomTextField
                    label={t('login.password')}
                    value={password}
                    onChangeText={setPassword}
                    isPassword // CustomTextInput handles the secure entry and eye icon internally
                    className="mb-8"
                  />

                  <CustomButton
                    onPress={handleLogin}
                    loading={loading}
                    accessibilityLabel={t('login.login_button')}
                    accessibilityHint={t('accessibility.login_hint', {
                      defaultValue: 'Clica para iniciar sessão na aplicação',
                    })}
                  >
                    {t('login.login_button')}
                  </CustomButton>
                </Surface>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          {/* Global UI feedback components */}
          <CustomSnackBar
            visible={snackbarVisible}
            message={snackbarMessage}
            onDismiss={() => setSnackbarVisible(false)}
          />
          <CustomDialog
            title={dialogTitle}
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
          >
            <PaperText>{dialogText}</PaperText>
          </CustomDialog>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Login;
