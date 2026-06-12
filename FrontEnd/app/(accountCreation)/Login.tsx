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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { currentTheme: theme } = useAppTheme();

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/iniciarSessao`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      console.log(`${API_URL}/iniciarSessao`);

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
        await delay(500);

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

        if (idEncontrado && tokenEncontrado) {
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
          router.replace('/(tabs)/Home');
        }
      } else {
        setLoading(false);
        setDialogTitle(t('common.error'));
        setDialogText(t('login.error_login') + dados.message);
        setDialogVisible(true);
      }
    } catch (error) {
      setLoading(false);
      setDialogTitle(t('common.error'));
      setDialogText(t('login.error_server'));
      setDialogVisible(true);
    }
  };

  return (
    <View className="flex-1">
      {/* Imagem de Fundo */}
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
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              paddingBottom: 30,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
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
                    isPassword
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
