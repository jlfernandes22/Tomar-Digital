import {
  Alert,
  ScrollView,
  View,
  useWindowDimensions,
  FlatList,
  Animated,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { BarChart } from 'react-native-gifted-charts';
import { ExpandingDot } from 'react-native-animated-pagination-dots';
import {
  Surface,
  Text,
  ActivityIndicator,
  Divider,
  Modal,
  Portal,
  IconButton,
} from 'react-native-paper';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import CustomButton from './CustomButton';
import CustomSnackBar from './CustomSnackBar';
import WebView from 'react-native-webview';
import { DashboardPdf } from '@/constants/html/DashboardPdf';
import { exportDashboardToExcel } from '@/constants/excelUtils';
import { curiosidades } from '@/constants/curiosidades';

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
  const [pdfLoading, setPdfLoading] = useState(false);
  const [excelLoading, setExcelLoading] = useState(false);

  const [pdfDialogVisible, setPdfDialogVisible] = useState(false);
  const [html, setHtml] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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

        const utilizadoresReais = data.countries.reduce(
          (soma: number, pais: any) => soma + pais.total,
          0,
        );

        setSummary({
          totalUsers: utilizadoresReais,
          totalBusinesses: data.totalBusinesses || 0,
        });
      } else {
        setSnackbarMessage('Erro: Servidor não devolveu os dados com sucesso.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Erro: Não foi possível carregar as estatísticas.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.token) fetchAllInfo();
  }, [user?.token]);

  const formatPieData = (dataArray: any[]) => {
    const sortedData = [...dataArray].sort((a, b) => b.total - a.total);
    let processedData = sortedData;

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

  const formatBarData = (dataArray: any[]) => {
    const sortedData = [...dataArray].sort((a, b) => b.total - a.total);

    return sortedData.map(item => ({
      value: item.total,
      label: item._id,
      frontColor: theme.colors.primary,
      topLabelComponent: () => (
        <Text
          style={{
            fontSize: 16,
            marginBottom: 6,
            color: theme.colors.onSurface,
          }}
        >
          {item.total}
        </Text>
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

  const paisesEstrangeiros = allInfo.countries.filter(
    country => country._id && country._id.toLowerCase() !== 'portugal',
  );

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

  // 1. Apenas constrói o HTML e abre o Modal do WebView
  function createPDF() {
    try {
      const maxCat = Math.max(
        ...allInfo.categories.map((c: any) => c.total),
        1,
      );
      const maxCity = Math.max(...allInfo.cities.map((c: any) => c.total), 1);

      const dataAtual = new Date().toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const htmlContent = DashboardPdf({
        theme,
        dataAtual,
        summary,
        allInfo,
        maxCat,
        maxCity,
        paisesEstrangeiros,
      });

      setHtml(htmlContent);
      setPdfDialogVisible(true);
    } catch (error) {
      setSnackbarMessage('Erro ao gerar a pré-visualização do PDF.');
      setSnackbarVisible(true);
    }
  }

  // 2. Ação de Imprimir a partir do Modal
  const handlePrintPDF = async () => {
    try {
      await Print.printAsync({ html });
    } catch (error) {
      setSnackbarMessage('Ação de impressão cancelada ou falhou.');
      setSnackbarVisible(true);
    }
  };

  // 3. Ação de Guardar a partir do Modal
  const handleSavePDF = async () => {
    try {
      setPdfLoading(true);
      // Gera o ficheiro PDF temporário pelo expo-print
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // NOVA API: Cria instâncias de objetos File em vez de strings
      const tempFile = new File(uri);
      const finalFile = new File(Paths.document, 'Relatorio_TomarDigital.pdf');

      // Move o ficheiro do diretório temporário (cache) para a pasta de documentos permanente
      tempFile.move(finalFile);

      // Pede ao utilizador para guardar
      await Sharing.shareAsync(finalFile.uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Guardar Relatório PDF',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      setSnackbarMessage('Erro ao tentar guardar o PDF.');
      setSnackbarVisible(true);
    } finally {
      setPdfLoading(false);
      setPdfDialogVisible(false); // Fecha o dialog de qualquer forma
    }
  };

  // 4. Ação do Excel (Independente)
  const handleExportExcel = async () => {
    setExcelLoading(true);
    const result = await exportDashboardToExcel({
      summary,
      categories: allInfo.categories,
      cities: allInfo.cities,
      countries: allInfo.countries,
    });

    setExcelLoading(false);
    if (!result.success) {
      setSnackbarMessage('Erro ao gerar ficheiro Excel.');
      setSnackbarVisible(true);
    }
  };

  const handleRandomPhrase = () => {
    return curiosidades[Math.floor(Math.random() * curiosidades.length)];
  };
  const [randomPhrase, setRandomPhrase] = useState(handleRandomPhrase());

  if (loading) {
    return (
      <Surface
        className="flex-1 items-center justify-center p-6"
        style={{ backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{ marginBottom: 20 }}
        />

        <Text
          variant="titleLarge"
          style={{
            fontWeight: 'bold',
            color: theme.colors.primary,
            marginBottom: 10,
          }}
        >
          A preparar os dados...
        </Text>

        <CustomButton
          labelStyle={{ textAlign: 'center' }}
          onPress={() => setRandomPhrase(handleRandomPhrase())}
        >
          Sabias que...{'\n '}
          {randomPhrase}
        </CustomButton>
      </Surface>
    );
  }

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
        <Surface style={{ paddingBottom: 80 }}>
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
          <Divider style={{ marginVertical: 20 }} />
          <Text style={{ marginLeft: 8, marginBottom: 10, fontWeight: 'bold' }}>
            Exportar Relatório
          </Text>
          <View
            style={{
              padding: 8,
              flexDirection: 'row',
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <CustomButton
                numberOfLines={2}
                onPress={createPDF}
                buttonColor={theme.colors.error}
                icon="file-pdf-box"
              >
                Pré-visualizar PDF
              </CustomButton>
            </View>
            <View style={{ flex: 1 }}>
              <CustomButton
                numberOfLines={2}
                onPress={handleExportExcel}
                loading={excelLoading}
                buttonColor="#15cc15"
                icon="file-excel-box"
              >
                Exportar para Excel
              </CustomButton>
            </View>
          </View>
        </Surface>
      </ScrollView>

      {/* PORTAL PARA O MODAL DO PDF E SNACKBAR */}
      <Portal>
        <Modal
          visible={pdfDialogVisible}
          onDismiss={() => setPdfDialogVisible(false)}
          contentContainerStyle={{
            backgroundColor: theme.colors.background,
            margin: 20,
            borderRadius: 12,
            overflow: 'hidden',
            flex: 1,
          }}
        >
          {/* Cabeçalho do Modal */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 8,
              backgroundColor: theme.colors.surfaceContainer,
            }}
          >
            <Text
              variant="titleMedium"
              style={{ marginLeft: 16, fontWeight: 'bold' }}
            >
              Relatório PDF
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={() => setPdfDialogVisible(false)}
            />
          </View>

          {/* O WebView mostra o HTML exatamente como no teu código anterior */}
          {pdfDialogVisible && (
            <WebView
              originWhitelist={['*']}
              source={{ html }}
              style={{ flex: 1 }}
              scalesPageToFit={true}
            />
          )}

          {/* Rodapé com as Acões de Imprimir / Guardar */}
          <View
            style={{
              flexDirection: 'row',
              padding: 12,
              backgroundColor: theme.colors.surfaceContainer,
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <CustomButton
                onPress={handlePrintPDF}
                buttonColor={theme.colors.primary}
                icon="printer"
              >
                Imprimir
              </CustomButton>
            </View>
            <View style={{ flex: 1 }}>
              <CustomButton
                onPress={handleSavePDF}
                loading={pdfLoading}
                buttonColor={theme.colors.secondaryContainer}
                textColor={theme.colors.onSecondaryContainer}
                icon="content-save"
              >
                Guardar
              </CustomButton>
            </View>
          </View>
        </Modal>

        <CustomSnackBar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMessage}
        />
      </Portal>
    </SafeAreaView>
  );
};

export default Dashboard;
