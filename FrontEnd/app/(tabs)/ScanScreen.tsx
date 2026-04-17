import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
import { delay } from "@/app/utils/delay";
import CustomSnackBar from "../components/CustomSnackBar";

export default function ScanScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false); // NÃO abre o scanner de imediato
  const [loading, setLoading] = useState(false);

  const isProcessing = useRef(false);
  const { updateUser } = useAuth();
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState(false);

  //  permissão ao abrir o ecrã
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) return <View />; // A carregar permissões

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center p-6 bg-white">
        <Text className="text-center mb-4">
          Precisamos de acesso à câmara para ler o QR Code.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-purple-600 p-4 rounded-xl"
        >
          <Text className="text-white font-bold">Dar Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = async ({ type, data }: any) => {
    //contéudo do QRCODE vem com o formato A:...*B:....*, que será processado pelo servidor
    //Alert.alert(
    //  "QR Code Lido!",
    //  `Conteúdo: ${data}`,
    //  [{ text: "OK" }]
    //);
    //await delay(4000)
    //console.log(data)
    if (isProcessing.current) return;
    isProcessing.current = true;
    setScanning(false);
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/lerFatura`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ QRCodeData: data }),
      });

      const result = await response.json();

      if (response.ok) {
        updateUser({ Points: result.novoSaldoTotal });

        setMessage(
          `Sucesso\nGanhaste ${result.pontosGanhos}€ de saldo!\nNovo saldo: ${result.saldoAtual}€`,
        );

        setVisibility(true);
        await delay(1000);
        router.replace("/(tabs)/Home");
      } else {
        setMessage(`Erro\n${result.message}`);

        setVisibility(true);
        isProcessing.current = false;
        await delay(3000);
        setScanning(true);
        setLoading(false);
      }
    } catch (error) {
      setMessage("Erro\nFalha na ligação ao servidor");
      setVisibility(true);
      isProcessing.current = false;
      await delay(3000);
      setScanning(true);
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Interface Visual do Scanner */}
      <View className="flex-1 justify-center items-center">
        <View className="w-64 h-64 border-2 border-white rounded-3xl opacity-60 mb-10" />
        <Text className="text-white font-bold text-lg bg-black/50 p-2 rounded-lg">
          Aponte para o QR Code da Fatura
        </Text>
      </View>

      {loading && (
        <View className="absolute inset-0 bg-black/70 justify-center items-center">
          <ActivityIndicator size="large" color="#9333ea" />
          <Text className="text-white mt-4 font-bold">
            A processar o teu saldo...
          </Text>
        </View>
      )}

      {/* Botão para resetar o scanner se necessário */}
      {!scanning && !loading && (
        <TouchableOpacity
          onPress={() => setScanning(true)}
          className="absolute bottom-10 self-center bg-white p-4 rounded-full"
        >
          <Text className="text-warning-500 font-bold">Tentar Novamente</Text>
        </TouchableOpacity>
      )}

      <CustomSnackBar
        visible={visibility}
        onDismiss={() => setVisibility(false)}
        message={message}
      />
    </View>
  );
}
