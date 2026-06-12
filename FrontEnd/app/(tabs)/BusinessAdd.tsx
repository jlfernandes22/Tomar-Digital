import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Pressable } from 'react-native';
import {
  Surface,
  Text,
  ProgressBar,
  HelperText,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import Map from '@/app/components/Map';
import { delay } from '../../utils/delay';
import CustomTextInput from '../components/CustomTextInput';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import CustomChip from '../components/CustomChip';
import { pickImage } from '@/utils/imagePicker';
import { router } from 'expo-router';
import getAddress from '../../utils/getAddress';
import { IconButton } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';

export default function AddBusiness() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const INITIAL_FORM_DATA = {
    nomeNegocio: '',
    NIFnegocio: '',
    categoriaNegocio: '',
    logotipoNegocio: '',
    moradaNegocio: '',
    freguesiaNegocio: '',
    listaCAES: [] as string[],
    localizacao: {
      latitude: 0,
      longitude: 0,
    },
    telefoneDono: '',
    emailDono: '',
    descricaoNegocio: '',
    galeriaFotos: [] as string[],
  };
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [caeInput, setCaeInput] = useState('');
  const [erro, setErro] = useState('');

  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  const { currentTheme: theme } = useAppTheme();

  const categories = [
    'Património & Museus',
    'Restauração',
    'Cafés & Pastelarias',
    'Alojamento',
    'Comércio Local',
    'Lazer & Natureza',
    'Serviços',
  ];

  const selecionarLogotipo = async () => {
    try {
      const resultado = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
      });

      if (!resultado) return;

      const respostaObj = resultado as any;

      // Verifica se é o formato de objeto do Expo ImagePicker com .assets
      if (
        respostaObj &&
        typeof respostaObj === 'object' &&
        'assets' in respostaObj &&
        respostaObj.assets &&
        respostaObj.assets.length > 0
      ) {
        const uriLogotipo = respostaObj.assets[0].uri;
        setFormData({ ...formData, logotipoNegocio: uriLogotipo });
      }
      // Fallback caso o teu utilitário já devolva a string direta
      else if (typeof resultado === 'string') {
        setFormData({ ...formData, logotipoNegocio: resultado });
      }
    } catch (error: any) {
      setDialogTitle(t('common.error'));
      setDialogText(t('addBusiness.error_load_image', { error: error.message, defaultValue: `Erro ao carregar imagem: ${error.message}` }));
      setDialogVisible(true);
    }
  };

  const adicionarFotosGaleria = async () => {
    try {
      const resultado = await pickImage({
        allowsMultipleSelection: true,
        selectionLimit: 5,
        allowsEditing: false,
      });

      if (!resultado) return;

      const respostaObj = resultado as any;

      // Verifica se veio o objeto contendo o array 'assets'
      if (
        respostaObj &&
        typeof respostaObj === 'object' &&
        'assets' in respostaObj &&
        respostaObj.assets
      ) {
        const novasUris = respostaObj.assets.map((asset: any) => asset.uri);
        setFormData({
          ...formData,
          galeriaFotos: [...formData.galeriaFotos, ...novasUris],
        });
      }
      // Se o teu utilitário já devolver diretamente um Array de strings
      else if (Array.isArray(resultado)) {
        setFormData({
          ...formData,
          galeriaFotos: [...formData.galeriaFotos, ...resultado],
        });
      }
      // Se devolver uma única string
      else if (typeof resultado === 'string') {
        setFormData({
          ...formData,
          galeriaFotos: [...formData.galeriaFotos, resultado],
        });
      }
    } catch (error: any) {
      setDialogTitle(t('common.error'));
      setDialogText(t('addBusiness.error_load_gallery', { error: error.message, defaultValue: `Erro ao carregar galeria: ${error.message}` }));
      setDialogVisible(true);
    }
  };

  const handleNewBusiness = async () => {
    if (!user?.token) {
      setDialogTitle(t('common.error'));
      setDialogText(t('addBusiness.error_session_expired', { defaultValue: 'Erro: Sessão expirada.' }));
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
      setDialogText(t('addBusiness.error_mandatory_fields', { defaultValue: 'Erro:\nPor favor, preencha todos os campos obrigatórios.' }));
      setDialogVisible(true);
      return;
    }

    setLoading(true);
    try {
      const dataToSend = new FormData();
      dataToSend.append('nomeNegocio', formData.nomeNegocio);
      dataToSend.append('NIFnegocio', formData.NIFnegocio);
      dataToSend.append('categoriaNegocio', formData.categoriaNegocio);
      dataToSend.append('moradaNegocio', formData.moradaNegocio);
      dataToSend.append('freguesiaNegocio', formData.freguesiaNegocio);
      dataToSend.append('telefoneDono', formData.telefoneDono);
      dataToSend.append('emailDono', formData.emailDono);
      dataToSend.append('descricaoNegocio', formData.descricaoNegocio);

      if (user?.id) {
        dataToSend.append('owner', user.id);
      }

      if (formData.listaCAES && formData.listaCAES.length > 0) {
        dataToSend.append('listaCAES', JSON.stringify(formData.listaCAES));
      }

      if (
        formData.localizacao &&
        formData.localizacao.latitude &&
        formData.localizacao.longitude
      ) {
        dataToSend.append(
          'localizacao',
          JSON.stringify({
            latitude: formData.localizacao.latitude,
            longitude: formData.localizacao.longitude,
          }),
        );
      }

      // Adicionar o Logótipo
      if (formData.logotipoNegocio) {
        const logoUri = formData.logotipoNegocio;
        const filename = logoUri.split('/').pop() || 'logo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        dataToSend.append('logo', {
          uri: logoUri,
          name: filename,
          type,
        } as any);
      }

      // Adicionar as Fotos da Galeria
      if (formData.galeriaFotos && formData.galeriaFotos.length > 0) {
        formData.galeriaFotos.forEach((fotoUri: string) => {
          const filename = fotoUri.split('/').pop() || 'foto.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image`;

          dataToSend.append('galeria', {
            uri: fotoUri,
            name: filename,
            type,
          } as any);
        });
      }

      const response = await fetch(`${API_URL}/registarNegocio`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          // Nota: O 'Content-Type': 'multipart/form-data' é omitido propositadamente
          // para que o fetch do React Native crie o cabeçalho correto com o 'boundary'.
        },
        body: dataToSend,
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage(t('addBusiness.success_registered', { defaultValue: 'Sucesso! Negócio registado.' }));
        setSnackbarVisible(true);
        await delay(500);
        setFormData(INITIAL_FORM_DATA);
        router.back();
        setStep(1);
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(data.message || t('addBusiness.error_registration', { defaultValue: 'Erro no registo.' }));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('addBusiness.error_server_conn', { defaultValue: 'Erro de ligação ao servidor.' }));
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleAdicionarCae = () => {
    if (caeInput.length !== 5 || isNaN(Number(caeInput))) {
      setErro(t('addBusiness.cae_length_error', { defaultValue: 'O CAE deve ter exatamente 5 números.' }));
      return;
    }
    if (formData.listaCAES.includes(caeInput)) {
      setErro(t('addBusiness.cae_duplicate_error', { defaultValue: 'Este código CAE já foi adicionado.' }));
      return;
    }
    setErro('');
    setFormData({
      ...formData,
      listaCAES: [...formData.listaCAES, caeInput],
    });
    setCaeInput('');
  };

  const handleRemoverCae = (caeParaRemover: string) => {
    setFormData({
      ...formData,
      listaCAES: formData.listaCAES.filter(c => c !== caeParaRemover),
    });
  };

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView
        style={{ flex: 1, padding: 16 }}
        edges={['top', 'left', 'right']}
      >
        {/* Barra de Progresso e Paginação Baseada no CreateCampaign */}
        <Text style={{ textAlign: 'right', marginBottom: 5 }}>
          {t('addBusiness.step_info', { step, totalSteps, defaultValue: `Passo ${step} de ${totalSteps}` })}
        </Text>
        <ProgressBar
          progress={step / totalSteps}
          color={theme.colors.primary}
          style={{ marginBottom: 20 }}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* STEP 1: IDENTIDADE DO ESTABELECIMENTO */}
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
                {t('addBusiness.new_business', { defaultValue: 'Novo Negócio' })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.business_name', { defaultValue: 'Nome do Negócio' })}
                value={formData.nomeNegocio}
                onChangeText={t => setFormData({ ...formData, nomeNegocio: t })}
              />

              <TextInput
                label={t('addBusiness.nif', { defaultValue: 'NIF' })}
                value={formData.NIFnegocio}
                onChangeText={t => setFormData({ ...formData, NIFnegocio: t })}
                keyboardType="numeric"
                maxLength={9}
              />

              {/* Módulo de CAEs Baseado Inteiramente no Modelo do CreateCampaign */}
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
                {t('addBusiness.business_caes', { defaultValue: 'CAES do Negócio' })}
              </Text>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <TextInput
                  label={t('addBusiness.add_cae', { defaultValue: 'Adicionar CAE' })}
                  placeholder={t('addBusiness.cae_placeholder', { defaultValue: 'Ex: 01111' })}
                  maxLength={5}
                  keyboardType="numeric"
                  value={caeInput}
                  onChangeText={text => {
                    setErro('');
                    setCaeInput(text.replace(/[^0-9]/g, ''));
                  }}
                  style={{ flex: 1 }}
                />
                <CustomButton 
                  onPress={handleAdicionarCae}
                  accessibilityLabel={t('addBusiness.add_cae', { defaultValue: 'Adicionar CAE' })}
                  accessibilityHint={t('accessibility.add_cae_list', { defaultValue: 'Clica para adicionar o código CAE à lista' })}
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
                        accessibilityLabel={t('accessibility.remove_cae_name', { name: cae, defaultValue: `Remover CAE ${cae}` })}
                        accessibilityHint={t('accessibility.remove_cae', { defaultValue: 'Clica para remover este CAE' })}
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

              {/* Categorias */}
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
                {t('addBusiness.business_category', { defaultValue: 'Categoria do Negócio' })}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 15 }}
                style={{ flexDirection: 'row' }}
              >
                {categories.map(cat => (
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

              {/* Upload do Logótipo */}
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
                  {t('addBusiness.business_logo', { defaultValue: 'Logótipo do Estabelecimento' })}
                </Text>
                <CustomButton 
                  icon="image" 
                  onPress={selecionarLogotipo}
                  accessibilityLabel={formData.logotipoNegocio ? t('addBusiness.change_logo', { defaultValue: 'Alterar Logótipo' }) : t('addBusiness.upload_logo', { defaultValue: 'Upload Logótipo' })}
                  accessibilityHint={t('accessibility.choose_business_image', { defaultValue: 'Clica para escolher uma imagem do estabelecimento' })}
                >
                  {formData.logotipoNegocio ? t('addBusiness.change_logo', { defaultValue: 'Alterar Logótipo' }) : t('addBusiness.upload_logo', { defaultValue: 'Upload Logótipo' })}
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

          {/* STEP 2: ENDEREÇOS E GEOLOCALIZAÇÃO */}
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
                {t('addBusiness.location_title', { defaultValue: 'Localização' })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.full_address', { defaultValue: 'Morada completa do negócio' })}
                placeholder={t('addBusiness.address_placeholder', { defaultValue: 'Ex: Rua, nº, Tomar' })}
                value={formData.moradaNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, moradaNegocio: t })
                }
              />

              <CustomTextInput
                label={t('addBusiness.parish', { defaultValue: 'Freguesia' })}
                placeholder={t('addBusiness.parish_placeholder', { defaultValue: 'Ex: São João Baptista' })}
                value={formData.freguesiaNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, freguesiaNegocio: t })
                }
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
                    } catch (err) {
                      console.error('Erro ao converter coordenadas:', err);
                    }
                  }}
                />
              </View>
            </View>
          )}

          {/* STEP 3: CONTACTOS GERAIS E GALERIA CORRIGIDA */}
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
                {t('addBusiness.contact_info', { defaultValue: 'Informações de Contacto' })}
              </Text>

              <CustomTextInput
                label={t('addBusiness.owner_phone', { defaultValue: 'Telefone do Dono' })}
                value={formData.telefoneDono}
                onChangeText={t =>
                  setFormData({ ...formData, telefoneDono: t })
                }
                keyboardType="phone-pad"
              />
              <CustomTextInput
                label={t('addBusiness.owner_email', { defaultValue: 'E-mail do Dono' })}
                value={formData.emailDono}
                onChangeText={t => setFormData({ ...formData, emailDono: t })}
                keyboardType="email-address"
              />
              <CustomTextInput
                label={t('addBusiness.business_desc', { defaultValue: 'Descrição Detalhada do Negócio' })}
                value={formData.descricaoNegocio}
                onChangeText={t =>
                  setFormData({ ...formData, descricaoNegocio: t })
                }
                multiline={true}
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
                {t('addBusiness.photo_gallery', { count: formData.galeriaFotos.length, defaultValue: `Galeria de Fotos (${formData.galeriaFotos.length}/5)` })}
              </Text>

              <CustomButton 
                icon="file-image" 
                onPress={adicionarFotosGaleria}
                accessibilityLabel={t('addBusiness.add_images', { defaultValue: 'Adicionar imagens à galeria' })}
                accessibilityHint={t('accessibility.choose_images_limit', { defaultValue: 'Clica para escolher até 5 imagens' })}
              >
                {t('addBusiness.add_images', { defaultValue: 'Adicionar Imagens' })}
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
                        accessible={true}
                        accessibilityLabel={t('accessibility.remove_image', { defaultValue: 'Remover imagem' })}
                        accessibilityHint={t('accessibility.remove_image_gallery', { defaultValue: 'Clica para remover esta imagem da galeria' })}
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
                        onPress={() => {
                          const novaLista = formData.galeriaFotos.filter(
                            (_, i) => i !== index,
                          );
                          setFormData({ ...formData, galeriaFotos: novaLista });
                        }}
                      />
                    </View>
                  ) : null,
                )}
              </ScrollView>
            </View>
          )}
        </ScrollView>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginTop: 20,
          }}
        >
          {step > 1 && <CustomButton accessibilityLabel={t('addBusiness.prev_step', { defaultValue: 'Voltar ao passo anterior' })} onPress={prevStep}>{t('common.back', { defaultValue: 'Anterior' })}</CustomButton>}

          {step < totalSteps ? (
            <CustomButton accessibilityLabel={t('addBusiness.next_step', { defaultValue: 'Avançar para o próximo passo' })} onPress={nextStep}>{t('common.next', { defaultValue: 'Próximo' })}</CustomButton>
          ) : (
            <CustomButton 
              loading={loading} 
              onPress={handleNewBusiness}
              accessibilityLabel={t('addBusiness.submit_register', { defaultValue: 'Submeter e registar negócio' })}
              accessibilityHint={t('accessibility.submit_business', { defaultValue: 'Clica para enviar os dados do teu negócio para aprovação' })}
            >
              {t('addBusiness.send_business', { defaultValue: 'Enviar Negócio' })}
            </CustomButton>
          )}
        </View>
      </SafeAreaView>

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
