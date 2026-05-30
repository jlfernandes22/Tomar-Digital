import { ActivityIndicator, View, Image, ScrollView } from 'react-native';
import React, { useState } from 'react';
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
          <View className="mb-2 mt-4 w-full flex-row justify-end">
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
                  router.push('/components/EditProfile');
                }}
                leadingIcon="pencil"
                title="Editar Perfil"
              />
              <Divider />
              {user.role === 'cidadao' && (
                <Menu.Item
                  onPress={() => {
                    closeMenu();
                    router.push('/components/SerComerciante');
                  }}
                  leadingIcon="account"
                  title="Ser Comerciante"
                />
              )}

              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
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
                title="Preferências"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                  router.push('/components/SobreAPP');
                }}
                leadingIcon="information-outline"
                title="Sobre a App"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                }}
                leadingIcon="delete"
                title="Apagar Conta"
                titleStyle={{ color: theme.colors.error }}
              />
              <Divider />

              <Menu.Item
                onPress={() => {
                  logout();
                  closeMenu();
                }}
                leadingIcon="logout"
                title="Terminar Sessão"
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
                source={{ uri: `${API_URL}/mostrarImagem/${user.Avatar}` }}
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
              {roleLabels[user.role] || 'Utilizador'}
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
            accessibilityLabel={`Pontos disponíveis: ${user.Points}`}
          >
            <Text
              style={{ fontWeight: 'bold' }}
              className="mb-1 text-center text-lg uppercase tracking-widest"
            >
              Pontos Disponíveis
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
              accessibilityLabel="Ler QR-Code de fatura"
              icon={images.qrCodeImg}
            >
              Ler QR-Code
            </CustomButton>
            <View className="mt-4 items-center">
              <Text style={{ fontWeight: '300' }} className="mb-2 text-center">
                Acumula pontos por cada compra efetuada nas lojas aderentes de
                Tomar
              </Text>
              <Text
                style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
                className="text-center text-base"
              >
                - Necessário Contribuinte -
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
                Endereço de E-mail
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
