/**
 * Validate Screen
 *
 * Prompts the user to enter the 6-digit verification code sent to their email.
 * It enforces a strict flow by disabling navigation gestures and the hardware back button,
 * and limits the user to 3 verification attempts before redirecting them back to registration.
 */
import React, { useCallback, useState } from 'react';
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
import { useTranslation } from 'react-i18next';
import { Dialog, Text, Portal, useTheme } from 'react-native-paper';
import delay from '@/utils/delay';
import CustomDialog from '../components/CustomDialog';
import CustomSnackBar from '../components/CustomSnackBar';
import { useAppTheme } from '@/context/ThemeContext';

const Validate = () => {
  const { t } = useTranslation();

  // Extracts the 'email' parameter passed from the Register screen via the router.
  const params = useLocalSearchParams();
  const email = params.email as string;
  const { currentTheme: theme } = useAppTheme();

  const [code, setCode] = useState('');
  const [tentativas, setTentativas] = useState(0); // Tracks failed verification attempts

  // UI feedback state
  const [dialogVisible, setDialogVisible] = useState(true); // Open by default to show initial instructions
  const [dialogText, setDialogText] = useState(t('validar.emailInfo'));
  const [dialogTitle, setDialogTitle] = useState(t('validar.verifyEmail'));
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Tracks where the user should go after they dismiss the current dialog.
  // This is useful for deferred navigation (e.g., waiting for them to click "OK" before routing).
  const [actionAfterDialog, setActionAfterDialog] = useState<
    'toRegister' | 'toLogin' | null
  >(null);

  /**
   * Handles closing the dialog and performing any deferred navigation
   * that was queued up while the dialog was visible.
   */
  const handleDialogClose = () => {
    setDialogVisible(false);
    if (actionAfterDialog === 'toRegister') {
      setActionAfterDialog(null);
      router.replace('/Register');
    } else if (actionAfterDialog === 'toLogin') {
      setActionAfterDialog(null);
      router.replace('/Login');
    }
  };

  /**
   * Submits the verification code to the backend.
   * Handles rate limiting, successful validation, and attempt tracking.
   */
  const handleVerify = async () => {
    try {
      const response = await fetch(`${API_URL}/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: code }),
      });

      // Handle rate limiting (HTTP 429) early without attempting to parse JSON.
      if (response.status === 429) {
        setDialogTitle(t('common.error') + ':');
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(t('common.success') + ':\n' + t('validar.success'));
        setSnackbarVisible(true);

        // Brief pause to let the user read the success message before transitioning screens.
        await delay(500);
        router.replace('/Login');
      } else {
        // Increment failed attempt counter
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        // If the user exceeds the allowed attempts, force them back to registration.
        if (novasTentativas >= 3) {
          setDialogTitle(t('validar.blocked'));
          setDialogText(t('validar.exceeded_attempts'));
          setActionAfterDialog('toRegister'); // Queue navigation for when dialog closes
          setDialogVisible(true);
        } else {
          // Show generic invalid code error with remaining attempt context
          setDialogTitle(t('common.error'));
          setDialogText(
            t('validar.invalid_code_attempt', { attempt: novasTentativas }),
          );
          setDialogVisible(true);
        }
      }
    } catch (error) {
      // Handle unexpected network errors
      setDialogTitle(t('common.error'));
      setDialogText(t('validar.error_connection'));
      setDialogVisible(true);
    }
  };

  /**
   * useFocusEffect runs when the screen comes into focus.
   * Here, we intercept the Android hardware back button to prevent the user
   * from navigating away before completing the verification flow.
   * Returning `true` from the handler prevents the default back navigation.
   */
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => true; // Blocks the back button

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress,
      );

      // Cleanup function removes the listener when the screen loses focus.
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
        {/* 
          Stack.Screen options allow us to configure the header dynamically.
          - headerBackVisible: false hides the default back arrow.
          - gestureEnabled: false disables the iOS swipe-back gesture.
          Together, these enforce the strict verification flow.
        */}
        <Stack.Screen
          options={{
            headerBackVisible: false,
            gestureEnabled: false,
            title: t('validar.title'),
          }}
        />

        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 32,
            letterSpacing: 0.5,
          }}
        >
          {t('validar.title')}
        </Text>

        <View style={{ gap: 16 }}>
          <CustomTextInput
            placeholder={t('validar.placeholder')}
            onChangeText={setCode}
            isNumber // Ensures a numeric keyboard is shown on mobile devices
            label={t('validar.code')}
            value={code}
            lenght={6} // Limits input to exactly 6 characters
          />

          <CustomButton onPress={handleVerify}>
            {t('common.confirm')}
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
        onDismiss={handleDialogClose}
        onPress={handleDialogClose}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>
    </>
  );
};

export default Validate;
