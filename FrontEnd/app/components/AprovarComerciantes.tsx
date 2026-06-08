import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View,
  FlatList,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import {
  ActivityIndicator,
  Surface,
  Text,
  Divider,
  List,
  Button,
  Modal,
  Portal,
  IconButton,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import CustomButton from '../components/CustomButton';
import { useAppTheme } from '@/context/ThemeContext';
import { curiosidades } from '@/constants/curiosidades';

interface PedidoComerciante {
  _id: string;
  tituloComercio: string;
  donoComercio: string;
  emailDono: string;
  telefoneDono: string;
  documentoPdfUrl?: string;
}

export default function AprovarComerciantes() {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pedidosPendentes, setPendentes] = useState<PedidoComerciante[]>([]);

  // Estados adicionados para controlar o Modal de Visualização idêntico ao SerComerciante
  const [visible, setVisible] = useState(false);
  const [pdfBase64, setPdf64] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [nomePdfAtual, setNomePdfAtual] = useState('');

  const carregarDados = useCallback(async () => {
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/obter/PedidosComerciante`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendentes(data);
      } else {
        Alert.alert(t('common.error'), t('camara.error_list'));
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('camara.error_load'));
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await carregarDados();
    } catch (err) {
      Alert.alert(t('common.error'), t('camara.error_load_info'));
    } finally {
      setRefreshing(false);
    }
  };

  // Função adaptada para baixar da URL e exibir no Modal idêntico ao SerComerciante
  const handleVerPDF = async (url?: string, tituloLoja?: string) => {
    if (!url) {
      Alert.alert(t('common.warning'), t('camara.no_pdf'));
      return;
    }

    // Corrige a URL para ser absoluta
    let urlFormatada = url;
    if (!url.startsWith('http')) {
      const baseUrl = (API_URL ?? '').replace(/\/$/, '');
      urlFormatada = `${baseUrl}/${url.replace(/^\//, '')}`;
    }

    try {
      setLoadingPdf(true);
      setNomePdfAtual(t('camara.doc_title', { title: tituloLoja || t('camara.default_commerce', { defaultValue: 'Comércio' }), defaultValue: `Doc - ${tituloLoja || 'Comércio'}` }));

      const localFileUri = `${FileSystem.cacheDirectory}preview.pdf`;

      // Baixa o PDF
      const downloadResult = await FileSystem.downloadAsync(
        urlFormatada,
        localFileUri,
      );

      // Converte para Base64 (a chave para o WebView mostrar o PDF)
      const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
        encoding: 'base64',
      });

      setPdf64(`data:application/pdf;base64,${base64}`);
      setVisible(true);
    } catch (error) {
      console.error('Erro ao converter PDF:', error);
      Alert.alert(t('common.error'), t('camara.error_pdf'));
    } finally {
      setLoadingPdf(false);
    }
  };
  const hideModal = () => {
    setVisible(false);
    setPdf64(null);
  };

  const handleDescartar = async (id: string) => {
    Alert.alert(t('common.confirm'), t('camara.reject_confirm'), [
      { text: t('common.cancel', { defaultValue: 'Cancelar' }), style: 'cancel' },
      {
        text: t('common.discard', { defaultValue: 'Descartar' }),
        style: 'destructive',
        onPress: async () => {
          try {
            const response = await fetch(
              `${API_URL}/apagarPedidoComerciante/${id}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${user?.token}`,
                  'Content-Type': 'application/json',
                },
              },
            );

            if (response.ok) {
              setPendentes(prev => prev.filter(item => item._id !== id));
            } else {
              Alert.alert(t('common.error'), t('camara.server_reject'));
            }
          } catch (error) {
            Alert.alert(t('common.error'), t('camara.fail_discard'));
          }
        },
      },
    ]);
  };

  const handleAprovar = async (id: string) => {
    try {
      const response = await fetch(
        `${API_URL}/aprovar/PedidoComerciante/${id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const result = await response.json();

      if (response.ok) {
        setPendentes(prev => prev.filter(item => item._id !== id));
        Alert.alert(t('common.success'), t('camara.approved'));
      } else {
        console.log('Erro do servidor:', result);
        Alert.alert(
          t('common.error'),
          result.message || t('camara.server_reject_approve'),
        );
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('camara.error_conn'));
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
          {t('common.loading')}
        </Text>

        <CustomButton
          labelStyle={{ textAlign: 'center' }}
          onPress={() => setRandomPhrase(handleRandomPhrase())}
          accessibilityLabel={t('accessibility.discover_curiosity')}
          accessibilityHint={t('accessibility.see_curiosity')}
        >
          {t('saved.did_you_know', { phrase: t(randomPhrase) })}
        </CustomButton>
      </Surface>
    );
  }

  return (
    <>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['top', 'left', 'right']}
        className="p-4"
      >
        <Stack.Screen options={{ headerShown: false }} />

        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: 'bold',
            marginBottom: 10,
          }}
        >
          {t('camara.merchants_title')}
        </Text>

        <Divider
          style={{
            backgroundColor: theme.colors.outlineVariant,
            marginBottom: 16,
          }}
        />

        {pedidosPendentes.length === 0 ? (
          <Text
            variant="bodyLarge"
            style={{ color: theme.colors.onSurfaceVariant }}
            className="mt-10 text-center"
          >
            {t('camara.no_new_merchants')}
          </Text>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.colors.primary]}
                tintColor={theme.colors.primary}
              />
            }
            data={pedidosPendentes}
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <Surface
                style={{
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  overflow: 'hidden',
                  backgroundColor: theme.colors.surfaceVariant,
                }}
                elevation={1}
              >
                <List.Item
                  title={() => (
                    <Text
                      style={{
                        fontWeight: 'bold',
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 16,
                      }}
                    >
                      {item.tituloComercio}
                    </Text>
                  )}
                  description={t('camara.merchant_desc', { owner: item.donoComercio, phone: item.telefoneDono, email: item.emailDono, defaultValue: `Dono: ${item.donoComercio}\nTel: ${item.telefoneDono}\nEmail: ${item.emailDono}` })}
                  descriptionNumberOfLines={3}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon="file-pdf-box"
                      color={theme.colors.error}
                    />
                  )}
                />

                <View className="px-4 pb-2">
                  <CustomButton
                    icon="eye"
                    loading={loadingPdf}
                    disabled={loadingPdf}
                    onPress={() =>
                      handleVerPDF(item.documentoPdfUrl, item.tituloComercio)
                    }
                    accessibilityLabel={t('accessibility.view_pdf_name', { name: item.tituloComercio, defaultValue: `Visualizar Documento PDF de ${item.tituloComercio}` })}
                    accessibilityHint={t('accessibility.read_doc')}
                  >
                    {t('merchant.view_pdf', { defaultValue: 'Visualizar Documento PDF' })}
                  </CustomButton>
                </View>

                <Divider
                  style={{
                    marginVertical: 8,
                    backgroundColor: theme.colors.outlineVariant,
                  }}
                />

                <View className="flex-row gap-x-3 px-4 pb-4">
                  <CustomButton
                    className="flex-1"
                    onPress={() => handleAprovar(item._id)}
                    textColor={theme.colors.onPrimary}
                    buttonColor={theme.colors.primary}
                    accessibilityLabel={t('accessibility.accept_request_name', { name: item.tituloComercio, defaultValue: `Aceitar pedido de ${item.tituloComercio}` })}
                    accessibilityHint={t('accessibility.approve_merchant')}
                  >
                    {t('common.accept', { defaultValue: 'Aceitar' })}
                  </CustomButton>

                  <CustomButton
                    className="flex-1"
                    onPress={() => handleDescartar(item._id)}
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.onErrorContainer}
                    accessibilityLabel={t('accessibility.discard_request_name', { name: item.tituloComercio, defaultValue: `Descartar pedido de ${item.tituloComercio}` })}
                    accessibilityHint={t('accessibility.reject_merchant')}
                  >
                    {t('common.discard', { defaultValue: 'Descartar' })}
                  </CustomButton>
                </View>
              </Surface>
            )}
          />
        )}
      </SafeAreaView>

      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={{
            backgroundColor: 'white',
            margin: 20,
            borderRadius: 12,
            height: Dimensions.get('window').height * 0.75,
            overflow: 'hidden',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 8,
              paddingVertical: 4,
              borderBottomWidth: 1,
              borderColor: '#eee',
              backgroundColor: '#f5f5f5',
            }}
          >
            <Text
              variant="titleMedium"
              style={{ flex: 1, fontWeight: 'bold', marginLeft: 8 }}
              numberOfLines={1}
            >
              {nomePdfAtual}
            </Text>

            <IconButton 
              icon="close" 
              size={24} 
              onPress={hideModal} 
              accessible={true}
              accessibilityLabel={t('accessibility.close_pdf')}
            />
          </View>

          {pdfBase64 && (
            <WebView
              originWhitelist={['*']}
              source={{
                html: `
                    <html>
                      <head>
                        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                        <style>
                          body, html { margin: 0; padding: 0; height: 100%; width: 100%; }
                          object { width: 100%; height: 100%; }
                        </style>
                      </head>
                      <body>
                        <object data="${pdfBase64}" type="application/pdf" width="100%" height="100%">
                          <embed src="${pdfBase64}" type="application/pdf" width="100%" height="100%" />
                        </object>
                      </body>
                    </html>
                  `,
              }}
              style={{ flex: 1 }}
            />
          )}
        </Modal>
      </Portal>
    </>
  );
}
