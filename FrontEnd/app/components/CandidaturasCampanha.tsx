import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, Surface, Text, useTheme, Divider, Button } from "react-native-paper";

interface Candidatura {
  businessId: string;
  businessName: string;
  campaignId: string;
  campaignTitle: string;
  requestDate: string;
}

export default function CandidaturasCampanha() {
  const [candidaturas, setCandidaturas] = useState<Candidatura[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();
  const theme = useTheme();

  const carregarCandidaturas = async () => {
    setRefreshing(true); // Se estiver a refrescar
    try {
      const response = await fetch(`${API_URL}/candidaturasCampanha`, {
        headers: { 
          "Authorization": `Bearer ${user?.token}`,
          "Content-Type": "application/json"
        },
      });

      // LÊ O CORPO DA RESPOSTA MESMO EM ERRO
      const responseData = await response.text(); 
      console.log("Status da resposta:", response.status);
      console.log("Corpo da resposta:", responseData);

     

      const data = JSON.parse(responseData);
      setCandidaturas(data);
      
    } catch (err) {
      console.error("Erro detalhado ao carregar:", err);
      Alert.alert("Erro", "Não foi possível carregar as candidaturas. Verifique o console.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
const handleDecidir = async (businessId: string, campaignId: string, novoStatus: string) => {
  try {
    const response = await fetch(`${API_URL}/decidirAdesaoCampanha`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user?.token}`
      },
      body: JSON.stringify({ businessId, campaignId, status: novoStatus })
    });

    if (response.ok) {
      const data = await response.json();
      
      // LOG DE VERIFICAÇÃO (Como pediste)
      console.log("Estado do negócio após decisão:", data.business);

      // ESTA LINHA FAZ O ITEM DESAPARECER DO ECRÃ INSTANTANEAMENTE
      setCandidaturas(prev => prev.filter(c => 
        !(c.businessId === businessId && c.campaignId === campaignId)
      ));
      
      Alert.alert("Sucesso", `Candidatura ${novoStatus} com sucesso!`);
    } else {
      Alert.alert("Erro", "Não foi possível processar a decisão.");
    }
  } catch (err) {
    console.error("Erro na decisão:", err);
  }
};

  useEffect(() => { carregarCandidaturas(); }, []);

  return (
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <Text variant="headlineSmall" style={{ marginBottom: 16 }}>Candidaturas Pendentes</Text>
      
      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={candidaturas}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={carregarCandidaturas} />}
          keyExtractor={(item, index) => `${item.businessId}-${item.campaignId}`}
          renderItem={({ item }) => (
            <Surface style={{ padding: 16, marginBottom: 12, borderRadius: 8 }} elevation={2}>
              <Text variant="titleMedium">{item.businessName}</Text>
              <Text variant="bodyMedium">Campanha: {item.campaignTitle}</Text>
              <Text variant="labelSmall" style={{ marginTop: 8, color: theme.colors.outline }}>
                Data do pedido: {new Date(item.requestDate).toLocaleDateString()}
              </Text>
              
              <View style={{ flexDirection: "row", marginTop: 16, gap: 10 }}>
                <Button 
                  mode="contained" 
                  onPress={() => handleDecidir(item.businessId, item.campaignId, "aprovado")}
                  style={{ flex: 1, backgroundColor: theme.colors.primary }}
                >
                  Aprovar
                </Button>
                <Button 
                  mode="outlined" 
                  onPress={() => handleDecidir(item.businessId, item.campaignId, "rejeitado")}
                  style={{ flex: 1 }}
                >
                  Rejeitar
                </Button>
              </View>
            </Surface>
          )}
          ListEmptyComponent={<Text style={{ textAlign: "center" }}>Não existem candidaturas pendentes.</Text>}
        />
      )}
    </SafeAreaView>
  );
}