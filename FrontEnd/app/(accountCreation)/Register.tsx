/**
 * Register Screen
 *
 * Handles new user registration. Collects email, city, and password,
 * performs client-side validation (including password strength), and
 * communicates with the backend to create the account.
 * On success, it navigates the user to the email validation screen.
 */

import {
  Image,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { router } from 'expo-router';
import { images } from '@/constants/images';
import { delay } from '../../utils/delay';
import CustomButton from '../components/CustomButton';
import CustomTextField from '../components/CustomTextInput';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import { useAppTheme } from '@/context/ThemeContext';
import { Surface, Text } from 'react-native-paper';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');

  // UI feedback state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const { currentTheme: theme } = useAppTheme();

  /**
   * Handles the registration process.
   * Runs sequential client-side validations before making the API call.
   * If successful, navigates the user to the Validate screen.
   */
  const handleRegister = async () => {
    setLoading(true);

    // 1. Check for empty required fields
    if (!email || !password) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('register.warning_empty'));
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    // 2. Ensure passwords match
    if (password !== confirmPassword) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('register.warning_mismatch'));
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    // 3. Enforce password strength using a regex pattern.
    // Requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.
    const isSecure =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/.test(
        password,
      );

    if (!isSecure) {
      setDialogTitle(t('common.warning'));
      setDialogText(
        t('register.warning_weak_password', {
          defaultValue:
            'A password deve ter pelo menos 8 caracteres, uma letra maiúscula, um número e um caractere especial.',
        }),
      );
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/registar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, city }),
      });

      // Handle rate limiting (HTTP 429) early without attempting to parse JSON
      if (response.status === 429) {
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        setLoading(false);
        return;
      }

      const dados = await response.json();

      if (response.ok) {
        setLoading(false);
        setSnackbarMessage(t('register.success'));
        setSnackbarVisible(true);

        // Brief pause to allow the user to read the success snackbar before transitioning
        await delay(500);

        // Navigate to the Validate screen, passing the email as a param
        // so the user doesn't have to type it again.
        router.replace({
          pathname: '/Validate',
          params: { email: email },
        });
      } else {
        // Handle expected API errors (e.g., email already in use)
        setDialogTitle(t('common.error'));
        setDialogText(dados.message || t('register.error_generic'));
        setDialogVisible(true);
        setLoading(false);
      }
    } catch (err) {
      // Handle unexpected network errors
      setDialogTitle(t('common.error'));
      setDialogText(t('register.error_server'));
      setDialogVisible(true);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      {/* Background Image and Overlay */}
      {/* The overlay adds a semi-transparent layer to ensure text readability over the image */}
      <Image
        source={images.backgroundRegister}
        className="absolute h-full w-full"
        resizeMode="cover"
      />
      <View
        className="absolute h-full w-full"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
      />

      <SafeAreaView className="flex-1 bg-transparent">
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
          - keyboardVerticalOffset adds a small gap on Android so inputs aren't flush against the keyboard.
        */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'android' ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: 40,
            }}
            // Prevents the keyboard from dismissing when tapping inside a text field,
            // but allows it to dismiss when tapping outside.
            keyboardShouldPersistTaps="handled"
            bounces={false} // Disables iOS scroll bounce for a more form-like feel
          >
            {/* Wraps the form to allow tapping outside inputs to dismiss the keyboard */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="w-[90%] self-center py-10">
                <Surface
                  elevation={2}
                  style={{
                    backgroundColor: theme.colors.surfaceContainer,
                    padding: 32,
                    borderRadius: theme.roundness === 0 ? 0 : 24,
                  }}
                >
                  <Text
                    className="mb-4 text-center text-4xl font-bold"
                    style={{
                      color: theme.colors.primary,
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                    variant="headlineLarge"
                  >
                    {t('register.title')}
                  </Text>

                  <CustomTextField
                    label={t('register.email')}
                    value={email}
                    onChangeText={setEmail}
                    isEmail // Triggers email-specific keyboard and validation in CustomTextInput
                    className="mb-5"
                  />

                  <CustomTextField
                    label={t('register.city')}
                    value={city}
                    onChangeText={setCity}
                    className="mb-5"
                  />

                  <CustomTextField
                    label={t('register.password')}
                    value={password}
                    onChangeText={setPassword}
                    isPassword // CustomTextInput handles the secure entry and eye icon internally
                    className="mb-5"
                  />

                  <CustomTextField
                    label={t('register.confirm_password')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    className="mb-8"
                  />

                  <CustomButton
                    onPress={handleRegister}
                    loading={loading}
                    accessibilityLabel={t('register.register_button')}
                    accessibilityHint={t('accessibility.register_hint', {
                      defaultValue: 'Clica para criar uma nova conta',
                    })}
                  >
                    {t('register.register_button')}
                  </CustomButton>

                  <View
                    style={{
                      flexDirection: 'row',
                      paddingTop: 16,
                      alignSelf: 'center',
                    }}
                  >
                    <Text>{t('register.has_account')} </Text>
                    <Text
                      onPress={() => router.replace('/Login')}
                      style={{ color: theme.colors.error }}
                    >
                      {t('register.login')}
                    </Text>
                  </View>
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
            <Text>{dialogText}</Text>
          </CustomDialog>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Register;
