import {
  ActivityIndicator,
  View,
  Image,
  ScrollView,
  Dimensions,
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
  useTheme,
} from 'react-native-paper';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import { pickImage } from '@/utils/imagePicker';

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [NIF, setNIF] = useState(user?.NIF ? String(user.NIF) : '');
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCity(user.city || '');
      setNIF(user.NIF ? String(user.NIF) : '');
    }
  }, [user]);

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const [image, setImage] = useState<string | null>(null);
  const [visible, setvisible] = useState(false);
  const [message, setMessage] = useState('');

  const avatar = async () => {
    try {
      const uri = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      // Se o utilizador escolheu uma imagem (e como não é múltipla, sabemos que é string)
      if (uri && typeof uri === 'string') {
        setImage(uri);
      }
    } catch (error: any) {
      // O utilitário tratou das permissões, nós só mostramos o erro!
      alert(error.message);
    }
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
      const response = await fetch(`${API_URL}/editarUser/${user.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          city: city,
          NIF: NIF ? Number(NIF) : null,
          file: image,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        //console.log(success);
        setDialogText('Alteração de dados com sucesso');
        setDialogVisible(true);
        updateUser({
          name: name,
          city: city,
          NIF: NIF ? Number(NIF) : null,
        });
      } else {
        setDialogText('O servidor rejeitou as alterações.');
        setDialogVisible(true);
        setSuccess(false);
      }
    } catch (error) {
      setDialogText('Falha na ligação ao servidor.');
      setDialogVisible(true);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    //Flex-1 na Surface e SafeAreaView para ocuparem o ecrã todo
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
                    source={{ uri: image }}
                    className="h-32 w-32 items-center justify-center rounded-full border-2"
                    style={{
                      backgroundColor: theme.colors.background,
                      borderColor: theme.colors.outline,
                    }}
                  ></Image>
                )}
              </View>

              {/* Será trocado por uma touchable opacity para poder trocar foto de perfil */}

              <TouchableRipple
                className="relative bottom-8 left-11 size-11"
                onPress={pickImage}
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
