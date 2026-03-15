import {
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  StyleSheet,
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
import { delay } from "@/app/utils/delay";
import CustomSnackBar from "../components/CustomSnackBar";

const Login = () => {
  //Guardar os estados das variáveis que queremos obter para fazer o login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { login } = useAuth();

  const handleLogin = async () => {
    try {
      console.log("tentar conectar ao servidor");

      const response = await fetch(`${API_URL}/iniciarSessao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const dados = await response.json();

      if (response.ok) {
        setSnackbarMessage("Sucesso!");
        setSnackbarVisible(true);
        await delay(500);
        const idEncontrado = dados.userId;
        const roleEncontrado = dados.role || dados.userRole || dados.user?.role;
        const tokenEncontrado = dados.token;

        const emailEncontrado = dados.user?.email || email; // se a API não devolver, usa o do estado
        const saldoEncontrado = dados.user?.saldo || 0;
        const nomeEncontrado = dados.user?.name || email;
        const cidadeEncontrada = dados.user?.city;
        const NIFEncontrado = dados.user?.NIF;

        if (idEncontrado && tokenEncontrado) {
          console.log({
            idEncontrado,
            roleEncontrado,
            tokenEncontrado,
            emailEncontrado,
            saldoEncontrado,
            nomeEncontrado,
            cidadeEncontrada,
            NIFEncontrado,
          });
          // Chamada corrigida com os 5 argumentos na ordem certa:
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

          router.replace("/(tabs)/search");
        }
      } else {
        setSnackbarMessage("Erro no Login, " + dados.message);
        setSnackbarVisible(true);
      }
    } catch (error) {
      console.error(error);
      setSnackbarMessage("Erro: Não foi possível contactar o servidor.");
      setSnackbarVisible(true);
    }
  };

  return (
    <View className="flex-1">
      <Image
        source={images.backgroundLogin}
        className="absolute w-full h-full"
        resizeMode="cover"
      />

      <View className="absolute w-full h-full bg-convento-900/60" />
      <SafeAreaView className="flex-1 bg-transparent">
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          // No iOS usamos padding, no Android usamos height para ele empurrar o ecrã
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
              <View className="w-[85%] self-center">
                <Text className="mb-10 text-center text-5xl font-bold text-neutral-300">
                  Iniciar Sessão
                </Text>

                {/* Campo Email */}
                <CustomTextField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  isEmail
                  className="mb-[2rem]"
                />

                {/* Campo Palavra-passe */}
                <CustomTextField
                  label="Palavra-passe"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                  className="mb-[2rem]"
                />

                {/* Botão */}
                <View className="mt-8">
                  <CustomButton onPress={handleLogin} buttonColor="#FF8533">
                    Iniciar Sessão
                  </CustomButton>
                </View>
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

const styles = StyleSheet.create({});
