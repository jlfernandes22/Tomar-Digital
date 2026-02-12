import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from "@/constants/api";
import { Picker } from '@react-native-picker/picker';
import { useAuth } from "@/context/AuthContext";

export default function PurchaseCode() {
  const { user } = useAuth();

  const [listaNegocios, setListaNegocios] = useState([]);
  const [lojaSelecionadaId, setLojaSelecionadaId] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrToken, setQrToken] = useState(null);
  const [estimatedBonus, setEstimatedBonus] = useState(0);

 
  useEffect(() => {
    const fetchLojas = async () => {
      const res = await fetch(`${API_URL}/meusNegocios`, {
        headers: { "Authorization": `Bearer ${user?.token}` }
      });
      const data = await res.json();
      if (res.ok && data.length > 0) {
        setListaNegocios(data);
        setLojaSelecionadaId(data[0]._id); // Define a primeira loja como padrão
      }
    };
    fetchLojas();
  }, []);

  const handleGenerateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Erro", "Insira um valor de venda válido.");
      return;
    }
    const body = {
      valorOriginal: parseFloat(amount),
      lojaId: lojaSelecionadaId, 
    };
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/gerarQrCode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          valorOriginal: parseFloat(amount),
          lojaId: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setQrToken(data.token);
        setEstimatedBonus(data.saldoParaOCliente);
      } else {
        Alert.alert("Erro", data.message || "Falha ao gerar código.");
      }
    } catch (error) {
      Alert.alert("Erro", "Ligação ao servidor falhou.");
    } finally {
      setLoading(false);
    }
  };

  return (<SafeAreaView className="flex-1 bg-white p-6">
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold mb-6">Nova Venda</Text>

        {/* DROPDOWN DE SELEÇÃO DE NEGÓCIO */}
        <View className="mb-6">
          <Text className="text-gray-600 font-medium mb-2">Em qual loja está?</Text>
          <View className="border border-gray-200 rounded-2xl bg-gray-50 overflow-hidden">
            <Picker
              selectedValue={lojaSelecionadaId}
              onValueChange={(itemValue) => {
                setLojaSelecionadaId(itemValue);
                setQrToken(null); // Esconde o QR se mudar de loja
              }}
            >
              {listaNegocios.map((n: any) => (
                <Picker.Item key={n._id} label={n.name} value={n._id} />
              ))}
            </Picker>
          </View>
        </View>

        {/* INPUT DE VALOR */}
        <View className="mb-6">
          <Text className="text-gray-600 font-medium mb-2">Valor Total da Compra (€)</Text>
          <TextInput
            className="bg-white border-2 border-purple-100 p-4 rounded-2xl text-3xl font-bold text-purple-600"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setQrToken(null);
            }}
          />
        </View>

        <TouchableOpacity
          onPress={handleGenerateQR}
          className="bg-purple-600 p-5 rounded-2xl items-center shadow-lg shadow-purple-200"
        >
          {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold text-lg">Gerar QR Code de Saldo</Text>}
        </TouchableOpacity>

        {/* QR CODE GERADO */}
        {qrToken && (
          <View className="mt-10 items-center p-6 bg-purple-50 rounded-3xl border border-purple-100">
            <QRCode value={qrToken} size={200} color="#6b21a8" backgroundColor="transparent" />
            <Text className="mt-4 text-xl font-bold text-purple-900">Bónus: {estimatedBonus}€</Text>
            <Text className="text-purple-400 text-xs">O cidadão deve ler este código agora</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}