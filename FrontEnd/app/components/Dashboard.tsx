import {
  ScrollView,
  View,
  useWindowDimensions,
  FlatList,
  Animated,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useTranslation } from 'react-i18next';
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
import CustomDialog from './CustomDialog';
import WebView from 'react-native-webview';
import { DashboardPdf } from '@/constants/html/DashboardPdf';
import { exportDashboardToExcel } from '@/constants/excelUtils';
import { curiosidades } from '@/constants/curiosities';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { t, i18n } = useTranslation();
  const { width: screenWidth } = useWindowDimensions();

  const [allInfo, setAllInfo] = useState<{
    categories: any[];
    cities: any[];
    countries: any[];
  }>({
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

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

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
        setDialogTitle(t('common.error'));
        setDialogText(
          t('dashboard.error_server_data', {
            defaultValue: 'Erro: Servidor não devolveu os dados com sucesso.',
          }),
        );
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('dashboard.error_load_stats', {
          defaultValue: 'Erro: Não foi possível carregar as estatísticas.',
        }),
      );
      setDialogVisible(true);
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
          _id: t('dashboard.others', { defaultValue: 'Outros' }),
          total: totalOthers,
        },
      ];
    }

    return processedData.map((item, index) => {
      const sliceColor =
        item._id === t('dashboard.others', { defaultValue: 'Outros' })
          ? theme.colors.outline
          : CHART_COLORS[index % CHART_COLORS.length];

      const translatedName =
        item._id === t('dashboard.others', { defaultValue: 'Outros' })
          ? item._id
          : t(`categories.${item._id}` as any, { defaultValue: item._id });

      return {
        name: translatedName,
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
      label: t(`categories.${item._id}` as any, { defaultValue: item._id }),
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
      title: t('dashboard.cities_pt', { defaultValue: 'Cidades de Portugal' }),
      data: allInfo.cities,
      emptyMessage: t('dashboard.no_cities_data', {
        defaultValue: 'Sem dados de cidades em Portugal.',
      }),
    },
    {
      id: '2',
      title: t('dashboard.rest_of_world', { defaultValue: 'Resto do Mundo' }),
      data: paisesEstrangeiros,
      emptyMessage: t('dashboard.no_users_abroad', {
        defaultValue: 'Sem utilizadores registados fora de Portugal.',
      }),
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

      const dataAtual = new Date().toLocaleDateString(
        i18n.language === 'pt' ? 'pt-PT' : 'en-US',
        {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        },
      );

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
      setDialogTitle(t('common.error'));
      setDialogText(
        t('dashboard.error_generate_pdf', {
          defaultValue: 'Erro ao gerar a pré-visualização do PDF.',
        }),
      );
      setDialogVisible(true);
    }
  }

  // 2. Ação de Imprimir a partir do Modal
  const handlePrintPDF = async () => {
    try {
      await Print.printAsync({ html });
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('dashboard.error_print_action', {
          defaultValue: 'Ação de impressão cancelada ou falhou.',
        }),
      );
      setDialogVisible(true);
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
        dialogTitle: t('dashboard.save_pdf_report', {
          defaultValue: 'Guardar Relatório PDF',
        }),
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('dashboard.error_save_pdf', {
          defaultValue: 'Erro ao tentar guardar o PDF.',
        }),
      );
      setDialogVisible(true);
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
      setDialogTitle(t('common.error'));
      setDialogText(
        t('dashboard.error_generate_excel', {
          defaultValue: 'Erro ao gerar ficheiro Excel.',
        }),
      );
      setDialogVisible(true);
    }
  };

  const handleRandomPhrase = () => {
    return curiosidades[Math.floor(Math.random() * curiosidades.length)];
  };
  const [randomPhrase, setRandomPhrase] = useState(handleRandomPhrase());

  if (loading) {
    return (
      <Surface
        className="items-center justify-center p-6"
        style={{ flex: 1, backgroundColor: theme.colors.background }}
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
          {t('dashboard.preparing_data', {
            defaultValue: 'A preparar os dados...',
          })}
        </Text>

        <CustomButton
          labelStyle={{ textAlign: 'center' }}
          onPress={() => setRandomPhrase(handleRandomPhrase())}
          accessibilityLabel={t('accessibility.discover_curiosity', {
            defaultValue: 'Descobrir curiosidade',
          })}
          accessibilityHint={t('accessibility.view_other_curiosity', {
            defaultValue: 'Clica para ver outra curiosidade',
          })}
        >
          {t('dashboard.did_you_know', { defaultValue: 'Sabias que...' })}
          {'\n '}
          {t(randomPhrase)}
        </CustomButton>
      </Surface>
    );
  }

  return (
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Surface
            style={{
              paddingBottom: 80,
            }}
          >
            <Text
              variant="headlineMedium"
              style={{
                color: theme.colors.primary,
                fontWeight: 'bold',
                marginLeft: 8,
              }}
            >
              {t('dashboard.overview', { defaultValue: 'Visão Geral' })}
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
                  {t('dashboard.citizens', { defaultValue: 'Cidadãos' })}
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
                  {t('dashboard.businesses', { defaultValue: 'Negócios' })}
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

            {/* Secção Gráfica 2 - {t('dashboard.business_typology', { defaultValue: 'Tipologia de Negócios' })} (BarChart) */}
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
                  {t('dashboard.business_typology', {
                    defaultValue: 'Tipologia de Negócios',
                  })}
                </Text>
                <View style={{ alignSelf: 'flex-start', bottom: 40 }}>
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
                      {t('dashboard.no_data_available', {
                        defaultValue: 'Sem dados disponíveis.',
                      })}
                    </Text>
                  )}
                </View>
              </Surface>
            </View>
            <Divider style={{ marginVertical: 20 }} />
            <Text
              style={{ marginLeft: 8, marginBottom: 10, fontWeight: 'bold' }}
            >
              {t('dashboard.export_report', {
                defaultValue: 'Exportar Relatório',
              })}
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
                  accessibilityLabel={t('accessibility.preview_pdf', {
                    defaultValue: 'Pré-visualizar PDF',
                  })}
                  accessibilityHint={t('accessibility.preview_pdf_hint', {
                    defaultValue:
                      'Clica para ver uma antevisão do relatório em formato PDF',
                  })}
                >
                  {t('dashboard.preview_pdf_btn', {
                    defaultValue: 'Pré-visualizar PDF',
                  })}
                </CustomButton>
              </View>
              <View style={{ flex: 1 }}>
                <CustomButton
                  numberOfLines={2}
                  onPress={handleExportExcel}
                  loading={excelLoading}
                  buttonColor="#15cc15"
                  icon="file-excel-box"
                  accessibilityLabel={t('accessibility.export_excel', {
                    defaultValue: 'Exportar para Excel',
                  })}
                  accessibilityHint={t('accessibility.export_excel_hint', {
                    defaultValue:
                      'Clica para fazer o download do relatório em formato Excel',
                  })}
                >
                  {t('dashboard.export_excel_btn', {
                    defaultValue: 'Exportar para Excel',
                  })}
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
                {t('dashboard.pdf_report', { defaultValue: 'Relatório PDF' })}
              </Text>
              <IconButton
                icon="close"
                size={24}
                accessible={true}
                accessibilityLabel={t('accessibility.close_preview', {
                  defaultValue: 'Fechar pré-visualização',
                })}
                accessibilityHint={t('accessibility.close_pdf_hint', {
                  defaultValue: 'Clica para fechar o relatório PDF',
                })}
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
                  accessibilityLabel={t('accessibility.print_report', {
                    defaultValue: 'Imprimir relatório',
                  })}
                >
                  {t('dashboard.print_btn', { defaultValue: 'Imprimir' })}
                </CustomButton>
              </View>
              <View style={{ flex: 1 }}>
                <CustomButton
                  onPress={handleSavePDF}
                  loading={pdfLoading}
                  buttonColor={theme.colors.secondaryContainer}
                  textColor={theme.colors.onSecondaryContainer}
                  icon="content-save"
                  accessibilityLabel={t('accessibility.save_report', {
                    defaultValue: 'Guardar relatório',
                  })}
                >
                  {t('dashboard.save_btn', { defaultValue: 'Guardar' })}
                </CustomButton>
              </View>
            </View>
          </Modal>

          <CustomDialog
            title={dialogTitle}
            visible={dialogVisible}
            onDismiss={() => setDialogVisible(false)}
          >
            <Text>{dialogText}</Text>
          </CustomDialog>
        </Portal>
      </SafeAreaView>
    </Surface>
  );
};

export default Dashboard;
