import { Alert, ScrollView, View, useWindowDimensions } from "react-native";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { API_URL } from "@/constants/api";
import { SafeAreaView } from "react-native-safe-area-context";
import { PieChart, BarChart } from "react-native-chart-kit";
import { Surface, Text, ActivityIndicator, useTheme } from "react-native-paper";

const Dashboard = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [allInfo, setAllInfo] = useState({ categories: [], cities: [] });
  const [summary, setSummary] = useState({ totalUsers: 0, totalBusinesses: 0 });
  const [loading, setLoading] = useState(true);

  /* Largura calculada subtraindo paddings externos (16*2) e internos do cartão (16*2) */
  const chartWidth = screenWidth - 64;
  const chartHeight = 220;

  const CHART_COLORS = [
    theme.colors.primary,
    theme.colors.primaryContainer,
    theme.colors.secondaryContainer,
    theme.colors.tertiaryContainer,
    theme.colors.outline,
  ];

  const fetchAllInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllInfo(data);

        setSummary({
          totalUsers: data.totalUsers || 0,
          totalBusinesses: data.totalBusinesses || 0,
        });
      } else {
        console.error("Erro na resposta:", response.status);
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar as estatísticas.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchAllInfo();
  }, [user?.token]);

  const formatPieData = (dataArray: any[]) => {
    return dataArray.map((item, index) => ({
      name: item._id,
      population: item.total,
      color: CHART_COLORS[index % CHART_COLORS.length],
      legendFontColor: theme.colors.onSurfaceVariant,
      legendFontSize: 12,
    }));
  };

  const formatBarData = (dataArray: any[]) => {
    return {
      labels: dataArray.map((item) =>
        item._id.length > 8 ? item._id.substring(0, 8) + "..." : item._id,
      ),
      datasets: [
        {
          data: dataArray.map((item) => item.total),
        },
      ],
    };
  };

  const maxCategoryValue =
    allInfo.categories.length > 0
      ? Math.max(...allInfo.categories.map((item: any) => item.total))
      : 1;

  // Garante que desenha pelo menos 1 linha, mas nunca mais do que 4 para não poluir o ecrã
  const yAxisSegments = Math.max(1, Math.min(4, maxCategoryValue));

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surfaceVariant,
    backgroundGradientTo: theme.colors.surfaceVariant,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
    barPercentage: 0.7,
    fillShadowGradientFrom: theme.colors.primary,
    fillShadowGradientFromOpacity: 0.8,
    fillShadowGradientTo: theme.colors.primaryContainer,
    fillShadowGradientToOpacity: 0.8,
    decimalPlaces: 0,
  };

  if (loading) {
    return (
      <View
        className="flex-1 justify-center items-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 10 }}>
        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: "bold",
            marginBottom: 24,
          }}
        >
          Visão Geral
        </Text>

        {/* Secção de KPIs */}
        <View className="flex-row mb-6">
          <Surface
            className="p-4"
            style={{
              backgroundColor: theme.colors.primaryContainer,
              borderRadius: 24,
              marginRight: 20,
              flex: 1,
            }}
            elevation={2}
          >
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onPrimaryContainer,
                opacity: 0.8,
                alignSelf: "center",
              }}
            >
              Cidadãos
            </Text>
            <Text
              variant="displaySmall"
              style={{
                color: theme.colors.onPrimaryContainer,
                fontWeight: "bold",
                alignSelf: "center",
              }}
            >
              {summary.totalUsers}
            </Text>
          </Surface>

          <Surface
            className="p-4"
            style={{
              backgroundColor: theme.colors.secondaryContainer,
              borderRadius: 24,
              flex: 1,
            }}
            elevation={2}
          >
            <Text
              variant="titleMedium"
              style={{
                color: theme.colors.onSecondaryContainer,
                alignSelf: "center",
                opacity: 0.8,
              }}
            >
              Negócios
            </Text>
            <Text
              variant="displaySmall"
              style={{
                color: theme.colors.onSecondaryContainer,
                fontWeight: "bold",
                alignSelf: "center",
              }}
            >
              {summary.totalBusinesses}
            </Text>
          </Surface>
        </View>

        {/* Secção Gráfica 1 - Distribuição Demográfica (PieChart Ajustado) */}
        <Surface
          className="p-4"
          style={{
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 24,
            marginBottom: 20,
          }}
          elevation={0}
        >
          <Text
            variant="titleLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginBottom: 16,
              marginLeft: 8,
            }}
          >
            Distribuição Geográfica
          </Text>
          {allInfo.cities.length > 0 ? (
            <PieChart
              data={formatPieData(allInfo.cities)}
              width={chartWidth}
              height={chartHeight}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft="15"
              center={[3, 0]}
              /* Remoção da propriedade 'absolute' para melhor adaptação do layout */
            />
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Sem dados disponíveis.
            </Text>
          )}
        </Surface>

        {/* Secção Gráfica 2 - Tipologia de Negócios (BarChart) */}
        <Surface
          className="p-4 mb-6"
          style={{
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 24,
          }}
          elevation={0}
        >
          <Text
            variant="titleLarge"
            style={{
              color: theme.colors.onSurfaceVariant,
              marginBottom: 16,
              marginLeft: 8,
            }}
          >
            Tipologia de Negócios
          </Text>
          {allInfo.categories.length > 0 ? (
            <BarChart
              data={formatBarData(allInfo.categories)}
              width={chartWidth}
              height={450}
              chartConfig={chartConfig}
              yAxisLabel=""
              yAxisSuffix=""
              withInnerLines={false}
              showValuesOnTopOfBars={true}
              segments={yAxisSegments}
              fromZero={true}
              verticalLabelRotation={45}
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Sem dados disponíveis.
            </Text>
          )}
        </Surface>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
