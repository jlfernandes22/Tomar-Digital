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
  const params = useLocalSearchParams();
  const email = params.email as string;
  const { currentTheme: theme } = useAppTheme();

  const [code, setCode] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(true);
  const [dialogText, setDialogText] = useState(t('validar.emailInfo'));
  const [dialogTitle, setDialogTitle] = useState(t('validar.verifyEmail'));
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [actionAfterDialog, setActionAfterDialog] = useState<
    'toRegister' | 'toLogin' | null
  >(null);

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

  const handleVerify = async () => {
    try {
      const response = await fetch(`${API_URL}/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, code: code }),
      });

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
        await delay(500);
        router.replace('/Login');
      } else {
        const novasTentativas = tentativas + 1;
        setTentativas(novasTentativas);

        if (novasTentativas >= 3) {
          setDialogTitle(t('validar.blocked'));
          setDialogText(t('validar.exceeded_attempts'));
          setActionAfterDialog('toRegister');
          setDialogVisible(true);
        } else {
          setDialogTitle(t('common.error'));
          setDialogText(
            t('validar.invalid_code_attempt', { attempt: novasTentativas }),
          );
          setDialogVisible(true);
        }
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('validar.error_connection'));
      setDialogVisible(true);
    }
  };

  useFocusEffect(
    useCallback(() => {
      // Bloqueia o botão físico de voltar do Android
      const onBackPress = () => true;

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
            isNumber
            label={t('validar.code')}
            value={code}
            lenght={6}
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
