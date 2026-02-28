import React, { useState, useEffect , useRef} from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";

export default function ScanScreen() {
  const { user } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const delay = (ms) => new Promise(resolve => setTimeout(resolve,ms));

  const isProcessing = useRef(false);
    const { updateUser } = useAuth();

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
        <Text className="text-center mb-4">Precisamos de acesso à câmara para ler o QR Code.</Text>
        <TouchableOpacity onPress={requestPermission} className="bg-purple-600 p-4 rounded-xl">
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
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ QRCodeData: data }), 
      });

      const result = await response.json();

      if (response.ok) {
        updateUser({ saldo: result.novoSaldoTotal });
        Alert.alert(
          "Sucesso!",
          `Ganhaste ${result.valorGanho}€ de saldo!\nNovo saldo: ${result.novoSaldoTotal}€`,
          [{ text: "OK", onPress: () => {
            isProcessing.current = false;
            router.push("/home") } }]
        );
      } else {
        Alert.alert("Erro", result.message || "Não foi possível validar este código.");
        isProcessing.current = false;
        await delay(3000)
        setScanning(true)
        setLoading(false)
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na ligação ao servidor.")
      isProcessing.current = false;
      await delay(3000)
      setScanning(true)
      setLoading(false)
    } finally {
      setLoading(false)
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
          <Text className="text-white mt-4 font-bold">A processar o teu saldo...</Text>
        </View>
      )}

      {/* Botão para resetar o scanner se necessário */}
      {!scanning && !loading && (
        <TouchableOpacity 
          onPress={() => setScanning(true)}
          className="absolute bottom-10 self-center bg-white p-4 rounded-full"
        >
          <Text className="text-purple-600 font-bold">Tentar Novamente</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}