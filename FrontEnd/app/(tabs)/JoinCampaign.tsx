import React, { useEffect, useState } from "react";
import { View, ScrollView, FlatList } from "react-native";
import { ActivityIndicator, Card, Chip, Surface, Text, useTheme } from "react-native-paper";
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
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/listaCampanhas`);
            const dados = await response.json();

            setListCampaign(dados);
        } catch (error) {
            console.error("Erro ao carregar campanhas:", error);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: any }) => (
    <Card 
        style={{ marginBottom: 16, marginHorizontal: 4, marginTop: 16 }}
        // 1. Adicionamos a ação de clique aqui
        onPress={() => handleOpenDetails(item)} 
    >
        <Card.Content>
            {/* O seu design atual continua igual */}
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
                {String(item.title || "Sem título")}
            </Text>
          
            <Text variant="bodyMedium" style={{ marginTop: 8 }}>
                {String(item.description || "Sem descrição")}
            </Text>

            <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text variant="labelSmall">
                    Expira: {item.expirationDate ? new Date(item.expirationDate).toLocaleDateString() : 'N/A'}
                </Text>
                
                {/* Dica: Adicionar um pequeno texto ou ícone ajuda o usuário a saber que é clicável */}
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
      <Text style={{ fontWeight: "bold", fontSize: 30, color: theme.colors.primary, marginVertical: 10 }}>
        Juntar-me a uma Campanha
      </Text>

      {/* 2.  Lista */}
      {loading ? (
        <ActivityIndicator animating={true} size="large" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={ListCampaign}
          // Usamos a função renderItem que defini acima
          renderItem={renderItem} 
          keyExtractor={(item) => item._id?.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={{ textAlign: 'center', marginTop: 20 }}>
              Não há campanhas disponíveis de momento.
            </Text>
          }
        />
      )}

      {/* 3.Modal */}
      {/* Ele fica aqui "escondido" e só aparece quando showDetails for true */}
      <DetalhesCampanha 
        visible={showDetails} 
        campaign={selectedCampaign} 
        onClose={() => setShowDetails(false)} 
      />

    </SafeAreaView>
  </Surface>
);
}
