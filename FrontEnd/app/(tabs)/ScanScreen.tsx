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
import { delay } from "../../utils/delay";
import CustomSnackBar from "../components/CustomSnackBar";
import { useTheme, Checkbox, Dialog, Portal, Button } from "react-native-paper";

export default function ScanScreen() {
  const theme = useTheme();
  const { user, updateUser } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [loading, setLoading] = useState(false);
  const [scannedQr, setScannedQr] = useState<string | null>(null);
  
  // Estados para gerir os Termos e Condições
  const [acceptedTerms, setAcceptedTerms] = useState(user?.acceptedInvoiceTerms || false);
  const [termsDialogVisible, setTermsDialogVisible] = useState(false);

  const isProcessing = useRef(false);
  const cameraRef = useRef<any>(null);
  const qrTimeoutRef = useRef<any>(null);
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState(false);

  // Sincroniza o estado local com o AuthContext caso mude externamente
  useEffect(() => {
    setAcceptedTerms(user?.acceptedInvoiceTerms || false);
  }, [user?.acceptedInvoiceTerms]);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  // Limpa o temporizador ao desmontar o componente
  useEffect(() => {
    return () => {
      if (qrTimeoutRef.current) {
        clearTimeout(qrTimeoutRef.current);
      }
    };
  }, []);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View
        className="flex-1 justify-center items-center p-6"
        style={{ backgroundColor: theme.colors.background }}
      >
        <Text className="text-center mb-4">
          Precisamos de acesso à câmara para ler o QR Code.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="p-4 rounded-xl"
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="font-bold" style={{ color: theme.colors.onPrimary }}>
            Dar Permissão
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScanned = ({ type, data }: any) => {
    if (isProcessing.current) return;
    setScannedQr(data);

    // Reinicia o temporizador de expiração do QR Code (sugestão temporária)
    if (qrTimeoutRef.current) {
      clearTimeout(qrTimeoutRef.current);
    }

    qrTimeoutRef.current = setTimeout(() => {
      setScannedQr(null);
    }, 1500);
  };

  const handleConfirmTerms = async () => {
    setTermsDialogVisible(false);

    // Se houve alteração no consentimento em relação ao que está guardado
    if (acceptedTerms !== user?.acceptedInvoiceTerms) {
      try {
        const response = await fetch(`${API_URL}/aceitarTermosFatura`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ acceptedInvoiceTerms: acceptedTerms }),
        });

        const result = await response.json();

        if (response.ok) {
          updateUser({ acceptedInvoiceTerms: acceptedTerms });
          setMessage(acceptedTerms ? "Termos de fatura aceites" : "Consentimento de termos revogado");
          setVisibility(true);
        } else {
          // Reverte o estado visual para sincronizar com o do contexto em caso de falha
          setAcceptedTerms(user?.acceptedInvoiceTerms || false);
          setMessage(`Erro ao atualizar termos: ${result.message || "Tente novamente"}`);
          setVisibility(true);
        }
      } catch (error) {
        console.error("Erro ao atualizar termos no servidor:", error);
        // Reverte o estado visual em caso de falha de ligação
        setAcceptedTerms(user?.acceptedInvoiceTerms || false);
        setMessage("Falha ao comunicar com o servidor para atualizar termos.");
        setVisibility(true);
      }
    }
  };

  const handleTakeAndSend = async () => {
    if (isProcessing.current) return;
    if (!acceptedTerms) {
      setTermsDialogVisible(true);
      return;
    }

    isProcessing.current = true;
    setLoading(true);

    try {
      if (!cameraRef.current) {
        throw new Error("Câmara não inicializada.");
      }

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo) {
        throw new Error("Falha ao capturar a imagem da fatura.");
      }

      const formData = new FormData();
      formData.append('ReceiptImage', {
        uri: photo.uri,
        type: 'image/jpeg',
        name: 'fatura.jpg',
      } as any);
      formData.append('QRCodeData', scannedQr || '');

      const response = await fetch(`${API_URL}/lerFatura`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        updateUser({ Points: result.saldoAtual ?? result.novoSaldoTotal });

        setMessage(
          `Sucesso!\nGanhaste ${result.pontosGanhos}€ de saldo!\nNovo saldo: ${result.saldoAtual}€`
        );
        setVisibility(true);
        await delay(1500);
        router.replace("/(tabs)/Home");
      } else {
        setMessage(`Erro\n${result.message || result.erro || "Falha na validação"}`);
        setVisibility(true);
        isProcessing.current = false;
      }
    } catch (error: any) {
      console.error(error);
      setMessage(`Erro\n${error.message || "Falha na ligação ao servidor"}`);
      setVisibility(true);
      isProcessing.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1"
      style={{ backgroundColor: theme.colors.background }}
    >
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        onBarcodeScanned={handleBarcodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Container Principal sobre a câmara */}
      <View className="flex-1 justify-between">
        
        {/* Topo: Instruções Únicas */}
        <View
          className="mt-14 mx-4 p-4 rounded-2xl"
          style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
        >
          <Text className="text-white text-center text-sm font-semibold leading-5">
            Por favor, tire uma fotografia à fatura inteira. Certifique-se de que o seu NIF, o NIF da empresa e o QR Code estão bem visíveis.
          </Text>
        </View>

        {/* Centro: Retângulo de Enquadramento Dinâmico */}
        <View className="flex-1 p-8">
          <View
            className={`flex-1 border-4 rounded-3xl ${
              scannedQr ? 'border-solid opacity-80' : 'border-dashed opacity-40'
            }`}
            style={{
              borderColor: scannedQr ? theme.colors.primary : '#ffffff',
            }}
          />
        </View>

        {/* Base: Painel de Controlo */}
        <View
          className="px-6 py-8 rounded-t-3xl items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.85)' }}
        >
          
          {/* Gestão dos Termos e Condições (Link Discreto) */}
          <TouchableOpacity 
            onPress={() => setTermsDialogVisible(true)}
            className="mb-6"
          >
            <Text className="text-gray-400 text-xs underline text-center">
              {acceptedTerms ? "Termos e Condições Aceites (Rever)" : "Ler e Aceitar os Termos e Condições"}
            </Text>
          </TouchableOpacity>

          {/* Botão de Captura (Shutter) */}
          <View className="items-center justify-center">
            <TouchableOpacity
              onPress={handleTakeAndSend}
              disabled={!acceptedTerms || loading}
              className="w-20 h-20 rounded-full justify-center items-center"
              style={{
                backgroundColor: (acceptedTerms && !loading)
                  ? theme.colors.primary
                  : 'rgba(255, 255, 255, 0.2)',
                borderWidth: 4,
                borderColor: '#ffffff',
              }}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <View
                  className="w-14 h-14 rounded-full bg-white"
                  style={{
                    opacity: acceptedTerms ? 0.9 : 0.4,
                  }}
                />
              )}
            </TouchableOpacity>
            
            {/* Texto auxiliar inferior */}
            <Text 
              className="font-bold text-[10px] tracking-widest uppercase mt-4"
              style={{ color: acceptedTerms ? theme.colors.primary : '#aaaaaa' }}
            >
              Tirar Foto e Enviar
            </Text>
          </View>
        </View>
      </View>

      {/* DIALOG: Termos e Condições */}
      <Portal>
        <Dialog 
          visible={termsDialogVisible} 
          onDismiss={() => setTermsDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            Termos e Condições
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
              Para garantir a validade e combater a fraude, a imagem capturada da sua fatura 
              será enviada e analisada automaticamente pelo nosso servidor para extrair e validar 
              o seu NIF, o NIF do estabelecimento e o Código ATCUD.
            </Text>
            
            <View className="flex-row items-center border p-3 rounded-lg border-gray-300/30">
              <Checkbox.Android
                status={acceptedTerms ? "checked" : "unchecked"}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
                color={theme.colors.primary}
              />
              <Text 
                className="flex-1 ml-2 text-sm" 
                style={{ color: theme.colors.onSurface }}
                onPress={() => setAcceptedTerms(!acceptedTerms)}
              >
                Li e consinto a partilha e processamento de dados para esta validação.
              </Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button 
              onPress={handleConfirmTerms}
              textColor={theme.colors.primary}
            >
              {acceptedTerms ? "Confirmar" : "Fechar"}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Indicador de carregamento em ecrã inteiro */}
      {loading && (
        <View
          className="absolute inset-0 justify-center items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text className="text-white mt-4 font-bold text-base">
            A processar fatura de forma segura...
          </Text>
        </View>
      )}

      <CustomSnackBar
        visible={visibility}
        onDismiss={() => setVisibility(false)}
        message={message}
      />
    </View>
  );
}
