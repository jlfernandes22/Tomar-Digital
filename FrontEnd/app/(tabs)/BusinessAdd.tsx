/**
 * AddBusiness Screen
 *
 * A multi-step form (wizard) for merchants to register a new business.
 * It handles complex state management for form data, CAE codes, image uploads,
 * and map-based geolocation. Upon submission, it sends multipart/form-data
 * to the backend including images and JSON fields.
 */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Pressable } from 'react-native';
import {
  Surface,
  Text,
  ProgressBar,
  HelperText,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';

// Utils & Constants
import { delay } from '../../utils/delay';
import getAddress from '../../utils/getAddress';
import { pickImage } from '@/utils/imagePicker';

// Components
import Map from '@/app/components/Map';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import CustomChip from '../components/CustomChip';
import LoadingScreen from '../components/LoadingScreen';

import { useApiFetch } from '@/utils/apiFetch';
// Static configuration constants
const TOTAL_STEPS = 3;
const CATEGORIES = [
  'Património & Museus',
  'Restauração',
  'Cafés & Pastelarias',
  'Alojamento',
  'Comércio Local',
  'Lazer & Natureza',
  'Serviços',
];

export default function AddBusiness() {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { user } = useAuth();
  const { currentTheme: theme } = useAppTheme();
  const { setLoadingQR } = useLoadingState();
  const apiFetch = useApiFetch();

  // --- Form & UI State ---
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data initialized with user's email if available
  const [formData, setFormData] = useState({
    nomeNegocio: '',
    NIFnegocio: '',
    categoriaNegocio: '',
    logotipoNegocio: '',
    moradaNegocio: '',
    freguesiaNegocio: '',
    listaCAES: [] as string[],
    localizacao: { latitude: 0, longitude: 0 },
    telefoneDono: '',
    emailDono: user?.email ?? '',
    descricaoNegocio: '',
    galeriaFotos: [] as string[],
  });

  // CAE input specific state
  const [caeInput, setCaeInput] = useState('');
  const [erro, setErro] = useState('');

  // UI Feedback state
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  // --- Effects ---
  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the form is submitting.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Handlers ---

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  /** Validates and adds a 5-digit CAE code to the form data array. */
  const handleAdicionarCae = () => {
    if (caeInput.length !== 5 || isNaN(Number(caeInput))) {
      setErro(
        t('addBusiness.cae_length_error', {
          defaultValue: 'O CAE deve ter exatamente 5 números.',
        }),
      );
      return;
    }
    if (formData.listaCAES.includes(caeInput)) {
      setErro(
        t('addBusiness.cae_duplicate_error', {
          defaultValue: 'Este código CAE já foi adicionado.',
        }),
      );
      return;
    }

    setErro('');
    setFormData(prev => ({
      ...prev,
      listaCAES: [...prev.listaCAES, caeInput],
    }));
    setCaeInput('');
  };

  /** Removes a specific CAE code from the list. */
  const handleRemoverCae = (caeParaRemover: string) => {
    setFormData(prev => ({
      ...prev,
      listaCAES: prev.listaCAES.filter(c => c !== caeParaRemover),
    }));
  };

  /** Opens the image picker for a single logo image (1:1 aspect ratio). */
  const selecionarLogotipo = async () => {
    try {
      const resultado = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!resultado) return;

      const respostaObj = resultado as any;
      if (respostaObj?.assets?.length > 0) {
        setFormData(prev => ({
          ...prev,
          logotipoNegocio: respostaObj.assets[0].uri,
        }));
      } else if (typeof resultado === 'string') {
        setFormData(prev => ({ ...prev, logotipoNegocio: resultado }));
      }
    } catch (error: any) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('addBusiness.error_load_image', {
          defaultValue: `Erro ao carregar imagem: ${error.message}`,
        }),
      );
      setDialogVisible(true);
    }
  };

  /** Opens the image picker for multiple gallery images (up to 5). */
  const adicionarFotosGaleria = async () => {
    if (formData.galeriaFotos.length >= 5) {
      setDialogTitle(t('common.error'));
      setDialogText(t('addBusiness.imagesSelection'));
      setDialogVisible(true);
      return;
    }

    try {
      const resultado = await pickImage({
        allowsMultipleSelection: true,
        selectionLimit: 5,
        allowsEditing: false,
      });
      if (!resultado) return;

      const respostaObj = resultado as any;
      let novasUris: string[] = [];

      if (respostaObj?.assets) {
        novasUris = respostaObj.assets.map((asset: any) => asset.uri);
      } else if (Array.isArray(resultado)) {
        novasUris = resultado;
      } else if (typeof resultado === 'string') {
        novasUris = [resultado];
      }

      if (novasUris.length > 0) {
        setFormData(prev => ({
          ...prev,
          galeriaFotos: [...prev.galeriaFotos, ...novasUris],
        }));
      }
    } catch (error: any) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('addBusiness.error_load_gallery', {
          defaultValue: `Erro ao carregar galeria: ${error.message}`,
        }),
      );
      setDialogVisible(true);
    }
  };

  /** Removes an image from the gallery state by its index. */
  const handleRemoverFoto = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      galeriaFotos: prev.galeriaFotos.filter((_, i) => i !== indexToRemove),
    }));
  };

  /**
   * Main submission handler.
   * Validates required fields, constructs multipart/form-data (for file uploads),
   * and sends the request to the backend.
   */
  const handleNewBusiness = async () => {
    if (!user?.token) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('addBusiness.error_session_expired', {
          defaultValue: 'Erro: Sessão expirada.',
        }),
      );
      setDialogVisible(true);
      return;
    }

    if (
      !formData.nomeNegocio ||
      !formData.categoriaNegocio ||
      !formData.telefoneDono ||
      !formData.emailDono
    ) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('addBusiness.error_mandatory_fields', {
          defaultValue:
            'Erro:\nPor favor, preencha todos os campos obrigatórios.',
        }),
      );
      setDialogVisible(true);
      return;
    }

    setLoading(true);
    try {
      const dataToSend = new FormData();

      // Append text fields
      dataToSend.append('nomeNegocio', formData.nomeNegocio);
      dataToSend.append('NIFnegocio', formData.NIFnegocio);
      dataToSend.append('categoriaNegocio', formData.categoriaNegocio);
      dataToSend.append('moradaNegocio', formData.moradaNegocio);
      dataToSend.append('freguesiaNegocio', formData.freguesiaNegocio);
      dataToSend.append('telefoneDono', formData.telefoneDono);
      dataToSend.append('emailDono', formData.emailDono);
      dataToSend.append('descricaoNegocio', formData.descricaoNegocio);
      dataToSend.append('owner', user.id);

      // Append arrays/objects as JSON strings
      if (formData.listaCAES.length > 0) {
        dataToSend.append('listaCAES', JSON.stringify(formData.listaCAES));
      }
      if (formData.localizacao.latitude && formData.localizacao.longitude) {
        dataToSend.append('localizacao', JSON.stringify(formData.localizacao));
      }

      // Append Logo File
      if (formData.logotipoNegocio) {
        const filename =
          formData.logotipoNegocio.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        dataToSend.append('logo', {
          uri: formData.logotipoNegocio,
          name: filename,
          type,
        } as any);
      }

      // Append Gallery Files
      formData.galeriaFotos.forEach(fotoUri => {
        const filename = fotoUri.split('/').pop() || 'foto.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;
        dataToSend.append('galeria', {
          uri: fotoUri,
          name: filename,
          type,
        } as any);
      });

      const response = await apiFetch(`/registarNegocio`, {
        method: 'POST',
        headers: {
          // Note: 'Content-Type' is intentionally omitted. React Native's fetch
          // sets it automatically with the correct boundary parameter for FormData.
        },
        body: dataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(
          t('addBusiness.success_registered', {
            defaultValue: 'Sucesso! Negócio registado.',
          }),
        );
        setSnackbarVisible(true);
        await delay(500);
        router.back();
        setStep(1); // Reset wizard on success
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(data.message || data.erro || JSON.stringify(data));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('addBusiness.error_server_conn', {
          defaultValue: 'Erro de ligação ao servidor.',
        }),
      );
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Early Return for Loading State ---
  // This must be placed AFTER all hooks (useEffect, useState) have been declared.
  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView
        style={{ flex: 1, padding: 16 }}
        edges={['top', 'left', 'right']}
      >
        {/* Progress Indicator */}
        <Text style={{ textAlign: 'right', marginBottom: 5 }}>
          {t('addBusiness.step_info', {
            step,
            totalSteps: TOTAL_STEPS,
            defaultValue: `Passo ${step} de ${TOTAL_STEPS}`,
          })}
        </Text>
        <ProgressBar
          progress={step / TOTAL_STEPS}
          color={theme.colors.primary}
          style={{ marginBottom: 20 }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: Business Identity */}
          {step === 1 && (
            <View>
              <Text
                variant="headlineSmall"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                }}
              >
                {t('addBusiness.new_business', {
                  defaultValue: 'Novo Negócio',
                })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.business_name', {
                  defaultValue: 'Nome do Negócio',
                })}
                value={formData.nomeNegocio}
                onChangeText={t => setFormData({ ...formData, nomeNegocio: t })}
                lenght={100}
                required
              />
              <CustomTextInput
                label={t('addBusiness.nif', { defaultValue: 'NIF' })}
                value={formData.NIFnegocio}
                onChangeText={t => setFormData({ ...formData, NIFnegocio: t })}
                isNumber
                lenght={9}
                required
              />

              {/* CAE Codes Section */}
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  margin: 10,
                }}
              >
                {t('addBusiness.business_caes', {
                  defaultValue: 'CAES do Negócio',
                })}
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <CustomTextInput
                  label={t('addBusiness.add_cae', {
                    defaultValue: 'Adicionar CAE',
                  })}
                  placeholder={t('addBusiness.cae_placeholder', {
                    defaultValue: 'Ex: 01111',
                  })}
                  lenght={5}
                  isNumber
                  value={caeInput}
                  onChangeText={text => {
                    setErro('');
                    setCaeInput(text.replace(/[^0-9]/g, ''));
                  }}
                  className="flex-1"
                  required={formData.listaCAES.length === 0}
                />
                <CustomButton
                  onPress={handleAdicionarCae}
                  accessibilityLabel={t('addBusiness.add_cae', {
                    defaultValue: 'Adicionar CAE',
                  })}
                >
                  +
                </CustomButton>
              </View>

              <HelperText
                type="error"
                visible={!!erro}
                style={{ paddingHorizontal: 0 }}
              >
                {erro}
              </HelperText>

              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginBottom: 10,
                }}
              >
                {formData.listaCAES.map(cae => (
                  <View
                    key={cae}
                    style={{
                      position: 'relative',
                      paddingTop: 4,
                      paddingRight: 4,
                    }}
                  >
                    <CustomChip isSelected={true} icon="tag" onPress={() => {}}>
                      {cae}
                    </CustomChip>
                    <View
                      style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        backgroundColor: '#ef4444',
                        borderRadius: 10,
                        width: 20,
                        height: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderColor: '#fff',
                        borderWidth: 1,
                        elevation: 2,
                      }}
                    >
                      <Pressable
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={`Remover CAE ${cae}`}
                        onPress={() => handleRemoverCae(cae)}
                        hitSlop={10}
                      >
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 'bold',
                            lineHeight: 12,
                          }}
                        >
                          X
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>

              {/* Categories */}
              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  margin: 10,
                }}
              >
                {t('addBusiness.business_category', {
                  defaultValue: 'Categoria do Negócio',
                })}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 15 }}
                style={{ flexDirection: 'row' }}
              >
                {CATEGORIES.map(cat => (
                  <CustomChip
                    key={cat}
                    isSelected={formData.categoriaNegocio === cat}
                    onPress={() =>
                      setFormData({ ...formData, categoriaNegocio: cat })
                    }
                  >
                    {t(`categories.${cat}`, { defaultValue: cat })}
                  </CustomChip>
                ))}
              </ScrollView>

              {/* Logo Upload */}
              <View
                style={{ width: '100%', alignItems: 'center', marginTop: 10 }}
              >
                <Text
                  variant="labelLarge"
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    textAlign: 'center',
                  }}
                >
                  {t('addBusiness.business_logo', {
                    defaultValue: 'Logótipo do Estabelecimento',
                  })}
                </Text>
                <CustomButton icon="image" onPress={selecionarLogotipo}>
                  {formData.logotipoNegocio
                    ? t('addBusiness.change_logo', {
                        defaultValue: 'Alterar Logótipo',
                      })
                    : t('addBusiness.upload_logo', {
                        defaultValue: 'Upload Logótipo',
                      })}
                </CustomButton>
                {formData.logotipoNegocio && (
                  <Image
                    source={{ uri: formData.logotipoNegocio }}
                    style={{
                      width: 140,
                      height: 140,
                      borderRadius: 8,
                      marginTop: 10,
                    }}
                  />
                )}
              </View>
            </View>
          )}

          {/* STEP 2: Location & Geolocation */}
          {step === 2 && (
            <View>
              <Text
                variant="headlineSmall"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  margin: 10,
                }}
              >
                {t('addBusiness.location_title', {
                  defaultValue: 'Localização',
                })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.full_address', {
                  defaultValue: 'Morada completa do negócio',
                })}
                placeholder={t('addBusiness.address_placeholder', {
                  defaultValue: 'Ex: Rua, nº, Tomar',
                })}
                value={formData.moradaNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, moradaNegocio: t })
                }
                required
              />
              <CustomTextInput
                label={t('addBusiness.parish', { defaultValue: 'Freguesia' })}
                placeholder={t('addBusiness.parish_placeholder', {
                  defaultValue: 'Ex: São João Baptista',
                })}
                value={formData.freguesiaNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, freguesiaNegocio: t })
                }
                required
              />

              <View
                style={{
                  marginTop: 15,
                  height: 320,
                  borderRadius: 10,
                  overflow: 'hidden',
                }}
              >
                <Map
                  showPin={true}
                  onLocationSelect={async location => {
                    if (!location || typeof location.latitude !== 'number')
                      return;

                    setFormData(prev => ({
                      ...prev,
                      localizacao: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                      },
                    }));

                    try {
                      const { latitude, longitude } = location;
                      const address = await getAddress({ latitude, longitude });
                      if (address && address !== 'undefined') {
                        setFormData(prev => ({
                          ...prev,
                          moradaNegocio: address,
                        }));
                      }
                    } catch (err: any) {
                      console.error('Erro ao converter coordenadas:', err);
                      setDialogTitle(t('common.error'));
                      setDialogText(
                        t('addBusiness.error_geocode', {
                          defaultValue: `Erro ao obter a morada: ${err?.message}`,
                        }),
                      );
                      setDialogVisible(true);
                    }
                  }}
                />
              </View>
            </View>
          )}

          {/* STEP 3: Contact & Gallery */}
          {step === 3 && (
            <View>
              <Text
                variant="headlineSmall"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  margin: 10,
                }}
              >
                {t('addBusiness.contact_info', {
                  defaultValue: 'Informações de Contacto',
                })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.owner_phone', {
                  defaultValue: 'Telefone do Dono',
                })}
                value={formData.telefoneDono}
                onChangeText={t =>
                  setFormData({ ...formData, telefoneDono: t })
                }
                isNumber
                lenght={12}
                required
              />
              <CustomTextInput
                label={t('addBusiness.owner_email', {
                  defaultValue: 'E-mail do Dono',
                })}
                value={formData.emailDono}
                onChangeText={t => setFormData({ ...formData, emailDono: t })}
                isEmail
                lenght={50}
                required
              />
              <CustomTextInput
                label={t('addBusiness.business_desc', {
                  defaultValue: 'Descrição Detalhada do Negócio',
                })}
                value={formData.descricaoNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, descricaoNegocio: t })
                }
                multiline={true}
                lenght={250}
                required
              />

              <Text
                variant="titleMedium"
                style={{
                  color: theme.colors.primary,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  textAlign: 'center',
                  margin: 10,
                }}
              >
                {t('addBusiness.photo_gallery', {
                  count: formData.galeriaFotos.length,
                  defaultValue: `Galeria de Fotos (${formData.galeriaFotos.length}/5)`,
                })}
              </Text>

              <CustomButton icon="file-image" onPress={adicionarFotosGaleria}>
                {t('addBusiness.add_images', {
                  defaultValue: 'Adicionar Imagens',
                })}
              </CustomButton>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingVertical: 10,
                  paddingHorizontal: 4,
                  gap: 16,
                }}
                style={{ flexDirection: 'row', marginTop: 10, minHeight: 110 }}
              >
                {formData.galeriaFotos.map((uri, index) =>
                  uri ? (
                    <View
                      key={index}
                      style={{ position: 'relative', width: 90, height: 90 }}
                    >
                      <Image
                        source={{ uri }}
                        style={{
                          width: 90,
                          height: 90,
                          borderRadius: 8,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                        resizeMode="cover"
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        iconColor={theme.colors.error}
                        style={{
                          position: 'absolute',
                          top: -12,
                          right: -12,
                          backgroundColor: theme.colors.surface,
                          margin: 0,
                          elevation: 4,
                          zIndex: 10,
                        }}
                        onPress={() => handleRemoverFoto(index)}
                      />
                    </View>
                  ) : null,
                )}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        {/* Navigation Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
          }}
        >
          {step > 1 && (
            <CustomButton onPress={prevStep}>
              {t('common.back', { defaultValue: 'Anterior' })}
            </CustomButton>
          )}

          {step < TOTAL_STEPS ? (
            <CustomButton onPress={nextStep}>
              {t('common.next', { defaultValue: 'Próximo' })}
            </CustomButton>
          ) : (
            <CustomButton loading={loading} onPress={handleNewBusiness}>
              {t('addBusiness.send_business', {
                defaultValue: 'Enviar Negócio',
              })}
            </CustomButton>
          )}
        </View>
      </SafeAreaView>

      {/* Global UI Feedback */}
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
    </Surface>
  );
}
