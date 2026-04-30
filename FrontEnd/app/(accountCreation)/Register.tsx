import {
  Image,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { router } from "expo-router";
import { images } from "@/constants/images";
import { delay } from "../../utils/delay";
import CustomButton from "../components/CustomButton";
import CustomTextField from "../components/CustomTextInput";
import CustomSnackBar from "../components/CustomSnackBar";
import { useTheme, Surface } from "react-native-paper";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const theme = useTheme();

  const handleRegister = async () => {
    if (!email || !password) {
      setSnackbarMessage(
        "Aviso:\nPor favor, preencha pelo menos email e password.",
      );
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      setSnackbarMessage("Aviso:\nAs palavras-passe não coincidem!");
      setSnackbarVisible(true);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/registar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword, city }),
      });

      const dados = await response.json();

      if (response.ok) {
        setSnackbarMessage("Sucesso:\nA redirecionar...");
        setSnackbarVisible(true);
        await delay(500);
        router.replace("/Login");
      } else {
        setSnackbarMessage(
          "Erro:\n" + (dados.message || "Não foi possível criar a conta."),
        );
        setSnackbarVisible(true);
      }
    } catch (err) {
      setSnackbarMessage("Erro:\nVerifique a sua ligação à internet.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View className="flex-1">
      <Image
        source={images.backgroundRegister}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      {/* OVERLAY ESCURO FIXO */}
      <View
        className="absolute w-full h-full"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
      />

      <SafeAreaView className="flex-1 bg-transparent">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              paddingBottom: 40,
            }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="w-[90%] self-center py-10">
                <Surface
                  elevation={2}
                  style={{
                    backgroundColor: theme.colors.surfaceContainer,
                    padding: 32,
                    borderRadius: theme.roundness === 0 ? 0 : 24,
                  }}
                >
                  <Text
                    className="mb-8 text-center text-4xl font-bold"
                    style={{ color: theme.colors.primary }}
                  >
                    Criar conta
                  </Text>

                  <CustomTextField
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    isEmail
                    className="mb-5"
                  />

                  <CustomTextField
                    label="Cidade (Ex: Tomar)"
                    value={city}
                    onChangeText={setCity}
                    className="mb-5"
                  />

                  <CustomTextField
                    label="Palavra-passe"
                    value={password}
                    onChangeText={setPassword}
                    isPassword
                    className="mb-5"
                  />

                  <CustomTextField
                    label="Confirmar Palavra-passe"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    isPassword
                    className="mb-8"
                  />

                  <CustomButton onPress={handleRegister}>
                    Criar Conta
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

export default Register;
