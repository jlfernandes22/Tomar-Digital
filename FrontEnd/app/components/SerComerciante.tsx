import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Dimensions } from 'react-native';
import {
  Button,
  Text,
  Card,
  Modal,
  Portal,
  IconButton,
  Surface,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { useAuth } from '@/context/AuthContext';
import CustomTextInput from './CustomTextInput';
import * as FileSystem from 'expo-file-system/legacy';
import { API_URL } from '@/constants/api';
import { router, Stack } from 'expo-router';
import CustomButton from './CustomButton';
import { useAppTheme } from '@/context/ThemeContext';

interface IComercianteForm {
  tituloComercio: string;
  donoComercio: string;
  emailDono: string;
  telefoneDono: string;
  documentoPDF: { uri: string; name: string } | null;
}

export default function SerComerciante() {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();

  const [visible, setVisible] = useState(false);
  const [pdfBase64, setPdf64] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarText, setSnackBarText] = useState('');

  const [formData, setFormData] = useState<IComercianteForm>({
    tituloComercio: '',
    donoComercio: user?.name || '',
    emailDono: user?.email || '',
    telefoneDono: '',
    documentoPDF: null,
  });

  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, donoComercio: user.name }));
    }
  }, [user]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setFormData(prev => ({
          ...prev,
          documentoPDF: { uri: file.uri, name: file.name },
        }));
      }
    } catch (err) {
      console.log('Erro ao selecionar o documento:', err);
    }
  };

  const showModal = async () => {
    if (!formData.documentoPDF?.uri) {
      alert(t('serComerciante.alert_select_file', { defaultValue: 'Por favor, selecione um arquivo primeiro.' }));
      return;
    }

    try {
      setLoadingPdf(true);
      const cleanUri = decodeURIComponent(formData.documentoPDF.uri);

      const base64 = await FileSystem.readAsStringAsync(cleanUri, {
        encoding: 'base64',
      });

      setPdf64(`data:application/pdf;base64,${base64}`);
      setVisible(true);
    } catch (error) {
      console.log('❌ Erro ao processar o PDF para o Modal:', error);
      alert(t('serComerciante.alert_preview_error', { defaultValue: 'Não foi possível gerar a pré-visualização.' }));
    } finally {
      setLoadingPdf(false);
    }
  };

  const hideModal = () => {
    setVisible(false);
    setPdf64(null);
  };

  const handleFinalSubmit = async () => {
    if (!user || !user.token) {
      setSnackBarText(t('serComerciante.error_session', { defaultValue: 'Sessão expirada. Faça login novamente.' }));
      setShowSnackBar(true);
      return;
    }

    if (!formData.documentoPDF?.uri) {
      setSnackBarText(t('serComerciante.error_no_pdf', { defaultValue: 'Por favor, selecione um documento PDF.' }));
      setShowSnackBar(true);
      return;
    }

    setLoading(true);

    try {
      const decodedUri = decodeURIComponent(formData.documentoPDF.uri);

      // Certificamo-nos de que começa com 'file://' apenas uma vez
      const cleanUri = decodedUri.startsWith('file://')
        ? decodedUri
        : `file://${decodedUri}`;

      // Validar se o ficheiro está mesmo acessível antes de travar o fetch
      const fileInfo = await FileSystem.getInfoAsync(cleanUri);
      if (!fileInfo.exists) {
        console.log('Ficheiro não encontrado no caminho:', cleanUri);
        setSnackBarText(t('serComerciante.error_file_access', { defaultValue: 'Erro ao aceder ao ficheiro selecionado.' }));
        setShowSnackBar(true);
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append('tituloComercio', formData.tituloComercio);
      data.append('donoComercio', formData.donoComercio);
      data.append('emailDono', formData.emailDono || '');
      data.append('telefoneDono', formData.telefoneDono || '');

      // Montamos o anexo com a URI perfeitamente limpa para o iOS
      const fileToUpload = {
        uri: cleanUri,
        type: 'application/pdf',
        name: 'documento.pdf', // Nome estático e curto evita quebras de cabeçalho HTTP
      };

      data.append('documentoPDF', fileToUpload as any);

      const response = await fetch(`${API_URL}/pedidoComerciante`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          Accept: 'application/json',
          // NOTA: Nunca colocar Content-Type aqui para FormData
        },
        body: data,
      });

      console.log('[FETCH] Status da Resposta:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('Sucesso no Backend:', responseData);

        setSnackBarText(t('serComerciante.success_sent', { defaultValue: 'Pedido enviado com sucesso!' }));
        setShowSnackBar(true);

        setFormData({
          tituloComercio: '',
          donoComercio: user.name || '',
          emailDono: '',
          telefoneDono: '',
          documentoPDF: null,
        });
      } else {
        const errorText = await response.text();
        console.log('Erro retornado pelo Servidor:', errorText);
        setSnackBarText(t('common.error_server', { status: response.status, defaultValue: `Erro no servidor: ${response.status}` }));
        setShowSnackBar(true);
      }
    } catch (err: any) {
      console.log('Erro apanhado no bloco try/catch:', err.message);
      setSnackBarText(t('common.error_network', { defaultValue: 'Erro na rede' }));
      setShowSnackBar(true);
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Surface
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
        }}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: theme.colors.background }}
          className="pt-20"
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
            {t('serComerciante.title', { defaultValue: 'Tornar-se um Comerciante' })}
          </Text>

          <CustomTextInput
            label={t('serComerciante.owner_name', { defaultValue: 'Dono do Comércio' })}
            value={user?.name || ''}
            onChangeText={text =>
              setFormData({ ...formData, donoComercio: text })
            }
          />

          <CustomTextInput
            label={t('serComerciante.owner_phone', { defaultValue: 'Telefone do Dono do Comércio' })}
            value={formData.telefoneDono}
            onChangeText={text =>
              setFormData({ ...formData, telefoneDono: text })
            }
          />

          <CustomTextInput
            label={t('serComerciante.owner_email', { defaultValue: 'E-mail do Dono do Comércio' })}
            value={user?.email || ''}
            onChangeText={text => setFormData({ ...formData, emailDono: text })}
          />

          <CustomTextInput
            label={t('serComerciante.company_name', { defaultValue: 'Nome da Empresa / Loja' })}
            value={formData.tituloComercio}
            onChangeText={text =>
              setFormData({ ...formData, tituloComercio: text })
            }
          />

          <Card
            style={{
              marginTop: 10,
              marginBottom: 20,
              backgroundColor: theme.colors.onBackground,
            }}
          >
            <Card.Content>
              <CustomButton 
                icon="file-upload" 
                onPress={handlePickDocument}
                accessibilityLabel={t('accessibility.select_pdf', { defaultValue: 'Selecionar documento PDF do dispositivo' })}
                accessibilityHint={t('accessibility.choose_pdf', { defaultValue: 'Clica para escolher um documento comprovativo' })}
              >
                {t('serComerciante.select_pdf', { defaultValue: 'Selecionar PDF' })}
              </CustomButton>

              {formData.documentoPDF && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: 12,
                  }}
                >
                  <Text
                    style={{
                      color: 'green',
                      fontWeight: '500',
                      flex: 1,
                      marginRight: 8,
                    }}
                  >
                    ✓ {formData.documentoPDF.name}
                  </Text>

                  <CustomButton
                    icon="eye"
                    loading={loadingPdf}
                    disabled={loadingPdf}
                    onPress={showModal}
                    accessibilityLabel={t('accessibility.view_selected_doc', { defaultValue: 'Visualizar documento selecionado' })}
                    accessibilityHint={t('accessibility.view_doc_chosen', { defaultValue: 'Clica para ver o documento que escolheste' })}
                  >
                    {t('common.view', { defaultValue: 'Visualizar' })}
                  </CustomButton>
                </View>
              )}
            </Card.Content>
          </Card>

          <CustomButton
            disabled={
              !formData.tituloComercio ||
              !formData.donoComercio ||
              !formData.documentoPDF
            }
            onPress={handleFinalSubmit}
            accessibilityLabel={t('accessibility.send_request_merchant', { defaultValue: 'Enviar solicitação para ser comerciante' })}
            accessibilityHint={t('accessibility.send_approval', { defaultValue: 'Clica para enviar o teu pedido para aprovação' })}
          >
            {t('serComerciante.send_request', { defaultValue: 'Enviar Solicitação' })}
          </CustomButton>
        </ScrollView>

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
                paddingHorizontal: 12,
                borderBottomWidth: 1,
                borderColor: '#eee',
                backgroundColor: '#f5f5f5',
              }}
            >
              <Text
                variant="titleMedium"
                style={{ flex: 1, fontWeight: 'bold' }}
                numberOfLines={1}
              >
                {formData.documentoPDF?.name}
              </Text>
              <IconButton 
                icon="close" 
                size={24} 
                onPress={hideModal} 
                accessible={true}
                accessibilityLabel={t('accessibility.close_pdf', { defaultValue: 'Fechar visualização do PDF' })}
              />
            </View>

            {pdfBase64 && (
              <WebView
                originWhitelist={['*']}
                source={{
                  html: `
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <style>
                        body, html { margin: 0; padding: 0; height: 100%; width: 100%; overflow: hidden; }
                        object { width: 100%; height: 100%; }
                      </style>
                    </head>
                    <body>
                      <object data="${pdfBase64}" type="application/pdf">
                        <embed src="${pdfBase64}" type="application/pdf" />
                      </object>
                    </body>
                  </html>
                `,
                }}
                style={{ flex: 1 }}
                scalesPageToFit={true}
              />
            )}
          </Modal>
        </Portal>
      </Surface>
    </>
  );
}
