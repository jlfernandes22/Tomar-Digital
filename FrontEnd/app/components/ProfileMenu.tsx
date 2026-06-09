import { ActivityIndicator, View, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { images } from '@/constants/images';
import {
  Surface,
  Text,
  TouchableRipple,
  Menu,
  IconButton,
  Divider,
} from 'react-native-paper';
import CustomButton from './CustomButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { useAppTheme } from '@/context/ThemeContext';

const roleLabels: Record<string, string> = {
  cidadao: 'Cidadão',
  comerciante: 'Comerciante',
  camara: 'Câmara Municipal',
};

const ProfileDetails = () => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { logout, user } = useAuth();

  // 1. Criar o estado para controlar se o Menu está aberto ou fechado
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      {!user ? (
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
            alignItems: 'center',
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Menu de Opções no Canto Superior Direito */}
          <View className="mb-2 mt-4 w-full flex-row items-center justify-end gap-2">
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon={({ size }) => (
                    <Image
                      source={images.settingsImg}
                      style={{
                        width: size,
                        height: size,
                        tintColor: theme.colors.onBackground,
                      }}
                    />
                  )}
                  mode="outlined"
                  size={24}
                  onPress={openMenu}
                  accessible={true}
                  accessibilityLabel={t('accessibility.open_settings', {
                    defaultValue: 'Abrir menu de definições',
                  })}
                  accessibilityHint={t('accessibility.account_options_hint', {
                    defaultValue: 'Clica para ver as opções da conta',
                  })}
                  style={{
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.background,
                    borderWidth: 2,
                  }}
                />
              }
            >
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  router.push('/components/ProfileEdit');
                }}
                leadingIcon="pencil"
                title={t('profile.edit_profile', {
                  defaultValue: 'Editar Perfil',
                })}
              />
              <Divider />
              {user.role === 'cidadao' && (
                <Menu.Item
                  onPress={() => {
                    closeMenu();
                    router.push('/components/MerchantForm');
                  }}
                  leadingIcon="account"
                  title={t('profile.become_merchant', {
                    defaultValue: 'Ser Comerciante',
                  })}
                />
              )}

              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  router.push('/components/Preferences');
                }}
                leadingIcon={({ size }) => (
                  <Image
                    source={images.preferencesImg}
                    style={{
                      width: size,
                      height: size,
                      tintColor: theme.colors.onSurfaceVariant,
                    }}
                  />
                )}
                title={t('profile.preferences', {
                  defaultValue: 'Preferências',
                })}
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  router.push('/components/AppAbout');
                }}
                leadingIcon="information-outline"
                title={t('profile.about_app', { defaultValue: 'Sobre a App' })}
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                }}
                leadingIcon="delete"
                title={t('profile.delete_account', {
                  defaultValue: 'Apagar Conta',
                })}
                titleStyle={{ color: theme.colors.error }}
              />
              <Divider />

              <Menu.Item
                onPress={() => {
                  logout();
                  closeMenu();
                }}
                leadingIcon="logout"
                title={t('profile.logout', { defaultValue: 'Terminar Sessão' })}
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {/* Avatar */}
          <View
            className="mb-3 h-32 w-32 items-center justify-center rounded-full border-2"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.outline,
            }}
          >
            {!user.Avatar && (
              <Text
                className="text-4xl font-bold uppercase"
                style={{ color: theme.colors.primary }}
              >
                {(user.name || user.email || 'V').charAt(0)}
              </Text>
            )}

            {user.Avatar && (
              <Image
                source={{
                  uri:
                    user.Avatar.startsWith('file://') ||
                    user.Avatar.startsWith('content://')
                      ? user.Avatar
                      : `${API_URL}${user.Avatar}`, // <-- LÊ O FICHEIRO DIRETAMENTE DO SERVIDOR!
                }}
                className="h-32 w-32 items-center justify-center rounded-full border-2"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                }}
              />
            )}
          </View>

          {/* NOME */}
          <Text style={{ fontWeight: 'bold' }} className="mb-2 text-xl">
            {user.name}
          </Text>

          {/* Role */}
          <View
            className="mb-2 rounded-full border-2 p-2"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            <Text
              style={{ color: theme.colors.onBackground }}
              className="text-center text-base"
            >
              {t(`roles.${user.role}`, {
                defaultValue: roleLabels[user.role] || 'Utilizador',
              })}
            </Text>
          </View>

          {/* Saldo */}
          <View
            className=" mt-5 w-full items-center rounded-xl border-2 px-4 py-6"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
            accessible={true}
            accessibilityLabel={t('accessibility.available_points_value', {
              points: user.Points,
              defaultValue: `Pontos disponíveis: ${user.Points}`,
            })}
          >
            <Text
              style={{ fontWeight: 'bold' }}
              className="mb-1 text-center text-lg uppercase tracking-widest"
            >
              {t('profile.available_points', {
                defaultValue: 'Pontos Disponíveis',
              })}
            </Text>
            <Text
              style={{ fontWeight: 'bold' }}
              className="mb-6 text-center text-5xl"
            >
              {!isNaN(Number(user.Points)) ? `${Number(user.Points)}` : '0'}
            </Text>

            <CustomButton
              onPress={() => router.replace('/(tabs)/ScanScreen')}
              className="mt-2 w-full shadow-md"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              accessibilityRole="button"
              accessibilityLabel={t('accessibility.scan_invoice_qr', {
                defaultValue: 'Ler QR-Code de fatura',
              })}
              accessibilityHint={t('accessibility.open_camera_invoice', {
                defaultValue: 'Clica para abrir a câmara e ler a fatura',
              })}
              icon={images.qrCodeImg}
            >
              {t('profile.scan_qr', { defaultValue: 'Ler QR-Code' })}
            </CustomButton>
            <View className="mt-4 items-center">
              <Text style={{ fontWeight: '300' }} className="mb-2 text-center">
                {t('profile.accumulate_points_desc', {
                  defaultValue:
                    'Acumula pontos por cada compra efetuada nas lojas aderentes de Tomar',
                })}
              </Text>
              <Text
                style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                className="text-center text-base"
              >
                {t('profile.vat_required', {
                  defaultValue: '- Necessário Contribuinte -',
                })}
              </Text>
            </View>
          </View>

          {/* E-mail */}
          <View
            className=" mt-5 w-full flex-row items-center rounded-xl border-2 p-3 px-4"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            <Image
              style={{
                width: 44,
                height: 44,
              }}
              source={images.emailImg}
              tintColor={theme.colors.onSecondaryContainer}
              accessibilityElementsHidden={true}
              importantForAccessibility="no-hide-descendants"
            />
            <View style={{ marginLeft: 20 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 15 }}>
                {t('profile.email_address', {
                  defaultValue: 'Endereço de E-mail',
                })}
              </Text>
              <Text
                style={{ fontWeight: 'bold', fontSize: 13 }}
                numberOfLines={1}
              >
                {user.email}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default ProfileDetails;
