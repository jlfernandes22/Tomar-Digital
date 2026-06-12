import {
  Image,
  Text,
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
import { Surface, Text as PaperText } from 'react-native-paper';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

const Register = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const { currentTheme: theme } = useAppTheme();
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    if (!email || !password) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('register.warning_empty'));
      setDialogVisible(true);
      setLoading(false);
      return;
    }
    console.log('password e email existem');

    if (password !== confirmPassword) {
      setDialogTitle(t('common.warning'));
      setDialogText(t('register.warning_mismatch'));
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    console.log('password correta ');
    try {
      const response = await fetch(`${API_URL}/registar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, city }),
      });
      console.log('enviou');

      if (response.status === 429) {
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error_429'));
        setDialogVisible(true);
        setLoading(false);
        return;
      }
      console.log('passado primeiro check');
      const dados = await response.json();

      if (response.ok) {
        setLoading(false);
        setSnackbarMessage(t('register.success'));
        setSnackbarVisible(true);
        await delay(500);
        router.replace({
          pathname: '/Validate',
          params: { email: email }, // Passamos o email para a próxima tela
        });
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(dados.message || t('register.error_generic'));
        setDialogVisible(true);
        setLoading(false);
      }
    } catch (err) {
      setDialogTitle(t('common.error'));
      setDialogText(t('register.error_server'));
      setDialogVisible(true);
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
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
        <View
          style={{
            width: '100%',
            alignItems: 'flex-end',
            paddingRight: 10,
            paddingTop: 10,
            zIndex: 10,
          }}
        >
          <LanguageSwitcher />
        </View>
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
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
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
                    className="mb-8 text-center text-4xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    {t('register.title')}
                  </Text>

                  <CustomTextField
                    label={t('register.email')}
                    value={email}
                    onChangeText={setEmail}
                    isEmail
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
                    isPassword
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
                </Surface>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>
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

export default Register;
