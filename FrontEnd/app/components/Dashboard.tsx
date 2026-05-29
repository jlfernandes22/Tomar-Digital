import {
  Alert,
  ScrollView,
  View,
  useWindowDimensions,
  FlatList,
  Animated,
} from 'react-native';
import React, { Children, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-gifted-charts';
import { ExpandingDot } from 'react-native-animated-pagination-dots';

import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { RefreshControl } from 'react-native-gesture-handler';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { width: screenWidth } = useWindowDimensions();

  const [allInfo, setAllInfo] = useState({
    categories: [],
    cities: [],
    countries: [],
  });
  const [summary, setSummary] = useState({ totalUsers: 0, totalBusinesses: 0 });
  const [loading, setLoading] = useState(true);

  /* Largura calculada subtraindo paddings externos (16*2) e internos do cartão (16*2) */
  const chartWidth = screenWidth - 64;
  const chartHeight = 220;
  const CHART_COLORS = [
    theme.colors.primary,
    theme.colors.tertiary,
    theme.colors.secondary,
    theme.colors.error,
    theme.colors.primaryContainer,
    theme.colors.tertiaryContainer,
    theme.colors.outline,
  ];

  const fetchAllInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/dashboard`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setAllInfo(data);
        //console.log(allInfo.countries)

        setSummary({
          totalUsers: data.totalUsers || 0,
          totalBusinesses: data.totalBusinesses || 0,
        });
      } else {
        console.error('Erro na resposta:', response.status);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as estatísticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchAllInfo();
  }, [user?.token]);

  //função para formatar os dados vindos da API para obter distribuição geográfica
  const formatPieData = (dataArray: any[]) => {
    // 1. Ordena os dados decrescentemente pelo total de utilizadores
    const sortedData = [...dataArray].sort((a, b) => b.total - a.total);

    let processedData = sortedData;

    // 2. Se houver mais do que 5 itens, agrupa o excedente sob "Outros" para evitar sobrepor a legenda
    if (sortedData.length > 5) {
      const topItems = sortedData.slice(0, 5);
      const remainingItems = sortedData.slice(5);
      const totalOthers = remainingItems.reduce(
        (sum, item) => sum + item.total,
        0,
      );

      processedData = [
        ...topItems,
        {
          _id: 'Outros',
          total: totalOthers,
        },
      ];
    }

    // 3. Mapeia para a estrutura do gráfico utilizando as cores do tema da aplicação
    return processedData.map((item, index) => {
      const sliceColor =
        item._id === 'Outros'
          ? theme.colors.outline
          : CHART_COLORS[index % CHART_COLORS.length];

      return {
        name: item._id,
        population: item.total,
        color: sliceColor,
        legendFontColor: theme.colors.onSurface,
        legendFontSize: 13,
      };
    });
  };

  const scrollX = React.useRef(new Animated.Value(0)).current;

  //função para formatar os dados vindos da API para os negócios
  const formatBarData = (dataArray: any[]) => {
    //console.log(dataArray[1].total)
    return dataArray.map(item => ({
      value: item.total,
      label: item._id,
      frontColor: theme.colors.primary,
      topLabelComponent: () => (
        <Text style={{ fontSize: 16, marginBottom: 6, color: theme.colors.onSurface }}>{item.total}</Text>
      ),
    }));
  };

  const chartConfig = {
    backgroundGradientFrom: theme.colors.surfaceContainer,
    backgroundGradientTo: theme.colors.surfaceContainer,
    color: (opacity = 1) => theme.colors.onSurface,
    labelColor: (opacity = 1) => theme.colors.onSurfaceVariant,
    barPercentage: 0.7,
    fillShadowGradientFrom: theme.colors.primary,
    fillShadowGradientFromOpacity: 0.8,
    fillShadowGradientTo: theme.colors.primaryContainer,
    fillShadowGradientToOpacity: 0.8,
    decimalPlaces: 0,
  };

  // 1. Filtrar para obter apenas os países estrangeiros (ignorar Portugal)
  const paisesEstrangeiros = allInfo.countries.filter(
    country => country._id && country._id.toLowerCase() !== 'portugal',
  );

  // 2. Criar a estrutura para a FlatList renderizar os dois cartões
  const geographicCharts = [
    {
      id: '1',
      title: 'Cidades de Portugal',
      data: allInfo.cities,
      emptyMessage: 'Sem dados de cidades em Portugal.',
    },
    {
      id: '2',
      title: 'Resto do Mundo',
      data: paisesEstrangeiros,
      emptyMessage: 'Sem utilizadores registados fora de Portugal.',
    },
  ];

  if (loading) {
    return (
      <View
        className="flex-1 items-center justify-center"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text variant="headlineLarge">
          Por favor aguarde enquanto preparamos todos os dados
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <View>
          <Text
            variant="headlineMedium"
            style={{
              color: theme.colors.primary,
              fontWeight: 'bold',
              marginLeft: 8,
            }}
          >
            Visão Geral
          </Text>

          {/* Secção de KPIs */}
          <View className="mb-6 flex-row p-4">
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
                  alignSelf: 'center',
                }}
              >
                Cidadãos
              </Text>
              <Text
                variant="displaySmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  fontWeight: 'bold',
                  alignSelf: 'center',
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
                  alignSelf: 'center',
                  opacity: 0.8,
                }}
              >
                Negócios
              </Text>
              <Text
                variant="displaySmall"
                style={{
                  color: theme.colors.onSecondaryContainer,
                  fontWeight: 'bold',
                  alignSelf: 'center',
                }}
              >
                {summary.totalBusinesses}
              </Text>
            </Surface>
          </View>
          <View>
            <FlatList
              data={geographicCharts}
              horizontal
              keyExtractor={item => item.id}
              pagingEnabled={true}
              showsHorizontalScrollIndicator={false}
              bounces={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                  useNativeDriver: false,
                },
              )}
              renderItem={({ item }) => {
                return (
                  <View style={{ width: screenWidth }}>
                    <Surface
                      className="p-4"
                      style={{
                        backgroundColor: theme.colors.surfaceContainer,
                        borderRadius: 24,
                        paddingBottom: 5,
                        marginBottom: 10,
                        marginHorizontal: 10,
                      }}
                      elevation={0}
                    >
                      <Text
                        variant="titleLarge"
                        style={{
                          color: theme.colors.onSurface,
                          paddingTop: 16,
                          paddingLeft: 16,
                        }}
                      >
                        {item.title}
                      </Text>
                      {item.data && item.data.length > 0 ? (
                        <View pointerEvents="none">
                          <PieChart
                            data={formatPieData(item.data)}
                            width={chartWidth}
                            height={chartHeight}
                            chartConfig={chartConfig}
                            accessor={'population'}
                            backgroundColor={'transparent'}
                            paddingLeft="15"
                            center={[3, 0]}
                            /* Remoção da propriedade 'absolute' para melhor adaptação do layout */
                          />
                        </View>
                      ) : (
                        <Text
                          style={{
                            color: theme.colors.onSurfaceVariant,
                            marginLeft: 8,
                          }}
                        >
                          {item.emptyMessage}
                        </Text>
                      )}
                    </Surface>
                  </View>
                );
              }}
            ></FlatList>
            <ExpandingDot
              data={geographicCharts}
              expandingDotWidth={30}
              scrollX={scrollX}
              inActiveDotOpacity={0.6}
              activeDotColor={theme.colors.primary}
              inActiveDotColor={theme.colors.primary}
              dotStyle={{
                width: 10,
                height: 10,
                borderRadius: 5,
              }}
              containerStyle={{
                bottom: 20,
              }}
            />
          </View>

          {/* Secção Gráfica 2 - Tipologia de Negócios (BarChart) */}
          <View style={{ padding: 8 }}>
            <Surface
              style={{
                backgroundColor: theme.colors.surfaceContainer,
                borderRadius: 24,
                minHeight: allInfo.categories.length * 55 + 70,
                overflow: 'visible',
              }}
              elevation={0}
            >
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurface,
                  paddingLeft: 16,
                  paddingTop: 16,
                }}
              >
                Tipologia de Negócios
              </Text>
              <View style={{ alignSelf: 'left', bottom: 40 }}>
                {allInfo.categories.length > 0 ? (
                  <BarChart
                    data={formatBarData(allInfo.categories)}
                    horizontal
                    hideRules
                    dashGap={0}
                    hideYAxisText
                    xAxisLabelsVerticalShift={40}
                    shiftX={50}
                    xAxisLabelsHeight={40}
                    xAxisTextNumberOfLines={2}
                    xAxisThickness={0}
                    xAxisLabelTextStyle={{
                      width: 85,
                      color: theme.colors.onSurface,
                    }}
                    yAxisThickness={0}
                    disablePress
                    isAnimated
                    disableScroll
                    width={screenWidth / 1.8}
                  />
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Sem dados disponíveis.
                  </Text>
                )}
              </View>
            </Surface>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Dashboard;
