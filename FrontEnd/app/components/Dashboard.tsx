import {
  Alert,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
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
      labels: dataArray.map((item) => item._id.substring(0, 10)),
      datasets: [
        {
          data: dataArray.map((item) => item.total),
        },
      ],
    };
  };

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
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
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
          <View className="flex-row justify-between mb-6">
            <Surface
              className="p-4 flex-1 mr-2"
              style={{
                backgroundColor: theme.colors.primaryContainer,
                borderRadius: 24,
              }}
              elevation={0}
            >
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  opacity: 0.8,
                  marginLeft: 8,
                }}
              >
                Cidadãos
              </Text>
              <Text
                variant="displaySmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: "bold",
                  marginLeft: 8,
                }}
              >
                {summary.totalUsers}
              </Text>
            </Surface>

            <Surface
              className="p-4 flex-1 ml-2"
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 24,
              }}
              elevation={0}
            >
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.onSecondaryContainer,
                  opacity: 0.8,
                  marginLeft: 8,
                }}
              >
                Negócios
              </Text>
              <Text
                variant="displaySmall"
                style={{
                  color: theme.colors.onSecondaryContainer,
                  fontWeight: "bold",
                  marginLeft: 8,
                }}
              >
                {summary.totalBusinesses}
              </Text>
            </Surface>
          </View>

          {/* Secção Gráfica 1 - Distribuição Demográfica (PieChart Ajustado) */}
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
                height={chartHeight}
                chartConfig={chartConfig}
                yAxisLabel=""
                yAxisSuffix=""
                withInnerLines={false}
                showValuesOnTopOfBars={true}
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
    </Surface>
  );
};

export default Dashboard;
