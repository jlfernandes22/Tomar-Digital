/**
 * CampaignCreate Screen
 *
 * A multi-step form (wizard) for the City Council ('camara') to create
 * new marketing campaigns. It handles text fields, CAE code tags, image uploads,
 * date picking, and dynamic reward pack creation. Submits data as multipart/form-data.
 */
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Image,
  Pressable,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import {
  ActivityIndicator,
  Surface,
  Text,
  ProgressBar,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomTextInput from './CustomTextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from './CustomButton';
import CustomSnackBar from './CustomSnackBar';
import CustomDialog from './CustomDialog';
import CustomChip from './CustomChip';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import LoadingScreen from './LoadingScreen';
import { router, Stack } from 'expo-router';
import { Appbar } from 'react-native-paper';
import PacketInterface from '@/constants/Interfaces/PacketInterface';

// --- Constants & Interfaces ---
const TOTAL_STEPS = 3;

interface ICampanhaForm {
  tituloCampanha: string;
  slogan: string;
  descricaoCampanha: string;
  listaCAES: string[];
  dataExpiracao: Date;
  dataInicio: Date;
  normas: string;
  logo: string;
  panfleto: string;
  pacotes: PacketInterface[];
}

const CreateCampaign = () => {
  // --- Hooks (Context & Global State) ---
  const { t, i18n } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState();

  // --- Local State ---
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ICampanhaForm>({
    tituloCampanha: '',
    slogan: '',
    descricaoCampanha: '',
    listaCAES: [],
    dataExpiracao: new Date(),
    dataInicio: new Date(),
    normas: '',
    logo: '',
    panfleto: '',
    pacotes: [],
  });

  // State for the dynamic "Reward Pack" creator
  const [pacote, setPacote] = useState({
    descricaoRecompensa: '',
    custoEmPontos: '',
    stockInicial: '',
    maximoPorUser: '1',
  });

  // CAE input specific state
  const [caeInput, setCaeInput] = useState('');
  const [erro, setErro] = useState('');

  // UI Feedback & Loading state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logoLoading, setLogoLoading] = useState(false);
  const [panfletoLoading, setPanfletoLoading] = useState(false);
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

  /** Updates the expiration date state from the DateTimePicker component. */
  const onChangeDate = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({ ...prev, dataExpiracao: selectedDate }));
    }
  };

  /** Validates the current pack inputs and appends it to the formData.pacotes array. */
  const addPack = () => {
    setLoading(true);
    const { descricaoRecompensa, custoEmPontos, stockInicial } = pacote;

    if (!descricaoRecompensa || !custoEmPontos || !stockInicial) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('campaign.error_empty_pack', {
          defaultValue:
            'Erro: Preencha a descrição, o custo e o stock do pacote.',
        }),
      );
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    try {
      const newPack = {
        custoEmPontos: Number(custoEmPontos),
        descricaoRecompensa: descricaoRecompensa,
        stockInicial: Number(stockInicial),
        stockAtual: Number(stockInicial),
        maximoPorUser: Number(pacote.maximoPorUser || 1),
      };

      setFormData(prevState => ({
        ...prevState,
        pacotes: [...prevState.pacotes, newPack],
      }));

      // Reset pack input fields
      setPacote({
        descricaoRecompensa: '',
        custoEmPontos: '',
        stockInicial: '',
        maximoPorUser: '1',
      });
      setSnackbarMessage(
        t('campaign.success_add_pack', {
          defaultValue: 'Pacote adicionado com sucesso!',
        }),
      );
      setSnackbarVisible(true);
    } catch (err) {
      console.error('Erro na adição do pacote: ', err);
      setDialogTitle(t('common.error'));
      setDialogText(
        t('campaign.error_format_pack', {
          defaultValue: 'Erro ao formatar os dados do pacote.',
        }),
      );
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  /** Requests gallery permissions and launches the image picker for the campaign logo. */
  const selecionarLogo = async () => {
    setLogoLoading(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setDialogTitle(t('common.warning'));
      setDialogText(
        t('campaign.need_photo_logo', {
          defaultValue:
            'Precisamos de acesso às tuas fotos para carregares o logótipo da campanha!',
        }),
      );
      setDialogVisible(true);
      setLogoLoading(false);
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!resultado.canceled) {
      setFormData(prev => ({ ...prev, logo: resultado.assets[0].uri }));
    }
    setLogoLoading(false);
  };

  /** Requests gallery permissions and launches the image picker for the campaign flyer. */
  const selecionarPanfleto = async () => {
    setPanfletoLoading(true);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setDialogTitle(t('common.warning'));
      setDialogText(
        t('campaign.need_photo_flyer', {
          defaultValue:
            'Precisamos de ter acesso às tuas fotos para carregares o panfleto da campanha!',
        }),
      );
      setDialogVisible(true);
      setPanfletoLoading(false);
      return;
    }

    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5, // Lower quality for flyers to save bandwidth
    });

    if (!resultado.canceled) {
      setFormData(prev => ({ ...prev, panfleto: resultado.assets[0].uri }));
    }
    setPanfletoLoading(false);
  };

  /** Validates and adds a 5-digit CAE code to the form data array. */
  const handleAdicionarCae = () => {
    if (caeInput.length !== 5 || isNaN(Number(caeInput))) {
      setErro(
        t('campaign.cae_length_error', {
          defaultValue: 'O CAE deve ter 5 numeros.',
        }),
      );
      return;
    }
    if (formData.listaCAES.includes(caeInput)) {
      setErro(
        t('campaign.cae_duplicate_error', {
          defaultValue: 'Este CAE já foi adicionado.',
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

  /**
   * Main submission handler.
   * Constructs multipart/form-data to send text fields alongside image files.
   * Resets the form on success.
   */
  const handleFinalSubmit = async () => {
    setLoading(true);

    if (formData.pacotes.length === 0) {
      setDialogTitle(t('common.error'));
      setDialogText(
        t('campaign.error_no_packs', {
          defaultValue: 'Erro: Adicione pacotes.',
        }),
      );
      setDialogVisible(true);
      setLoading(false);
      return;
    }

    try {
      const data = new FormData();

      // Append text fields
      data.append('titulo', formData.tituloCampanha);
      data.append('slogan', formData.slogan);
      data.append('descricao', formData.descricaoCampanha);
      data.append('normas', formData.normas);
      data.append('dataInicio', formData.dataInicio.toISOString());
      data.append('dataExpiracao', formData.dataExpiracao.toISOString());

      // Append arrays/objects as JSON strings
      data.append('listaCAES', JSON.stringify(formData.listaCAES));

      const packsPayload = formData.pacotes.map(p => ({
        rewardDescription: p.descricaoRecompensa,
        pointsCost: Number(p.custoEmPontos),
        stock: Number(p.stockInicial),
        maxPerUser: Number(p.maximoPorUser),
      }));
      data.append('packs', JSON.stringify(packsPayload));

      // Append Logo File
      if (formData.logo) {
        const logoParts = formData.logo.split('.');
        const logoType = logoParts[logoParts.length - 1];
        // @ts-ignore // RN FormData allows object assignment for files
        data.append('logo', {
          uri: formData.logo,
          name: `logo.${logoType}`,
          type: `image/${logoType === 'jpg' ? 'jpeg' : logoType}`,
        });
      }

      // Append Flyer File
      if (formData.panfleto) {
        const panfletoParts = formData.panfleto.split('.');
        const panfletoType = panfletoParts[panfletoParts.length - 1];
        // @ts-ignore
        data.append('panfleto', {
          uri: formData.panfleto,
          name: `panfleto.${panfletoType}`,
          type: `image/${panfletoType === 'jpg' ? 'jpeg' : panfletoType}`,
        });
      }

      const response = await fetch(`${API_URL}/criarCampanha`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          // Note: 'Content-Type' is omitted intentionally. React Native sets it automatically.
        },
        body: data,
      });

      if (response.ok) {
        setSnackbarMessage(
          t('campaign.success_created', { defaultValue: 'Campanha criada!' }),
        );
        setSnackbarVisible(true);

        // Reset form state
        setFormData({
          tituloCampanha: '',
          slogan: '',
          descricaoCampanha: '',
          listaCAES: [],
          dataExpiracao: new Date(),
          dataInicio: new Date(),
          normas: '',
          logo: '',
          panfleto: '',
          pacotes: [],
        });
        setCaeInput('');
        setErro('');
        setPacote({
          descricaoRecompensa: '',
          custoEmPontos: '',
          stockInicial: '',
          maximoPorUser: '1',
        });
        setStep(1);
      } else {
        const errorData = await response.json();
        setDialogTitle(t('common.error'));
        setDialogText(errorData.message);
        setDialogVisible(true);
      }
    } catch (err) {
      console.error('Erro ao submeter campanha:', err);
      setDialogTitle(t('common.error'));
      setDialogText(
        t('campaign.error_network', {
          defaultValue: 'Erro na rede ou no upload.',
        }),
      );
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // --- Render Helpers (Sub-components for each step) ---
  // Extracted to keep the main return block clean and readable.

  const renderStep1 = () => (
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
        {t('campaign.identity')}
      </Text>
      <CustomTextInput
        label={t('campaign.create_title')}
        value={formData.tituloCampanha}
        onChangeText={val => setFormData({ ...formData, tituloCampanha: val })}
        required
        lenght={50}
      />
      <CustomTextInput
        label={t('campaign.slogan')}
        value={formData.slogan}
        onChangeText={val => setFormData({ ...formData, slogan: val })}
        required
        lenght={50}
      />
      <CustomTextInput
        label={t('campaign.description')}
        value={formData.descricaoCampanha}
        onChangeText={val =>
          setFormData({ ...formData, descricaoCampanha: val })
        }
        required
        lenght={250}
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
        {t('campaign.caes_covered')}
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
          label={t('addBusiness.add_cae')}
          placeholder={t('addBusiness.cae_placeholder')}
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
          accessibilityLabel={t('addBusiness.add_cae')}
          accessibilityHint={t('accessibility.add_cae_campaign')}
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
          marginTop: 8,
        }}
      >
        {formData.listaCAES.map(cae => (
          <View
            key={cae}
            style={{ position: 'relative', paddingTop: 4, paddingRight: 4 }}
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
                elevation: 2,
              }}
            >
              <Pressable
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Remover CAE ${cae}`}
                accessibilityHint={t('accessibility.remove_cae')}
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

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 20,
        }}
      >
        <View style={{ width: '48%' }}>
          <Text
            variant="labelLarge"
            style={{
              color: theme.colors.primary,
              fontWeight: 'bold',
              marginBottom: 10,
              textAlign: 'center',
              margin: 10,
            }}
          >
            {t('campaign.logo')}
          </Text>
          <CustomButton
            icon="image"
            onPress={selecionarLogo}
            loading={logoLoading}
          >
            {formData.logo
              ? t('common.change', { defaultValue: 'Alterar' })
              : t('common.upload', { defaultValue: 'Upload' })}
          </CustomButton>
          {formData.logo && (
            <Image
              source={{ uri: formData.logo }}
              style={{
                width: '100%',
                height: 100,
                borderRadius: 8,
                marginTop: 10,
              }}
            />
          )}
        </View>

        <View style={{ width: '48%' }}>
          <Text
            variant="labelLarge"
            style={{
              color: theme.colors.primary,
              fontWeight: 'bold',
              marginBottom: 10,
              textAlign: 'center',
              margin: 10,
            }}
          >
            {t('campaign.flyer')}
          </Text>
          <CustomButton
            icon="file-image"
            onPress={selecionarPanfleto}
            loading={panfletoLoading}
          >
            {formData.panfleto
              ? t('common.change', { defaultValue: 'Alterar' })
              : t('common.upload', { defaultValue: 'Upload' })}
          </CustomButton>
          {formData.panfleto && (
            <Image
              source={{ uri: formData.panfleto }}
              style={{
                width: '100%',
                height: 100,
                borderRadius: 8,
                marginTop: 10,
              }}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
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
        {t('campaign.rules')}
      </Text>

      <Text
        variant="labelMedium"
        style={{ marginBottom: 5, textAlign: 'center' }}
      >
        {t('campaign.expire_date')}
      </Text>

      <CustomButton icon="calendar" onPress={() => setShowDatePicker(true)}>
        {formData.dataExpiracao.toLocaleDateString(
          i18n.language === 'pt' ? 'pt-PT' : 'en-US',
        )}
      </CustomButton>

      {showDatePicker && (
        <DateTimePicker
          style={{
            backgroundColor: theme.colors.primary,
            margin: 10,
            alignSelf: 'center',
          }}
          value={formData.dataExpiracao}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <CustomTextInput
        multiline={true}
        label={t('campaign.terms')}
        value={formData.normas}
        onChangeText={val => setFormData({ ...formData, normas: val })}
        required
        lenght={1000}
      />
    </View>
  );

  // --- Early Returns ---
  // Must occur AFTER all hooks (useState, useEffect) have been declared.
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Main Render ---
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('campaign.create_title', { defaultValue: 'Criar Campanha' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>

    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }} edges={['left', 'right']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Text style={{ textAlign: 'right', marginBottom: 5 }}>
            {t('addBusiness.step_info', { step, totalSteps: TOTAL_STEPS })}
          </Text>
          <ProgressBar
            progress={step / TOTAL_STEPS}
            color={theme.colors.primary}
            style={{ marginBottom: 20 }}
          />

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

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
                  {t('campaign.config_packages')}
                </Text>

                <CustomTextInput
                  label={t('campaign.reward_desc')}
                  value={pacote.descricaoRecompensa}
                  onChangeText={t =>
                    setPacote({ ...pacote, descricaoRecompensa: t })
                  }
                  required={formData.pacotes.length === 0}
                  lenght={100}
                />
                <CustomTextInput
                  label={t('campaign.cost_points')}
                  value={pacote.custoEmPontos}
                  onChangeText={t => setPacote({ ...pacote, custoEmPontos: t })}
                  required={formData.pacotes.length === 0}
                  isNumber
                  lenght={5}
                />
                <CustomTextInput
                  label={t('campaign.initial_stock')}
                  value={pacote.stockInicial}
                  onChangeText={t => setPacote({ ...pacote, stockInicial: t })}
                  required={formData.pacotes.length === 0}
                  isNumber
                  lenght={6}
                />

                <CustomButton onPress={addPack} className="m-5">
                  + {t('campaign.add_package')}
                </CustomButton>

                {formData.pacotes.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text variant="titleMedium">
                      {t('campaign.packs_list')}
                    </Text>
                    {formData.pacotes.map((p, i) => (
                      <Surface
                        key={i}
                        style={{
                          padding: 10,
                          marginVertical: 5,
                          borderRadius: 8,
                          backgroundColor: theme.colors.background,
                        }}
                      >
                        <Text>
                          {t('campaign.package_item', {
                            desc: p.descricaoRecompensa,
                            points: p.custoEmPontos,
                          })}
                        </Text>
                      </Surface>
                    ))}
                  </View>
                )}
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
            {step > 1 && (
              <CustomButton onPress={() => setStep(step - 1)}>
                {t('common.back', { defaultValue: 'Anterior' })}
              </CustomButton>
            )}

            {step < TOTAL_STEPS ? (
              <CustomButton onPress={() => setStep(step + 1)}>
                {t('common.next', { defaultValue: 'Próximo' })}
              </CustomButton>
            ) : (
              <CustomButton onPress={handleFinalSubmit} loading={loading}>
                {t('campaign.submit_create', {
                  defaultValue: 'Criar Campanha',
                })}
              </CustomButton>
            )}
          </View>
        </KeyboardAvoidingView>

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
      </SafeAreaView>
    </Surface>
    </>
  );
};

export default CreateCampaign;
