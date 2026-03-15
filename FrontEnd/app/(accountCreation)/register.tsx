import {
  Image,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Snackbar, TextInput } from "react-native-paper";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { router } from "expo-router";
import { images } from "@/constants/images";
import { delay } from "@/app/utils/delay";
import CustomButton from "../components/CustomButton";
import CustomTextField from "../components/CustomTextInput";
import CustomSnackBar from "../components/CustomSnackBar";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("");
  const [city, setCity] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleRegister = async () => {
    // 1. Validação local antes de incomodar o servidor!
    if (!email || !password) {
      setSnackbarMessage(
        "Aviso: Por favor, preencha pelo menos email, password.",
      );
      setSnackbarVisible(true);
      return;
    }

    if (password !== confirmPassword) {
      console.log(password, confirmPassword);
      setSnackbarMessage("Aviso: As palavras-passe não coincidem!");
      setSnackbarVisible(true);
      return;
    }

    try {
      // 2. Enviar dados (normalmente não se envia o confirmPassword para a API)
      const response = await fetch(`${API_URL}/registar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
          confirmPassword: confirmPassword,
          city: city,
        }),
      });

      const dados = await response.json();

      if (response.ok) {
        setSnackbarMessage("Sucesso: A redirecionar...");
        setSnackbarVisible(true);
        await delay(500);

        router.replace("/login");
      } else {
        setSnackbarMessage(
          "Erro: " + dados.message || "Erro: Não foi possível criar a conta.",
        );
        setSnackbarVisible(true);
      }
    } catch (err) {
      setSnackbarMessage("Erro de Rede. Verifique a sua ligação à internet.");
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
      <View className="absolute w-full h-full bg-convento-900/60" />

      <SafeAreaView className="flex-1 bg-transparent">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "android" ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1 w-[85%] self-center pt-10 space-y-4">
                <Text className="mb-10 text-center text-5xl font-bold text-neutral-300">
                  Criar conta
                </Text>

                {/* Campo do email*/}
                <CustomTextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  isEmail
                  className="mb-[2rem]"
                />

                {/* Campo da cidade*/}
                <CustomTextField
                  label="Cidade (Ex: Tomar)"
                  value={city}
                  onChangeText={setCity}
                  className="mb-[2rem]"
                />

                {/* Campo da palavra-passe*/}
                <CustomTextField
                  label="Palavra-passe"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  className="mb-[2rem]"
                />

                {/* Confirmar Password */}
                <CustomTextField
                  label="Comfirmar Palavra-passe"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                  className="mb-[2rem]"
                />

                {/* Botão de Registo */}
                <CustomButton
                  onPress={handleRegister}
                  buttonColor="#FF8533"
                  className="mt-8"
                >
                  Criar Conta
                </CustomButton>
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
