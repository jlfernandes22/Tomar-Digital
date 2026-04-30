import { ActivityIndicator, View, Image, ScrollView } from "react-native";
import React, { useState } from "react";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { images } from "@/constants/images";
import {
  Surface,
  Text,
  TouchableRipple,
  useTheme,
  Menu,
  IconButton,
  Divider,
} from "react-native-paper";
import CustomButton from "./CustomButton";
import { SafeAreaView } from "react-native-safe-area-context";

const roleLabels: Record<string, string> = {
  cidadao: "Cidadão",
  comerciante: "Comerciante",
  camara: "Câmara Municipal",
};

const ProfileDetails = () => {
  const theme = useTheme();
  const { logout, user } = useAuth();

  // 1. Criar o estado para controlar se o Menu está aberto ou fechado
  const [menuVisible, setMenuVisible] = useState(false);

  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right"]}
    >
      {!user ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: 20,
            alignItems: "center",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Menu de Opções no Canto Superior Direito */}
          <View className="w-full flex-row justify-end mt-4 mb-2">
            <Menu
              visible={menuVisible}
              onDismiss={closeMenu}
              anchor={
                <IconButton
                  icon={({ size }) => (
                    <Image
                      source={images.settingsImg} // <-- NOTA: Garante que tens esta imagem no images.ts!
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
                  router.push("/components/EditProfile");
                }}
                leadingIcon="pencil"
                title="Editar Perfil"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                }}
                leadingIcon="account"
                title="Ser Comerciante"
              />
              <Divider />
              <Menu.Item
                onPress={() => {
                  closeMenu();
                }}
                leadingIcon={({ size }) => (
                  <Image
                    source={images.preferencesImg} // <-- NOTA: Garante que tens esta imagem no images.ts!
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
                  closeMenu();
                  logout();
                }}
                leadingIcon="logout"
                title="Terminar Sessão"
                titleStyle={{ color: theme.colors.error }}
              />
            </Menu>
          </View>

          {/* Avatar */}
          <View
            className="w-32 h-32 border-2 rounded-full items-center justify-center mb-3"
            style={{
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.outline,
            }}
          >
            <Text style={{ fontSize: 40 }}>
              {(user.name || user.email || "V").charAt(0)}
            </Text>
          </View>

          {/* NOME */}
          <Text style={{ fontWeight: "bold" }} className="text-xl mb-2">
            {user.name}
          </Text>

          {/* Role */}
          <View
            className="p-2 rounded-full border-2 mb-2"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            <Text
              style={{ color: theme.colors.onBackground }}
              className="text-base text-center"
            >
              {roleLabels[user.role] || "Utilizador"}
            </Text>
          </View>

          {/* Saldo */}
          <View
            className=" w-full py-6 rounded-xl mt-5 border-2 items-center px-4"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
            accessible={true}
            accessibilityLabel={`Pontos disponíveis: ${user.Points}`}
          >
            <Text
              style={{ fontWeight: "bold" }}
              className="text-lg uppercase tracking-widest mb-1 text-center"
            >
              Pontos Disponíveis
            </Text>
            <Text
              style={{ fontWeight: "bold" }}
              className="text-5xl mb-6 text-center"
            >
              {!isNaN(Number(user.Points)) ? `${Number(user.Points)}` : "0"}
            </Text>

            <CustomButton
              onPress={() => router.replace("/(tabs)/ScanScreen")}
              className="w-full mt-2 shadow-md"
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              accessibilityRole="button"
              accessibilityLabel="Ler QR-Code de fatura"
              icon={images.qrCodeImg}
            >
              Ler QR-Code
            </CustomButton>
            <View className="items-center mt-4">
              <Text style={{ fontWeight: "300" }} className="text-center mb-2">
                Acumula pontos por cada compra efetuada nas lojas aderentes de
                Tomar
              </Text>
              <Text
                style={{ color: theme.colors.onSurface, fontWeight: "bold" }}
                className="text-base text-center"
              >
                - Necessário Contribuinte -
              </Text>
            </View>
          </View>

          {/* E-mail */}
          <View
            className=" w-full flex-row p-3 rounded-xl mt-5 border-2 items-center px-4"
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
              <Text style={{ fontWeight: "bold", fontSize: 15 }}>
                Endereço de E-mail
              </Text>
              <Text
                style={{ fontWeight: "bold", fontSize: 13 }}
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
