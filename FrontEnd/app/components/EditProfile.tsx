import {
  ActivityIndicator,
  View,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { images } from '@/constants/images';
import {
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import { pickImage } from '@/utils/imagePicker';
import { useAppTheme } from '@/context/ThemeContext';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [NIF, setNIF] = useState(user?.NIF ? String(user.NIF) : '');
  const [loading, setLoading] = useState(false);
  const { currentTheme: theme } = useAppTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCity(user.city || '');
      setNIF(user.NIF ? String(user.NIF) : '');
      setImage(user.Avatar || '');
    }
  }, [user]);

  const [image, setImage] = useState(user.Avatar || null);
  const [visible, setvisible] = useState(false);
  const [message, setMessage] = useState('');

  const selecionarAvatar = async () => {
    const status = await pickImage();
    if (status == '') {
      alert('Precisamos de escolher uma imagem');
      return;
    }
    setImage(status);
  };

  const hideDialog = async () => {
    setDialogVisible(false);
    if (success) {
      router.replace('/(tabs)/Profile');
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('city', city);
      if (NIF) formData.append('NIF', NIF);

      if (
        image &&
        (image.startsWith('file://') || image.startsWith('content://'))
      ) {
        const uriLimpa =
          Platform.OS === 'android' ? image : image.replace('file://', '');
        const filename = image.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('avatar', {
          uri: uriLimpa,
          name: filename,
          type: type,
        } as any);
      }

      const response = await fetch(`${API_URL}/editarUser/${user.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setDialogText('Alteração de dados com sucesso');
        setDialogVisible(true);

        updateUser({
          ...user,
          name: data.user.name,
          city: data.user.city,
          NIF: data.user.NIF,
          Avatar: data.user.avatar,
        });
        console.log(data.user.avatar);

        if (data.user.Avatar) setImage(data.user.Avatar);
      } else {
        setDialogText('O servidor rejeitou as alterações.');
        setDialogVisible(true);
        setSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setDialogText('Ocorreu um erro ao comunicar com o servidor.');
      setDialogVisible(true);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }} className="p-4">
        {/* ScrollView adicionada para ecrãs pequenos e para quando o teclado abre */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho */}

          <Text
            variant="headlineMedium"
            style={{
              color: theme.colors.primary,
              fontWeight: 'bold',
              marginBottom: 10,
            }}
          >
            Editar Informações do Perfil
          </Text>

          <Divider
            style={{
              backgroundColor: theme.colors.outlineVariant,
              marginBottom: 16,
            }}
          />

          {/* Contentor Principal do Formulário*/}
          <View
            className=" mx-4 items-center rounded-xl border-2 px-6 py-8"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            {/* Zona da Imagem */}
            <View className=" mb-2 w-full flex-col items-center justify-center">
              <View
                className="h-32 w-32 items-center justify-center rounded-full border-2"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                  alignSelf: 'center',
                }}
              >
                {!image && (
                  <Text
                    className="text-4xl font-bold uppercase"
                    style={{ color: theme.colors.primary }}
                  >
                    {(user.name || user.email || 'V').charAt(0)}
                  </Text>
                )}
                {image && (
                  <Image
                    source={{
                      uri:
                        image.startsWith('file://') ||
                        image.startsWith('content://')
                          ? image
                          : `${API_URL}${image}`, // <-- LÊ O FICHEIRO DIRETAMENTE DO SERVIDOR!
                    }}
                    className="h-32 w-32 items-center justify-center rounded-full border-2"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.outline,
                    }}
                  />
                )}
              </View>

              <TouchableRipple
                className="relative bottom-8 left-11 size-11"
                onPress={selecionarAvatar}
                rippleColor={theme.colors.secondary}
                style={{
                  borderColor: theme.colors.outline,
                  borderRadius: 50,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: theme.colors.secondaryContainer,
                  borderWidth: 2,
                }}
              >
                <Image
                  key={theme.dark ? 'dark-theme' : 'light-theme'}
                  className="m-2 size-8"
                  tintColor={theme.colors.onSecondaryContainer}
                  source={images.editProfileImg}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
              </TouchableRipple>
            </View>
            <View className="mt-6 w-full">
              <CustomTextInput
                value={name}
                onChangeText={setName}
                label="Nome"
                className="mb-4 w-full"
              />

              <CustomTextInput
                label="Cidade"
                value={city}
                onChangeText={setCity}
                className="mb-4 w-full"
              />

              {user.NIF == null && (
                <CustomTextInput
                  label="NIF"
                  value={NIF}
                  onChangeText={setNIF}
                  isNIF
                  className="mb-4 w-full"
                />
              )}
            </View>

            <View className="mt-6 w-full">
              <CustomButton
                buttonColor={theme.colors.errorContainer}
                textColor={theme.colors.onErrorContainer}
                onPress={handleEdit}
                loading={loading}
                className="mb-3 w-full"
              >
                Confirmar Alterações
              </CustomButton>

              <CustomButton
                buttonColor={theme.colors.primaryContainer}
                textColor={theme.colors.onPrimaryContainer}
                onPress={() => router.back()}
                className="w-full"
                disabled={loading}
              >
                Cancelar
              </CustomButton>
              <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                  <Dialog.Title>{success ? 'Sucesso' : 'Erro'}</Dialog.Title>
                  <Dialog.Content>
                    <Text variant="bodyMedium">{dialogText}</Text>
                  </Dialog.Content>

                  <CustomButton onPress={hideDialog}>Ok</CustomButton>
                </Dialog>
              </Portal>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
};

export default EditProfile;
