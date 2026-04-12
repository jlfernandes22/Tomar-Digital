import { ActivityIndicator, View, Image, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { images } from "@/constants/images";
import { Dialog, Portal, Surface, Text, useTheme } from "react-native-paper";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import delay from "../utils/delay";

const EditProfile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [city, setCity] = useState(user?.city || "");
  const [NIF, setNIF] = useState(user?.NIF ? String(user.NIF) : "");
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogText, setDialogText] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setCity(user.city || "");
      setNIF(user.NIF ? String(user.NIF) : "");
    }
  }, [user]);

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  const hideDialog = async () => {
    setDialogVisible(false);
    if (success) {
      router.replace("/(tabs)/Profile");
    }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/editar/${user.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          city: city,
          NIF: NIF ? Number(NIF) : null,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        //console.log(success);
        setDialogText("Alteração de dados com sucesso");
        setDialogVisible(true);
        updateUser({
          name: name,
          city: city,
          NIF: NIF ? Number(NIF) : null,
        });
      } else {
        setDialogText("O servidor rejeitou as alterações.");
        setDialogVisible(true);
        setSuccess(false);
      }
    } catch (error) {
      setDialogText("Falha na ligação ao servidor.");
      setDialogVisible(true);
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    //Flex-1 na Surface e SafeAreaView para ocuparem o ecrã todo
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* ScrollView adicionada para ecrãs pequenos e para quando o teclado abre */}
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cabeçalho */}
          <View className="items-center mt-6 mb-8 px-6">
            <Text variant="headlineSmall">Editar Informações do Perfil</Text>
          </View>

          {/* Contentor Principal do Formulário*/}
          <View
            className=" items-center mx-4 py-8 px-6 rounded-xl border-2"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            {/* Zona da Imagem */}
            <View className="relative mb-2">
              <View
                className="w-32 h-32 rounded-full items-center justify-center"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                  borderWidth: 2,
                }}
              >
                <Text className="text-primary text-4xl font-bold uppercase">
                  {(user.name || user.email || "V").charAt(0)}
                </Text>
              </View>

              {/* Será trocado por uma touchable opacity para poder trocar foto de perfil */}
              <View
                className="absolute bottom-0 right-2  rounded-full border-2 "
                style={{
                  padding: 4,
                  borderRadius: 26,
                  borderWidth: 2,
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                }}
              >
                <Image
                  key={theme.dark ? "dark-theme" : "light-theme"}
                  className="size-4"
                  tintColor={theme.colors.onBackground}
                  source={images.editProfileImg}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
              </View>
            </View>
            <Text className="text-center mb-8" variant="bodyLarge">
              Mudar a Foto de Perfil
            </Text>

            <View className="w-full">
              <CustomTextInput
                value={name}
                onChangeText={setName}
                label="Nome"
                className="w-full mb-4"
              />

              <CustomTextInput
                label="Cidade"
                value={city}
                onChangeText={setCity}
                className="w-full mb-4"
              />

              {user.NIF == null && (
                <CustomTextInput
                  label="NIF"
                  value={NIF}
                  onChangeText={setNIF}
                  isNIF
                  className="w-full mb-4"
                />
              )}
            </View>

            <View className="w-full mt-6">
              <CustomButton
                buttonColor={theme.colors.error}
                textColor={theme.colors.onError}
                onPress={handleEdit}
                loading={loading}
                className="w-full mb-3"
              >
                Confirmar Alterações
              </CustomButton>

              <CustomButton
                buttonColor={theme.colors.onBackground}
                textColor={theme.colors.onPrimary}
                onPress={() => router.replace("/(tabs)/Profile")}
                className="w-full"
                disabled={loading}
              >
                Cancelar
              </CustomButton>
              <Portal>
                <Dialog visible={dialogVisible} onDismiss={hideDialog}>
                  <Dialog.Title>{success ? "Sucesso" : "Erro"}</Dialog.Title>
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
