import {
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { images } from "@/constants/images";
import CustomButton from "../components/CustomButton";
import CustomTextField from "../components/CustomTextInput";
import { delay } from "../../utils/delay";
import CustomSnackBar from "../components/CustomSnackBar";
import { useTheme, Surface } from "react-native-paper";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const theme = useTheme();

  const handleLogin = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/iniciarSessao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      console.log(`${API_URL}/iniciarSessao`);

      const dados = await response.json();

      if (response.ok) {
        setSnackbarMessage("Sucesso!");
        setSnackbarVisible(true);
        await delay(500);

        const idEncontrado = dados.userId;
        const roleEncontrado = dados.role || dados.userRole || dados.user?.role;
        const tokenEncontrado = dados.token;
        const emailEncontrado = dados.user?.email || email;
        const saldoEncontrado = dados.user?.Points || 0;
        const nomeEncontrado = dados.user?.name || email;
        const cidadeEncontrada = dados.user?.city;
        const NIFEncontrado = dados.user?.NIF;

        if (idEncontrado && tokenEncontrado) {
          await login(
            idEncontrado,
            roleEncontrado,
            tokenEncontrado,
            emailEncontrado,
            saldoEncontrado,
            nomeEncontrado,
            cidadeEncontrada,
            NIFEncontrado,
          );
          router.replace("/(tabs)/Home");
        }
      } else {
        setLoading(false);
        setSnackbarMessage("Erro no Login, " + dados.message);
        setSnackbarVisible(true);
      }
    } catch (error) {
      setLoading(false);
      setSnackbarMessage("Erro: Não foi possível contactar o servidor.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View className="flex-1">
      {/* Imagem de Fundo */}
      <Image
        source={images.backgroundLogin}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* OVERLAY ESCURO FIXO: Garante que a imagem escurece sempre, removendo a névoa branca */}
      <View
        className="absolute w-full h-full"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      />

      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingBottom: 30,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="w-[90%] self-center">
                {/* CARTÃO DO FORMULÁRIO: Isola os inputs num fundo sólido legível */}
                <Surface
                  elevation={2}
                  style={{
                    backgroundColor: theme.colors.surfaceContainer,
                    padding: 32,
                    borderRadius: theme.roundness === 0 ? 0 : 24, // Fica quadrado nos Tabuleiros, redondo nos restantes
                  }}
                >
                  <Text
                    className="mb-8 text-center text-4xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    Iniciar Sessão
                  </Text>

                  <CustomTextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    isEmail
                    className="mb-5"
                  />

                  <CustomTextField
                    label="Palavra-passe"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    className="mb-8"
                  />

                  <CustomButton onPress={handleLogin} loading={loading}>
                    Iniciar Sessão
                  </CustomButton>
                </Surface>
              </View>
            </TouchableWithoutFeedback>
          </ScrollView>

          <CustomSnackBar
            visible={snackbarVisible}
            message={snackbarMessage}
            onDismiss={() => setSnackbarVisible(false)}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
};

export default Login;
