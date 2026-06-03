import React, { useEffect, useState } from "react";
import { View, FlatList, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { router, Stack } from 'expo-router';
import { 
  ActivityIndicator, 
  Surface, 
  Text, 
  useTheme, 
  Button, 
  TouchableRipple, 
  Divider
} from "react-native-paper";

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
    try {
      const response = await fetch(`${API_URL}/candidaturasCampanha`, {
        headers: { 
          "Authorization": `Bearer ${user?.token}`,
          "Content-Type": "application/json"
        },
      });
      const data = await response.json();
      setCandidaturas(data);
    } catch (err) {
      console.error("Erro ao carregar:", err);
      Alert.alert("Erro", "Não foi possível carregar as candidaturas.");
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
      // Aqui está a correção: usar 'acao' em vez de 'action' ou 'status'
      body: JSON.stringify({ 
        businessId, 
        campaignId, 
        acao: novoStatus 
      }) 
    });

    const data = await response.json();
    
    if (response.ok) {
      setCandidaturas(prev => prev.filter(c => 
        !(c.businessId === businessId && c.campaignId === campaignId)
      ));
      Alert.alert("Sucesso", `Candidatura ${novoStatus} com sucesso!`);
    } else {
      Alert.alert("Erro", data.message || "Erro ao processar");
    }
  } catch (err) {
    console.error("Erro na decisão:", err);
  }
  
};

  useEffect(() => { carregarCandidaturas(); }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
        <Stack.Screen options={{ headerShown: false }} />
      <Text
              variant="headlineMedium"
              style={{
                color: theme.colors.primary,
                fontWeight: "bold",
                margin: 10,
              }}
            >
              Novas Candidaturas a Campanhas
            </Text>
            <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />
      {loading ? (
        <ActivityIndicator size="large" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={candidaturas}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={carregarCandidaturas} />}
          keyExtractor={(item) => `${item.businessId}-${item.campaignId}`}
          renderItem={({ item }) => (
            <Surface style={{ marginBottom: 12, borderRadius: 8 }} elevation={2}>
              <TouchableRipple  
                onPress={() => router.push({
                  pathname: "/components/DetalhesBusiness",
                  params: { businessId: item.businessId, campaignId: item.campaignId }
                })}
                rippleColor="rgba(150, 150, 150, 0.2)"
              >
                <View style={{ padding: 16 }}>
                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{item.businessName}</Text>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Campanha: {item.campaignTitle}
                  </Text>
                  <Text variant="labelSmall" style={{ marginTop: 8, color: theme.colors.outline }}>
                    Data: {new Date(item.requestDate).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableRipple>

              <View style={{ flexDirection: "row", padding: 16, paddingTop: 0, gap: 10 }}>
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
          ListEmptyComponent={<Text style={{ textAlign: "center", marginTop: 20 }}>Não existem candidaturas pendentes.</Text>}
        />
      )}
    </SafeAreaView>
  );
}