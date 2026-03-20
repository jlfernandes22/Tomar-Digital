import { ActivityIndicator, View, Image, ScrollView } from "react-native";
import React from "react";
import { router } from "expo-router"; // Simplificado, apenas o router chega
import { useAuth } from "@/context/AuthContext";
import { images } from "@/constants/images";
import { Surface, Text, TouchableRipple, useTheme } from "react-native-paper";
import CustomButton from "./CustomButton";

const roleLabels: Record<string, string> = {
  cidadao: "Cidadão",
  comerciante: "Comerciante",
  camara: "Câmara Municipal",
};

const ProfileDetails = () => {
  const { logout, user } = useAuth();
  const theme = useTheme();

  if (!user) return <ActivityIndicator size="large" color="#7c3aed" />;

  return (
    <Surface style={{ flex: 1 }}>
      {/* 2. o ScrollView para ecrãs pequenos */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
          alignItems: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Botão Editar Perfil*/}
        <View className="w-full flex-row justify-end mt-4 mb-2">
          <TouchableRipple
            key={theme.dark ? "dark-theme" : "light-theme"}
            onPress={() => router.replace("/(tabs)/editProfile")}
            style={{
              padding: 6,
              borderRadius: 26,
              borderWidth: 2,
              backgroundColor: theme.colors.background,
              borderColor: theme.colors.outline,
            }}
            accessibilityRole="button"
            accessibilityLabel="Editar informações do meu perfil"
          >
            <Image
              className="size-6"
              source={images.editProfileImg}
              accessibilityElementsHidden={true}
              tintColor={theme.colors.onBackground}
              importantForAccessibility="no-hide-descendants"
            />
          </TouchableRipple>
        </View>

        {/* Avatar */}
        <View
          className="w-32 h-32 border-2 rounded-full items-center justify-center mb-3"
          style={{
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.outline,
          }}
        >
          <Text className="text-primary text-4xl font-bold uppercase">
            {(user.name || user.email || "V").charAt(0)}
          </Text>
        </View>

        {/* NOME */}
        <Text
          style={{ color: theme.colors.primary, fontWeight: "bold" }}
          className="text-xl mb-2"
        >
          {user.email.split("@")[0]}
        </Text>

        {/* Role */}
        <View
          className="p-2 rounded-full border-2 mb-2"
          style={{
            backgroundColor: theme.colors.background,
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
            backgroundColor: theme.colors.background,
            borderColor: theme.colors.outline,
          }}
          accessible={true}
          accessibilityLabel={`Pontos disponíveis: ${Number(user.saldo).toFixed(2)}`}
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
            {!isNaN(Number(user.saldo))
              ? `${Number(user.saldo).toFixed(2)}`
              : "0.00"}
          </Text>

          <CustomButton
            onPress={() => router.replace("/(tabs)/qrcode")}
            className="w-full mt-2 shadow-md"
            buttonColor="#EF4444" // Este é o código hexadecimal exato do bg-red-500 do Tailwind
            accessibilityRole="button"
            accessibilityLabel="Ler QR-Code de fatura"
            // Passamos a imagem diretamente para a propriedade icon do seu CustomButton
            icon={() => (
              <Image
                className="w-8 h-8" // O size-8 às vezes falha aqui dentro, w-8 h-8 é mais seguro
                source={images.qrCodeImg}
                accessibilityElementsHidden={true}
                importantForAccessibility="no"
              />
            )}
          >
            Ler QR-Code
          </CustomButton>
          <View className="items-center mt-4">
            <Text style={{ fontWeight: "300" }} className="text-center mb-2">
              Acumula pontos por cada compra efetuada nas lojas aderentes de
              Tomar
            </Text>
            <Text
              style={{ color: theme.colors.error, fontWeight: "bold" }}
              className="text-base text-center"
            >
              - Necessário Contribuinte -
            </Text>
          </View>
        </View>

        {/* e-mail */}
        <View
          className="w-full mt-5 flex-row items-center p-3"
          style={{
            backgroundColor: theme.colors.background,
            borderWidth: 2,
            borderColor: theme.colors.outline,
          }}
        >
          <Image
            className="size-14 bg-convento-200 rounded-lg"
            source={images.emailImg}
            accessibilityElementsHidden={true}
            importantForAccessibility="no-hide-descendants"
          />
          <View className="flex-col ml-4 flex-1">
            <Text style={{ fontWeight: "bold" }}>Endereço de E-mail</Text>
            <Text className="font-bold text-base" numberOfLines={1}>
              {user.email}
            </Text>
          </View>
        </View>

        {/* Botão Logout */}
        <CustomButton
          onPress={logout}
          className="w-full mt-10 mb-6 shadow-md"
          buttonColor={theme.colors.error}
          accessibilityRole="button"
          accessibilityLabel="Terminar sessão e sair da conta"
        >
          Terminar Sessão
        </CustomButton>
      </ScrollView>
    </Surface>
  );
};

export default ProfileDetails;
