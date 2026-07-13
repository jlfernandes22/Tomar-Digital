/**
 * NewPassword Screen
 *
 * Prompts the user to enter the 6-digit recovery code and their new password.
 * Enforces a strict flow by disabling navigation gestures and the hardware back button.
 */
import React, { useState, useCallback } from 'react';
import { View, BackHandler } from 'react-native';
import {
  useLocalSearchParams,
  router,
  Stack,
  useFocusEffect,
} from 'expo-router';
import { API_URL } from '@/constants/api';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import { Text } from 'react-native-paper';
import delay from '@/utils/delay';
import CustomDialog from '../components/CustomDialog';
import CustomSnackBar from '../components/CustomSnackBar';
import { useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';

const NewPassword = () => {
  const { t } = useTranslation();
  // Extracts the 'email' parameter passed from the RecoverPassword screen
  const params = useLocalSearchParams();
  const email = params.email as string;
  const { currentTheme: theme } = useAppTheme();

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // UI feedback state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  /**
   * Submits the code and new password to the backend.
   */
  const handleResetPassword = async () => {
    if (!code || !newPassword || !confirmPassword) {
      setDialogTitle(t('newPassword.error_title'));
      setDialogText(t('newPassword.missing_fields'));
      setDialogVisible(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setDialogTitle(t('newPassword.error_title'));
      setDialogText(t('newPassword.password_mismatch'));
      setDialogVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/alterarPassword`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(t('newPassword.success_msg'));
        setSnackbarVisible(true);

        // Brief pause to let the user read the success message before transitioning screens.
        await delay(1000);
        router.replace('/Login');
      } else {
        setDialogTitle(t('newPassword.error_title'));
        setDialogText(data.message || t('newPassword.error_title'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('newPassword.error_title'));
      setDialogText(t('newPassword.connection_error'));
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  /**
   * useFocusEffect runs when the screen comes into focus.
   * Here, we intercept the Android hardware back button to prevent the user
   * from navigating away before completing the reset flow.
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
            title: t('newPassword.title'),
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
          {t('newPassword.title')}
        </Text>

        <Text
          style={{
            fontSize: 16,
            textAlign: 'center',
            marginBottom: 32,
            color: theme.colors.onSurfaceVariant,
          }}
        >
          {t('newPassword.subtitle')}
        </Text>

        <View style={{ gap: 16 }}>
          <CustomTextInput
            placeholder={t('validar.placeholder')}
            onChangeText={setCode}
            isNumber
            label={t('validar.code')}
            value={code}
            lenght={6}
          />

          <CustomTextInput
            label={t('newPassword.title')}
            value={newPassword}
            onChangeText={setNewPassword}
            isPassword
          />

          <CustomTextInput
            label={t('register.confirm_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword
          />

          <CustomButton onPress={handleResetPassword} loading={loading}>
            {t('newPassword.change_btn')}
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

export default NewPassword;
