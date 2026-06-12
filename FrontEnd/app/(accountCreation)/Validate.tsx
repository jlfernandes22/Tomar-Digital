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
import { Dialog, Text, Portal } from 'react-native-paper';
import delay from '@/utils/delay';
import CustomDialog from '../components/CustomDialog';
import CustomSnackBar from '../components/CustomSnackBar';

const Validate = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const email = params.email as string;

  const [code, setCode] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [actionAfterDialog, setActionAfterDialog] = useState<'toRegister' | 'toLogin' | null>(null);

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
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        <Stack.Screen
          options={{
            headerBackVisible: false,
            gestureEnabled: false,
            title: t('validar.title'),
          }}
        />
        <Text style={{ fontSize: 20, textAlign: 'center', marginBottom: 20 }}>
          {t('validar.title')}
        </Text>

        <CustomTextInput
          placeholder={t('validar.placeholder')}
          onChangeText={setCode}
          keyboardType="numeric"
          label={t('validar.code')}
          value={code}
        />

        <CustomButton onPress={handleVerify}>
          {t('common.confirm')}
        </CustomButton>
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
