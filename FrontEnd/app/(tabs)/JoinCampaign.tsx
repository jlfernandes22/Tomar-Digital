import React, { useEffect, useState } from "react";
import { View, ScrollView, FlatList } from "react-native";
import {
  ActivityIndicator,
  Card,
  Chip,
  Divider,
  Surface,
  Text,
  useTheme,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import DetalhesCampanha from "@/app/components/DetalhesCampanha";

export default function JoinCampaign() {
  const { user } = useAuth();
  const [ListCampaign, setListCampaign] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  const handleOpenDetails = (campaign: any) => {
    setSelectedCampaign(campaign);
    setShowDetails(true);
  };

  
  

  const fetchCampaigns = async () => {
  setLoading(true); 
  
  try {
    const isComerciante = user?.role === "comerciante"; 
    
    const url = isComerciante 
      ? `${API_URL}/campanhas/comerciante-disponiveis` 
      : `${API_URL}/listaCampanhas`;

    const config: RequestInit = isComerciante ? {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${user?.token}` 
      }
    } : {
      method: "GET"
    };

    console.log("A buscar campanhas em:", url);
    const response = await fetch(url, config);
        console.log("Resposta da API:", response);

    const dados = await response.json();
    setListCampaign(dados);

  } catch (error) {
    console.error("Erro fatal no fetchCampaigns:", error);
    setListCampaign([]); 
  } finally {
    setLoading(false);
  }
};

  const renderItem = ({ item }: { item: any }) => (
    <Card
      style={{ marginBottom: 16, marginHorizontal: 4, marginTop: 16 }}
      onPress={() => handleOpenDetails(item)}
    >
      <Card.Content>
        <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
          {String(item.titulo || "Sem título")}
        </Text>

        <Text variant="bodyMedium" style={{ marginTop: 8 }}>
          {String(item.descricao || "Sem descrição")}
        </Text>

        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            justifyContent: "space-between",
          }}
        >
          <Text variant="labelSmall">
            Expira:{" "}
            {item.DataExpiracao
              ? new Date(item.DataExpiracao).toLocaleDateString()
              : "N/A"}
          </Text>

          <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
            Ver mais...
          </Text>
        </View>
      </Card.Content>
    </Card>
  );

  useEffect(() => {
    fetchCampaigns();
  }, []);

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, paddingHorizontal: 16 }}>
        {/* 1. Título  */}
        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: "bold",
            marginBottom: 10,
          }}
        >
          Juntar-me a uma Campanha
        </Text>

        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        {/* 2.  Lista */}
        {loading ? (
          <ActivityIndicator
            animating={true}
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={ListCampaign}
            renderItem={renderItem}
            keyExtractor={(item) => item._id?.toString()}
            contentContainerStyle={{ paddingBottom: 20 }}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20 }}>
                Não há campanhas disponíveis de momento.
              </Text>
            }
          />
        )}

        {/* 3.Modal */}
       {showDetails && selectedCampaign && (
        <DetalhesCampanha
          visible={showDetails}
          campaign={selectedCampaign}
          onClose={() => {
              setShowDetails(false);
              setSelectedCampaign(null); // Limpa a seleção ao fechar
          }}
        />
      )}
      </SafeAreaView>
    </Surface>
  );
}
