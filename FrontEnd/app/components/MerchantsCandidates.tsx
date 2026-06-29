/**
 * MerchantsCandidates Screen
 *
 * Displays a list of pending merchant applications for City Council ('camara') approval.
 * It allows viewing the submitted PDF proof, approving the application (upgrading the user's role),
 * or discarding it (deleting the request and PDF from the server).
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import {
  Surface,
  Text,
  Divider,
  List,
  Button,
  Modal,
  Portal,
  Appbar,
  Dialog,
} from 'react-native-paper';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system/legacy';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';

// Components & Types
import CustomButton from './CustomButton';
import CustomDialog from './CustomDialog';
import CustomSnackBar from './CustomSnackBar';
import LoadingScreen from './LoadingScreen';
import PedidoComerciante from '@/constants/Interfaces/MerchantRequest';

export default function AprovarComerciantes() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  // Data state
  const [pedidosPendentes, setPendentes] = useState<PedidoComerciante[]>([]);

  // UI loading states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // PDF Preview Modal state
  const [visible, setVisible] = useState(false);
  const [pdfBase64, setPdf64] = useState<string | null>(null);
  const [nomePdfAtual, setNomePdfAtual] = useState('');

  // Feedback Dialogs state
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [discardId, setDiscardId] = useState<string | null>(null);

  // --- Handlers ---

  /** Fetches pending merchant applications from the backend. */
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
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.error_list'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load'));
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  }, [user?.token, t]);

  /** Pull-to-refresh handler. */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await carregarDados();
    } catch (err) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load_info'));
      setDialogVisible(true);
    } finally {
      setRefreshing(false);
    }
  }, [carregarDados, t]);

  /**
   * Downloads a PDF from the backend URL, converts it to Base64, and opens the preview modal.
   * React Native doesn't have a native PDF viewer, so we convert it to Base64 and render
   * it via a WebView using the pdf.js library.
   */
  const handleVerPDF = useCallback(
    async (url?: string, tituloLoja?: string) => {
      if (!url) {
        setDialogTitle(t('common.warning'));
        setDialogText(t('camara.no_pdf'));
        setDialogVisible(true);
        return;
      }

      // Ensure the URL is absolute (prepend API_URL if it's a relative path)
      let urlFormatada = url;
      if (!url.startsWith('http')) {
        const baseUrl = (API_URL ?? '').replace(/\/$/, '');
        urlFormatada = `${baseUrl}/${url.replace(/^\//, '')}`;
      }

      try {
        setLoadingPdf(true);
        setNomePdfAtual(
          t('camara.doc_title', {
            title:
              tituloLoja ||
              t('camara.default_commerce', { defaultValue: 'Comércio' }),
            defaultValue: `Doc - ${tituloLoja || 'Comércio'}`,
          }),
        );

        // Define a temporary path in the cache directory
        const localFileUri = `${FileSystem.cacheDirectory}preview.pdf`;

        // Download the PDF file
        const downloadResult = await FileSystem.downloadAsync(
          urlFormatada,
          localFileUri,
        );

        // Read the downloaded file as Base64 to inject into the WebView
        const base64 = await FileSystem.readAsStringAsync(downloadResult.uri, {
          encoding: 'base64',
        });

        setPdf64(`data:application/pdf;base64,${base64}`);
        setVisible(true);
      } catch (error) {
        console.error('Erro ao converter PDF:', error);
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.error_pdf'));
        setDialogVisible(true);
      } finally {
        setLoadingPdf(false);
      }
    },
    [t],
  );

  /** Closes the PDF preview modal and clears the Base64 data from memory. */
  const hideModal = useCallback(() => {
    setVisible(false);
    setPdf64(null);
  }, []);

  /** Opens the confirmation dialog before discarding an application. */
  const handleDescartar = useCallback((id: string) => {
    setDiscardId(id);
    setDiscardDialogVisible(true);
  }, []);

  /** Executes the discard API call after confirmation. Removes the item from local state on success. */
  const executeDescartar = useCallback(async () => {
    if (!discardId) return; // Safety check in case ID is null

    try {
      const response = await fetch(
        `${API_URL}/apagarPedidoComerciante/${discardId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${user?.token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.ok) {
        // Optimistic UI: Remove the item from the local list immediately
        setPendentes(prev => prev.filter(item => item._id !== discardId));
        setSnackbarMessage(
          t('camara.discard_success', {
            defaultValue: 'Pedido descartado com sucesso.',
          }),
        );
        setSnackbarVisible(true);
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.server_reject'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.fail_discard'));
      setDialogVisible(true);
    } finally {
      // Close dialog and clear ID regardless of outcome
      setDiscardDialogVisible(false);
      setDiscardId(null);
    }
  }, [discardId, user?.token, t]);

  /** Approves a merchant application and removes it from the local pending list. */
  const handleAprovar = useCallback(
    async (id: string) => {
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
          // Optimistic UI: Remove the approved item from the list
          setPendentes(prev => prev.filter(item => item._id !== id));
          setSnackbarMessage(t('camara.approved'));
          setSnackbarVisible(true);
        } else {
          console.log('Erro do servidor:', result);
          setDialogTitle(t('common.error'));
          setDialogText(result.message || t('camara.server_reject_approve'));
          setDialogVisible(true);
        }
      } catch (error) {
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.error_conn'));
        setDialogVisible(true);
      }
    },
    [user?.token, t],
  );

  // --- Effects ---

  // Initial data fetch
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while data is fetching.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Return (Loading State) ---
  // Placed after all hooks have been declared.
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('common.back_btn', { defaultValue: 'Voltar' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['left', 'right']}
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
                colors={[theme.colors.primary]} // Android
                tintColor={theme.colors.primary} // iOS
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
                  overflow: 'hidden', // Clips the TouchableRipple to the border radius
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
                  description={t('camara.merchant_desc', {
                    owner: item.donoComercio,
                    phone: item.telefoneDono,
                    email: item.emailDono,
                    defaultValue: `Dono: ${item.donoComercio}\nTel: ${item.telefoneDono}\nEmail: ${item.emailDono}`,
                  })}
                  descriptionNumberOfLines={3}
                  left={props => (
                    <List.Icon
                      {...props}
                      icon="file-pdf-box"
                      color={theme.colors.error}
                    />
                  )}
                />

                {/* View PDF Button */}
                <View className="px-4 pb-2">
                  <CustomButton
                    icon="eye"
                    loading={loadingPdf}
                    disabled={loadingPdf}
                    onPress={() =>
                      handleVerPDF(item.documentoPdfUrl, item.tituloComercio)
                    }
                    accessibilityLabel={t('accessibility.view_pdf_name', {
                      name: item.tituloComercio,
                      defaultValue: `Visualizar Documento PDF de ${item.tituloComercio}`,
                    })}
                    accessibilityHint={t('accessibility.read_doc')}
                  >
                    {t('merchant.view_pdf', {
                      defaultValue: 'Visualizar Documento PDF',
                    })}
                  </CustomButton>
                </View>

                <Divider
                  style={{
                    marginVertical: 8,
                    backgroundColor: theme.colors.outlineVariant,
                  }}
                />

                {/* Approve / Discard Actions */}
                <View className="flex-row gap-x-3 px-4 pb-4">
                  <CustomButton
                    className="flex-1"
                    onPress={() => handleAprovar(item._id)}
                    textColor={theme.colors.onPrimary}
                    buttonColor={theme.colors.primary}
                    accessibilityLabel={t('accessibility.accept_request_name', {
                      name: item.tituloComercio,
                      defaultValue: `Aceitar pedido de ${item.tituloComercio}`,
                    })}
                    accessibilityHint={t('accessibility.approve_merchant')}
                  >
                    {t('common.accept', { defaultValue: 'Aceitar' })}
                  </CustomButton>

                  <CustomButton
                    className="flex-1"
                    onPress={() => handleDescartar(item._id)}
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.onErrorContainer}
                    accessibilityLabel={t(
                      'accessibility.discard_request_name',
                      {
                        name: item.tituloComercio,
                        defaultValue: `Descartar pedido de ${item.tituloComercio}`,
                      },
                    )}
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

      {/* PDF Preview Modal */}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={{
            backgroundColor: theme.colors.background,
            margin: 20,
            borderRadius: 12,
            height: Dimensions.get('window').height * 0.75,
            overflow: 'hidden',
          }}
        >
          <Appbar.Header
            style={{
              backgroundColor: theme.colors.elevation.level2,
              height: 48,
            }}
          >
            <Appbar.Content
              title={nomePdfAtual || 'Documento'}
              titleStyle={{ fontSize: 16 }}
            />
            <Appbar.Action icon="close" onPress={hideModal} />
          </Appbar.Header>

          {pdfBase64 && (
            <WebView
              originWhitelist={['*']}
              style={{ flex: 1, backgroundColor: '#525659' }}
              source={{
                // React Native doesn't have a native PDF viewer. We use a WebView with pdf.js
                // loaded via CDN to render the Base64 PDF data cross-platform.
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js"></script>
                      <style>
                        body { 
                          margin: 0; 
                          padding: 10px; 
                          background-color: #525659; 
                          display: flex; 
                          flex-direction: column; 
                          align-items: center; 
                        }
                        canvas { 
                          margin-bottom: 10px; 
                          max-width: 100%; 
                          box-shadow: 0 4px 8px rgba(0,0,0,0.3); 
                        }
                        #loading { 
                          color: white; 
                          font-family: sans-serif; 
                          margin-top: 20px; 
                        }
                      </style>
                    </head>
                    <body>
                      <div id="loading">A processar documento...</div>
                      <div id="pdf-container"></div>
              
                      <script>
                        // Set the worker path for pdf.js
                        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';
                        
                        // Load the Base64 string directly into PDF.js
                        const loadingTask = pdfjsLib.getDocument('${pdfBase64}');
                        
                        loadingTask.promise.then(function(pdf) {
                          document.getElementById('loading').style.display = 'none';
                          const container = document.getElementById('pdf-container');
                          
                          // Loop through every page and render it to a canvas element
                          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                            pdf.getPage(pageNum).then(function(page) {
                              // Adjust scale based on screen size for better readability
                              const scale = window.innerWidth > 600 ? 1.5 : 1.0;
                              const viewport = page.getViewport({ scale: scale });
                              
                              const canvas = document.createElement('canvas');
                              const context = canvas.getContext('2d');
                              canvas.height = viewport.height;
                              canvas.width = viewport.width;
                              
                              container.appendChild(canvas);
                              
                              page.render({
                                canvasContext: context,
                                viewport: viewport
                              });
                            });
                          }
                        }).catch(function(error) {
                          document.getElementById('loading').innerText = 'Erro ao carregar o PDF: ' + error.message;
                        });
                      </script>
                    </body>
                  </html>
                `,
              }}
            />
          )}
        </Modal>
      </Portal>

      {/* Global UI Feedback Components */}
      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />

      <CustomDialog
        title={dialogTitle}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>

      {/* Discard Confirmation Dialog */}
      <Portal>
        <Dialog
          visible={discardDialogVisible}
          onDismiss={() => setDiscardDialogVisible(false)}
          style={{ backgroundColor: theme.colors.elevation.level3 }}
        >
          <Dialog.Title style={{ color: theme.colors.onSurface }}>
            {t('camara.discard_title', { defaultValue: 'Descartar Pedido' })}
          </Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {t('camara.discard_confirm', {
                defaultValue:
                  'Tem a certeza que deseja descartar este pedido? O documento associado será permanentemente apagado.',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => setDiscardDialogVisible(false)}
              textColor={theme.colors.onSurfaceVariant}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </Button>
            <Button onPress={executeDescartar} textColor={theme.colors.error}>
              {t('common.discard', { defaultValue: 'Descartar' })}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}
