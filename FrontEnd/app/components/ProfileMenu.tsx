import { ActivityIndicator, View, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Menu, IconButton, Divider } from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';
import { images } from '@/constants/images';

// Components
import CustomButton from './CustomButton';

// --- Constants ---
// Maps internal role keys to display names. Defined outside the component
// to prevent recreation on every render.
const roleLabels: Record<string, string> = {
  cidadao: 'Cidadão',
  comerciante: 'Comerciante',
  camara: 'Câmara Municipal',
};

/**
 * ProfileMenu Component (Profile Screen)
 *
 * Displays the user's profile information, including avatar, role, and points balance.
 * It also serves as the central hub for account management (editing profile, preferences,
 * applying to be a merchant, and logging out) via a dropdown menu.
 */
const ProfileDetails = () => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { logout, user } = useAuth();

  // --- State ---
  // Controls the visibility of the React Native Paper Menu component.
  // The Menu requires a boolean state to know when to show/hide relative to its anchor.
  const [menuVisible, setMenuVisible] = useState(false);

  // --- Handlers ---
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // Centralized navigation handler to keep the JSX clean
  const navigateTo = (path: string) => {
    closeMenu();
    router.push(path);
  };

  // --- Early Return (Loading State) ---
  // If the user object isn't loaded yet (e.g., during initial app startup), show a spinner.
  if (!user) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['top', 'left', 'right']}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // --- Render ---
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings Menu (Top Right) */}
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
              onPress={() => navigateTo('/components/ProfileEdit')}
              leadingIcon="pencil"
              title={t('profile.edit_profile', {
                defaultValue: 'Editar Perfil',
              })}
            />
            <Divider />

            {/* Role-specific menu item: Only citizens can apply to become merchants */}
            {user.role === 'cidadao' && (
              <>
                <Menu.Item
                  onPress={() => navigateTo('/components/MerchantForm')}
                  leadingIcon="account"
                  title={t('profile.become_merchant', {
                    defaultValue: 'Ser Comerciante',
                  })}
                />
                <Divider />
              </>
            )}

            <Menu.Item
              onPress={() => navigateTo('/components/Preferences')}
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
              title={t('profile.preferences', { defaultValue: 'Preferências' })}
            />
            <Divider />

            <Menu.Item
              onPress={() => navigateTo('/components/AppAbout')}
              leadingIcon="information-outline"
              title={t('profile.about_app', { defaultValue: 'Sobre a App' })}
            />
            <Divider />

            {/* Destructive actions are visually highlighted using the theme's error color */}
            <Menu.Item
              onPress={closeMenu}
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

        {/* User Avatar */}
        <View
          className="mb-3 h-32 w-32 items-center justify-center rounded-full border-2"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.outline,
          }}
        >
          {!user.Avatar ? (
            // Fallback: Show the first letter of the user's name or email
            <Text
              className="text-4xl font-bold uppercase"
              style={{ color: theme.colors.primary }}
            >
              {(user.name || user.email || 'V').charAt(0)}
            </Text>
          ) : (
            <Image
              source={{
                // Asset/Platform Logic: Determine if the avatar URI is a local file
                // (recently picked from the gallery) or a remote path from the backend server.
                uri:
                  user.Avatar.startsWith('file://') ||
                  user.Avatar.startsWith('content://')
                    ? user.Avatar
                    : `${API_URL}${user.Avatar}`,
              }}
              className="h-32 w-32 items-center justify-center rounded-full border-2"
              style={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.outline,
              }}
            />
          )}
        </View>

        {/* User Name */}
        <Text style={{ fontWeight: 'bold' }} className="mb-2 text-xl">
          {user.name}
        </Text>

        {/* User Role Badge */}
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

        {/* Points & Gamification Section */}
        <View
          className="mt-5 w-full items-center rounded-xl border-2 px-4 py-6"
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
            {/* Ensure points are displayed as a valid number, fallback to 0 */}
            {!isNaN(Number(user.Points)) ? `${Number(user.Points)}` : '0'}
          </Text>

          {/* Primary CTA: Scan Invoice QR Code */}
          <CustomButton
            onPress={() => router.replace('/components/ScanScreen')}
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

        {/* Email Address Card */}
        <View
          className="mt-5 w-full flex-row items-center rounded-xl border-2 p-3 px-4"
          style={{
            backgroundColor: theme.colors.secondaryContainer,
            borderColor: theme.colors.outline,
          }}
        >
          <Image
            style={{ width: 44, height: 44 }}
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
    </SafeAreaView>
  );
};

export default ProfileDetails;
