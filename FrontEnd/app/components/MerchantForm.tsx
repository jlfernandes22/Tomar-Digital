/**
 * MerchantForm Screen
 *
 * Allows a standard citizen to apply to become a merchant.
 * The user fills out business details and uploads a PDF document as proof.
 * It includes a custom PDF preview modal using a WebView and pdf.js,
 * and handles secure multipart form-data uploads to the backend.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Dimensions } from 'react-native';
import { Text, Modal, Portal, Surface, Appbar } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { WebView } from 'react-native-webview';
import { router, Stack } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';
import * as FileSystem from 'expo-file-system/legacy';

// Components & Types
import CustomTextInput from './CustomTextInput';
import CustomButton from './CustomButton';
import LoadingScreen from './LoadingScreen';
import IComercianteForm from '@/constants/Interfaces/MerchantForm';

export default function MerchantForm() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [formData, setFormData] = useState<IComercianteForm>({
    tituloComercio: '',
    donoComercio: user?.name || '',
    emailDono: user?.email || '',
    telefoneDono: '',
    documentoPDF: null,
  });

  // UI State
  const [visible, setVisible] = useState(false); // Controls the PDF preview modal
  const [pdfBase64, setPdf64] = useState<string | null>(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loading, setLoading] = useState(false);

  // Feedback State
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarText, setSnackBarText] = useState('');

  // --- Effects ---

  /**
   * Syncs the user's name from AuthContext into the form state.
   * Ensures the "Owner Name" field is pre-filled but editable if the user updates their profile.
   */
  useEffect(() => {
    if (user?.name) {
      setFormData(prev => ({ ...prev, donoComercio: user.name }));
    }
  }, [user]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the form is submitting.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Handlers ---

  /** Opens the native document picker to select a PDF file. */
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true, // Copies to cache to ensure a stable file:// URI
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

  /** Reads the selected PDF as a Base64 string and opens the preview modal. */
  const showModal = async () => {
    if (!formData.documentoPDF?.uri) {
      alert(
        t('serComerciante.alert_select_file', {
          defaultValue: 'Por favor, selecione um arquivo primeiro.',
        }),
      );
      return;
    }

    try {
      setLoadingPdf(true);
      const cleanUri = decodeURIComponent(formData.documentoPDF.uri);

      // Read file as base64 to inject directly into the WebView's HTML
      const base64 = await FileSystem.readAsStringAsync(cleanUri, {
        encoding: 'base64',
      });

      setPdf64(`data:application/pdf;base64,${base64}`);
      setVisible(true);
    } catch (error) {
      console.log('Erro ao processar o PDF para o Modal:', error);
      alert(
        t('serComerciante.alert_preview_error', {
          defaultValue: 'Não foi possível gerar a pré-visualização.',
        }),
      );
    } finally {
      setLoadingPdf(false);
    }
  };

  /** Closes the PDF preview modal and clears the base64 data from memory. */
  const hideModal = () => {
    setVisible(false);
    setPdf64(null);
  };

  /** Validates the form and submits the merchant application with the PDF attachment. */
  const handleFinalSubmit = async () => {
    if (!user || !user.token) {
      setSnackBarText(
        t('serComerciante.error_session', {
          defaultValue: 'Sessão expirada. Faça login novamente.',
        }),
      );
      setShowSnackBar(true);
      return;
    }

    if (!formData.documentoPDF?.uri) {
      setSnackBarText(
        t('serComerciante.error_no_pdf', {
          defaultValue: 'Por favor, selecione um documento PDF.',
        }),
      );
      setShowSnackBar(true);
      return;
    }

    setLoading(true);

    try {
      const decodedUri = decodeURIComponent(formData.documentoPDF.uri);

      // Platform-specific fix: iOS requires the 'file://' prefix for local file uploads.
      // We ensure it's present exactly once to prevent network request failures.
      const cleanUri = decodedUri.startsWith('file://')
        ? decodedUri
        : `file://${decodedUri}`;

      // Verify the file actually exists on disk before attempting the upload
      const fileInfo = await FileSystem.getInfoAsync(cleanUri);
      if (!fileInfo.exists) {
        console.log('Ficheiro não encontrado no caminho:', cleanUri);
        setSnackBarText(
          t('serComerciante.error_file_access', {
            defaultValue: 'Erro ao aceder ao ficheiro selecionado.',
          }),
        );
        setShowSnackBar(true);
        setLoading(false);
        return;
      }

      // Construct multipart/form-data
      const data = new FormData();
      data.append('tituloComercio', formData.tituloComercio);
      data.append('donoComercio', formData.donoComercio);
      data.append('emailDono', formData.emailDono || '');
      data.append('telefoneDono', formData.telefoneDono || '');

      // Append the file. Using a static name 'documento.pdf' avoids HTTP header encoding issues.
      const fileToUpload = {
        uri: cleanUri,
        type: 'application/pdf',
        name: 'documento.pdf',
      };
      data.append('documentoPDF', fileToUpload as any);

      const response = await fetch(`${API_URL}/pedidoComerciante`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user.token}`,
          Accept: 'application/json',
          // Note: 'Content-Type' is intentionally omitted. React Native sets it automatically
          // with the correct boundary parameter for FormData.
        },
        body: data,
      });

      if (response.ok) {
        setSnackBarText(
          t('serComerciante.success_sent', {
            defaultValue: 'Pedido enviado com sucesso!',
          }),
        );
        setShowSnackBar(true);

        // Reset form on success
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
        setSnackBarText(
          t('common.error_server', {
            status: response.status,
            defaultValue: `Erro no servidor: ${response.status}`,
          }),
        );
        setShowSnackBar(true);
      }
    } catch (err: any) {
      console.log('Erro apanhado no bloco try/catch:', err.message);
      setSnackBarText(
        t('common.error_network', { defaultValue: 'Erro na rede' }),
      );
      setShowSnackBar(true);
    } finally {
      setLoading(false);
    }
  };

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

      <Surface
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
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
            {t('serComerciante.title', {
              defaultValue: 'Tornar-se um Comerciante',
            })}
          </Text>

          <CustomTextInput
            label={t('serComerciante.owner_name', {
              defaultValue: 'Dono do Comércio',
            })}
            value={user?.name || ''}
            onChangeText={text =>
              setFormData({ ...formData, donoComercio: text })
            }
            required
          />

          <CustomTextInput
            label={t('serComerciante.owner_phone', {
              defaultValue: 'Telefone do Dono do Comércio',
            })}
            value={formData.telefoneDono}
            onChangeText={text =>
              setFormData({ ...formData, telefoneDono: text })
            }
            required
            isNumber
          />

          <CustomTextInput
            label={t('serComerciante.owner_email', {
              defaultValue: 'E-mail do Dono do Comércio',
            })}
            value={user?.email || ''}
            onChangeText={text => setFormData({ ...formData, emailDono: text })}
            required
            isEmail
          />

          <CustomTextInput
            label={t('serComerciante.company_name', {
              defaultValue: 'Nome da Empresa / Loja',
            })}
            value={formData.tituloComercio}
            onChangeText={text =>
              setFormData({ ...formData, tituloComercio: text })
            }
            required
          />

          {/* PDF Upload Section */}
          <Surface style={{ marginTop: 10, marginBottom: 20 }}>
            <CustomButton
              icon="file-upload"
              onPress={handlePickDocument}
              accessibilityLabel={t('accessibility.select_pdf', {
                defaultValue: 'Selecionar documento PDF do dispositivo',
              })}
              accessibilityHint={t('accessibility.choose_pdf', {
                defaultValue: 'Clica para escolher um documento comprovativo',
              })}
            >
              {t('serComerciante.select_pdf', {
                defaultValue: 'Selecionar PDF',
              })}
            </CustomButton>

            {formData.documentoPDF && (
              <View>
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
                  accessibilityLabel={t('accessibility.view_selected_doc', {
                    defaultValue: 'Visualizar documento selecionado',
                  })}
                  accessibilityHint={t('accessibility.view_doc_chosen', {
                    defaultValue: 'Clica para ver o documento que escolheste',
                  })}
                >
                  {t('common.view', { defaultValue: 'Visualizar' })}
                </CustomButton>
              </View>
            )}
          </Surface>

          <CustomButton
            disabled={
              !formData.tituloComercio ||
              !formData.donoComercio ||
              !formData.documentoPDF
            }
            onPress={handleFinalSubmit}
            accessibilityLabel={t('accessibility.send_request_merchant', {
              defaultValue: 'Enviar solicitação para ser comerciante',
            })}
            accessibilityHint={t('accessibility.send_approval', {
              defaultValue: 'Clica para enviar o teu pedido para aprovação',
            })}
          >
            {t('serComerciante.send_request', {
              defaultValue: 'Enviar Solicitação',
            })}
          </CustomButton>
        </ScrollView>

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
                title={formData.documentoPDF?.name || 'Documento'}
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
      </Surface>
    </>
  );
}
