import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import QRCode from 'react-native-qrcode-svg';
import { API_URL } from "@/constants/api";
import { Picker } from '@react-native-picker/picker';
import { useAuth } from "@/context/AuthContext";

export default function PurchaseCode() {
  const { user } = useAuth();

  const [showBusinessDropdown, setShowBusinessDropdown] = useState(false);
  

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

  return (
    <SafeAreaView className="flex-1 bg-tomar-50">
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 24 }}
      >
        <Text className="text-3xl font-bold text-primary text-center mb-8">
          Nova Venda
        </Text>

         {/* DROPDOWN  DE NEGÓCIO  */}
        <View className="mb-6">
          <Text className="text-primary mb-2 text-center font-medium">Em qual loja está?</Text>
          
      
          <TouchableOpacity
            onPress={() => setShowBusinessDropdown(!showBusinessDropdown)}
            className="bg-white border-2 border-tomar-300 rounded-2xl px-4 py-4 flex-row justify-between items-center shadow-sm"
          >
            <Text className="text-primary text-base">
            {lojaSelecionadaId 
              ? (listaNegocios.find((n: any) => n._id === lojaSelecionadaId) as any)?.name 
              : "Selecione uma loja..."}
            </Text>
           
           <Text className="text-tomar-300 text-xs">
          {showBusinessDropdown ? "▲" : "▼"}
          </Text>
          </TouchableOpacity>

          {/* Lista de Opções (Visível apenas quando showBusinessDropdown é true) */}
          {showBusinessDropdown && (
            <View className="mt-2 border-2 border-tomar-100 rounded-2xl bg-white overflow-hidden shadow-lg">
              {listaNegocios.map((n: any) => (
                <TouchableOpacity
                  key={n._id}
                  onPress={() => {
                    setLojaSelecionadaId(n._id);
                    setQrToken(null);
                    setShowBusinessDropdown(false); // Fecha ao selecionar
                  }}
                  className={`px-4 py-4 border-b border-gray-100 ${lojaSelecionadaId === n._id ? 'bg-tomar-50' : ''}`}
                >
                  <Text className={`${lojaSelecionadaId === n._id ? 'text-tomar-600 font-bold' : 'text-gray-700'}`}>
                    {n.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* INPUT DE VALOR */}
        <View className="mb-6">
          <Text className="text-primary mb-2 text-center">Valor Total da Compra (€)</Text>
          <TextInput
            className="bg-white border-2 border-tomar-300 p-5 rounded-2xl text-4xl font-bold text-tomar-800 text-center"
            placeholder="0.00"
            placeholderTextColor="#D2B5A3"
            keyboardType="numeric"
            value={amount}
            onChangeText={(v) => {
              setAmount(v);
              setQrToken(null);
            }}
            accessibilityLabel="Valor total da compra em euros"
          />
        </View>

        {/* BOTÃO GERAR QR */}
        <TouchableOpacity
          onPress={handleGenerateQR}
          disabled={loading}
          className="bg-brand-600 p-5 rounded-2xl items-center shadow-md active:bg-tomar-800"
          accessibilityRole="button"
          accessibilityLabel="Gerar código QR para atribuição de saldo"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Gerar QR Code de Saldo</Text>
          )}
        </TouchableOpacity>

        {/* QR CODE GERADO */}
        {qrToken && (
          <View className="mt-10 items-center p-8 bg-white rounded-3xl border-2 border-tomar-200 shadow-sm">
            <View className="p-4 bg-white rounded-xl">
              <QRCode 
                value={qrToken} 
                size={220} 
                color="#2D1F16" 
                backgroundColor="transparent" 
              />
            </View>
            
            <View className="mt-6 items-center">
              <Text className="text-2xl font-bold text-primary">
                Bónus: <Text className="text-brand-600">{estimatedBonus}€</Text>
              </Text>
              <Text className="text-tomar-600 text-sm mt-1 font-medium text-center">
                O cidadão deve ler este código agora
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}