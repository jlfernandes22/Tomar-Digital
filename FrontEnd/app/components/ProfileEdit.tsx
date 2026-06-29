/**
 * EditProfile Screen
 *
 * Allows users to update their personal information (name, city, NIF)
 * and upload a new avatar. It uses multipart/form-data to handle the
 * image file upload alongside text fields.
 */

import {
  ActivityIndicator,
  View,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  Appbar,
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
  TouchableRipple,
} from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';
import { pickImage } from '@/utils/imagePicker';

// Components & Constants
import CustomTextInput from './CustomTextInput';
import CustomButton from './CustomButton';
import LoadingScreen from './LoadingScreen';
import { images } from '@/constants/images';

const EditProfile = () => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  // Initialize state safely with fallbacks in case the user object is partially populated
  const [name, setName] = useState(user?.name || '');
  const [city, setCity] = useState(user?.city || '');
  const [NIF, setNIF] = useState(user?.NIF ? String(user.NIF) : '');
  const [image, setImage] = useState(user?.Avatar || null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState('');
  const [success, setSuccess] = useState(false);

  // --- Effects ---

  /**
   * Syncs local form state if the global AuthContext user object updates.
   * This ensures the form shows the latest data if the profile is updated elsewhere.
   */
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setCity(user.city || '');
      setNIF(user.NIF ? String(user.NIF) : '');
      setImage(user.Avatar || '');
    }
  }, [user]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the form is submitting.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Handlers ---

  /** Opens the device image picker to choose a new avatar. */
  const selecionarAvatar = async () => {
    const status = await pickImage();
    if (status === '') {
      alert(
        t('profile.error_choose_image', {
          defaultValue: 'Precisamos de escolher uma imagem',
        }),
      );
      return;
    }
    setImage(status);
  };

  /** Closes the feedback dialog. Navigates back to Profile if the update was successful. */
  const hideDialog = () => {
    setDialogVisible(false);
    if (success) {
      router.replace('/(tabs)/Profile');
    }
  };

  /** Validates and submits the profile updates using multipart/form-data. */
  const handleEdit = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('city', city);
      if (NIF) formData.append('NIF', NIF);

      // If the image is a local file (from the picker), append it to the form data
      if (
        image &&
        (image.startsWith('file://') || image.startsWith('content://'))
      ) {
        // Platform-specific fix: iOS requires the 'file://' prefix removed for FormData uploads
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
          // Note: 'Content-Type' is intentionally omitted. React Native sets it automatically.
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setDialogText(
          t('profile.success_edit', {
            defaultValue: 'Alteração de dados com sucesso',
          }),
        );
        setDialogVisible(true);

        // Update global auth state so the new data reflects across the app immediately
        updateUser({
          ...user,
          name: data.user.name,
          city: data.user.city,
          NIF: data.user.NIF,
          Avatar: data.user.avatar,
        });

        if (data.user.Avatar) setImage(data.user.Avatar);
      } else {
        setDialogText(
          t('profile.error_server_rejected', {
            defaultValue: 'O servidor rejeitou as alterações.',
          }),
        );
        setDialogVisible(true);
        setSuccess(false);
      }
    } catch (error) {
      console.error(error);
      setDialogText(
        t('common.error_comm_server', {
          defaultValue: 'Ocorreu um erro ao comunicar com o servidor.',
        }),
      );
      setDialogVisible(true);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // --- Early Returns ---
  // Placed after all hooks have been declared.
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('common.back_btn', { defaultValue: 'Voltar' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView
          style={{ flex: 1 }}
          className="p-4"
          edges={['left', 'right']}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <Text
              variant="headlineMedium"
              style={{
                color: theme.colors.primary,
                fontWeight: 'bold',
                marginBottom: 10,
              }}
            >
              {t('profile.edit_profile_info', {
                defaultValue: 'Editar Informações do Perfil',
              })}
            </Text>
            <Divider
              style={{
                backgroundColor: theme.colors.outlineVariant,
                marginBottom: 16,
              }}
            />

            {/* Main Form Container */}
            <View
              className="mx-4 items-center rounded-xl border-2 px-6 py-8"
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                borderColor: theme.colors.outline,
              }}
            >
              {/* Avatar Section */}
              <View className="mb-2 w-full flex-col items-center justify-center">
                <View
                  className="h-32 w-32 items-center justify-center rounded-full border-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.outline,
                    alignSelf: 'center',
                  }}
                >
                  {!image ? (
                    <Text
                      className="text-4xl font-bold uppercase"
                      style={{ color: theme.colors.primary }}
                    >
                      {(user.name || user.email || 'V').charAt(0)}
                    </Text>
                  ) : (
                    <Image
                      source={{
                        // Determine if the image is a local file (from picker) or a remote URL (from server)
                        uri:
                          image.startsWith('file://') ||
                          image.startsWith('content://')
                            ? image
                            : `${API_URL}${image}`,
                      }}
                      className="h-32 w-32 items-center justify-center rounded-full border-2"
                      style={{
                        backgroundColor: theme.colors.background,
                        borderColor: theme.colors.outline,
                      }}
                    />
                  )}
                </View>

                {/* Edit Avatar Button */}
                <TouchableRipple
                  className="relative bottom-8 left-11 size-11"
                  onPress={selecionarAvatar}
                  rippleColor={theme.colors.secondary}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={t('accessibility.change_profile_photo', {
                    defaultValue: 'Alterar fotografia de perfil',
                  })}
                  accessibilityHint={t('accessibility.choose_new_image_hint', {
                    defaultValue:
                      'Clica para escolher uma nova imagem para o teu perfil',
                  })}
                  style={{
                    borderColor: theme.colors.outline,
                    borderRadius: 50,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: theme.colors.secondaryContainer,
                    borderWidth: 2,
                  }}
                >
                  {/*
                   * The `key` prop forces React to unmount and remount the Image when the theme changes.
                   * This is a workaround to ensure the tintColor updates correctly when switching between Light/Dark mode.
                   */}
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

              {/* Input Fields */}
              <View className="mt-6 w-full">
                <CustomTextInput
                  value={name}
                  onChangeText={setName}
                  label={t('profile.name_label', { defaultValue: 'Nome' })}
                  className="mb-4 w-full"
                />

                <CustomTextInput
                  label={t('profile.city_label', { defaultValue: 'Cidade' })}
                  value={city}
                  onChangeText={setCity}
                  className="mb-4 w-full"
                />

                {/* Only show NIF input if the user hasn't set one yet */}
                {user.NIF == null && (
                  <CustomTextInput
                    label={t('profile.nif_label', { defaultValue: 'NIF' })}
                    value={NIF}
                    onChangeText={setNIF}
                    isNIF
                    className="mb-4 w-full"
                  />
                )}
              </View>

              {/* Action Buttons & Feedback Dialog */}
              <View className="mt-6 w-full">
                <CustomButton
                  buttonColor={theme.colors.errorContainer}
                  textColor={theme.colors.onErrorContainer}
                  onPress={handleEdit}
                  loading={loading}
                  className="mb-3 w-full"
                  accessibilityLabel={t(
                    'accessibility.confirm_profile_changes',
                    { defaultValue: 'Confirmar alterações ao perfil' },
                  )}
                  accessibilityHint={t('accessibility.save_info_hint', {
                    defaultValue: 'Clica para guardar as tuas informações',
                  })}
                >
                  {t('profile.confirm_changes', {
                    defaultValue: 'Confirmar Alterações',
                  })}
                </CustomButton>

                <CustomButton
                  buttonColor={theme.colors.primaryContainer}
                  textColor={theme.colors.onPrimaryContainer}
                  onPress={() => router.back()}
                  className="w-full"
                  disabled={loading}
                  accessibilityLabel={t('accessibility.cancel_profile_edits', {
                    defaultValue: 'Cancelar edições ao perfil',
                  })}
                  accessibilityHint={t('accessibility.discard_changes_hint', {
                    defaultValue:
                      'Clica para descartar as alterações e voltar atrás',
                  })}
                >
                  {t('common.cancel', { defaultValue: 'Cancelar' })}
                </CustomButton>

                {/* Success/Error Dialog */}
                <Portal>
                  <Dialog
                    visible={dialogVisible}
                    onDismiss={hideDialog}
                    style={{ backgroundColor: theme.colors.surface }}
                  >
                    <Dialog.Title
                      style={{
                        color: success
                          ? theme.colors.primary
                          : theme.colors.error,
                        fontWeight: 'bold',
                      }}
                    >
                      {success
                        ? t('common.success_alert', { defaultValue: 'Sucesso' })
                        : t('common.error_alert', { defaultValue: 'Erro' })}
                    </Dialog.Title>

                    <Dialog.Content>
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurfaceVariant }}
                      >
                        {dialogText}
                      </Text>
                    </Dialog.Content>

                    <Dialog.Actions>
                      <CustomButton
                        onPress={hideDialog}
                        accessibilityLabel={t('accessibility.close_message', {
                          defaultValue: 'Fechar mensagem',
                        })}
                      >
                        {t('common.ok', { defaultValue: 'OK' })}
                      </CustomButton>
                    </Dialog.Actions>
                  </Dialog>
                </Portal>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Surface>
    </>
  );
};

export default EditProfile;
