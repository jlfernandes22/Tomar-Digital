/**
 * RecoverPassword Screen
 *
 * Prompts the user to enter their email to receive a password recovery code.
 * Enforces a strict flow by disabling navigation gestures and the hardware back button.
 */
import React, { useState, useCallback } from 'react';
import { View, BackHandler } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { API_URL } from '@/constants/api';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { Text } from 'react-native-paper';
import CustomDialog from '../components/CustomDialog';
import CustomSnackBar from '../components/CustomSnackBar';
import { useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
import delay from '@/utils/delay';

const RecoverPassword = () => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  // UI feedback state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * Sends the email to the backend to generate and send a recovery code.
   */
  const handleSendCode = async () => {
    if (!email) {
      setDialogTitle(t('recoverPassword.error_title'));
      setDialogText(t('recoverPassword.missing_email'));
      setDialogVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/recuperarPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(t('recoverPassword.success_msg'));
        setSnackbarVisible(true);

        // Brief pause to let the user read the success message before transitioning screens.
        await delay(1000);
        // Navigate to the reset screen, passing the email
        router.replace({ pathname: '/NewPassword', params: { email: email } });
      } else {
        setDialogTitle(t('recoverPassword.error_title'));
        setDialogText(data.message || t('recoverPassword.error_title'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('recoverPassword.error_title'));
      setDialogText(t('recoverPassword.connection_error'));
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * useFocusEffect runs when the screen comes into focus.
   * Here, we intercept the Android hardware back button to prevent the user
   * from navigating away before completing the recovery flow.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; // Blocks the back button
      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );
      return () => subscription.remove();
    }, []),
  );

  return (
    <>
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          justifyContent: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Stack.Screen
          options={{
            headerBackVisible: false,
            gestureEnabled: false,
            title: t('recoverPassword.title'),
          }}
        />

        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: 0.5,
            color: theme.colors.primary,
          }}
        >
          {t('recoverPassword.title')}
        </Text>

        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {t('recoverPassword.subtitle')}
        </Text>

        <View style={{ gap: 16 }}>
          <CustomTextInput
            label={t('login.email')}
            value={email}
            onChangeText={setEmail}
            isEmail
            className="mb-5"
          />

          <CustomButton onPress={handleSendCode} loading={loading}>
            {t('recoverPassword.send_btn')}
          </CustomButton>
          <CustomButton
            onPress={() => router.replace('/(accountCreation)/Login')}
            loading={loading}
          >
            {t('recoverPassword.login_screen')}
          </CustomButton>
        </View>

        <CustomSnackBar
          visible={snackbarVisible}
          message={snackbarMessage}
          onDismiss={() => setSnackbarVisible(false)}
        />
      </View>

      <CustomDialog
        title={dialogTitle}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        onPress={() => setDialogVisible(false)}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>
    </>
  );
};

export default RecoverPassword;
