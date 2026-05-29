import {
  ActivityIndicator,
  View,
  Image,
  ScrollView,
  Dimensions,
  Platform,
} from "react-native";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { images } from "@/constants/images";
import {
  Dialog,
  Divider,
  Portal,
  Surface,
  Text,
  TouchableRipple,
  useTheme,
} from "react-native-paper";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import * as ImagePicker from 'expo-image-picker';


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
      setImage(user.Avatar || "");
    }
  }, [user]);

  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const [image, setImage] = useState(user.Avatar || null);
  const [visible, setvisible] = useState(false);
  const [message, setMessage] = useState("");

  const selecionarAvatar = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Precisamos de acesso às tuas fotos para carregares o logótipo da campanha!');
        return;
      }
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });
  
      if (!resultado.canceled) {
          const uri = resultado.assets[0].uri;
          setImage(uri); 
        }
    };

  const hideDialog = async () => {
    setDialogVisible(false);
    if (success) {
      router.replace("/(tabs)/Profile");
    }
  };

  const handleEdit = async () => {
  setLoading(true);
  try {
    let avatarIdDefinitivo = null;

    if (image && (image.startsWith('file://') || image.startsWith('content://'))) {
     const formData = new FormData();

     const uriLimpa = Platform.OS === 'android' ? image : image.replace('file://', '');
      const filename = image.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

       const fileToUpload = {
        uri: uriLimpa,
        name: filename,
        type: type,
      };

      formData.append('image', fileToUpload as any);

      const uploadResponse = await fetch(`${API_URL}/uploadImage`, {
        method: "POST",
        body: formData,
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Accept': 'application/json',
        },
      });


      if (!uploadResponse.ok) {
        const erroBackend = await uploadResponse.text();
        console.error("Erro detalhado do backend:", erroBackend);
        throw new Error("Falha ao fazer upload da imagem de perfil.");
      }

      const uploadResult = await uploadResponse.json();
      avatarIdDefinitivo = uploadResult.id; // ID que o MongoDB gerou para a imagem
    }

    const response = await fetch(`${API_URL}/editarUser/${user.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name,
        city: city,
        NIF: NIF ? Number(NIF) : null,
        avatarId: avatarIdDefinitivo, 
      }),
    });

    if (response.ok) {
      const data = await response.json();
      setSuccess(true);
      setDialogText("Alteração de dados com sucesso");
      setDialogVisible(true);
      

      updateUser({
        ...user,
        name: name,
        city: city,
        NIF: NIF ? Number(NIF) : null,
        Avatar: avatarIdDefinitivo || user.Avatar 
      });
    } else {
      setDialogText("O servidor rejeitou as alterações.");
      setDialogVisible(true);
      setSuccess(false);
    }
  } catch (error) {
    console.error(error);
    setDialogVisible(true);
    setSuccess(false);
  } finally {
    setLoading(false);
  }
};

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
              fontWeight: "bold",
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
            className=" items-center mx-4 py-8 px-6 rounded-xl border-2"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderColor: theme.colors.outline,
            }}
          >
            {/* Zona da Imagem */}
            <View className=" mb-2 w-full items-center justify-center flex-col">
              <View
                className="w-32 h-32 rounded-full items-center justify-center border-2"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                  alignSelf: "center",
                }}
              >
                {!image && (
                  <Text className="text-4xl font-bold uppercase" style={{ color: theme.colors.primary }}>
                    {(user.name || user.email || "V").charAt(0)}
                  </Text>
                )}
                {image && (
                <Image
                  source={{ 
                    uri: image.startsWith('file://') || image.startsWith('content://')
                      ? image                                 
                      : `${API_URL}/mostrarImagem/${image}`   
                  }}
                  className="w-32 h-32 rounded-full items-center justify-center border-2"
                  style={{
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.outline,
                  }}
                />
              )}
              </View>


              <TouchableRipple
                className="relative size-11 bottom-8 left-11"
                onPress={selecionarAvatar}
                rippleColor={theme.colors.secondary}
                style={{
                  borderColor: theme.colors.outline,
                  borderRadius: 50,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.secondaryContainer,
                  borderWidth: 2,
                }}
              >
                <Image
                  key={theme.dark ? "dark-theme" : "light-theme"}
                  className="m-2 size-8"
                  tintColor={theme.colors.onSecondaryContainer}
                  source={images.editProfileImg}
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                />
              </TouchableRipple>
            </View>
            <View className="w-full mt-6">
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
                buttonColor={theme.colors.errorContainer}
                textColor={theme.colors.onErrorContainer}
                onPress={handleEdit}
                loading={loading}
                className="w-full mb-3"
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
