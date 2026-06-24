import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
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
  TextInput,
  Button,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomTextInput from '../components/CustomTextInput';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import CustomChip from '../components/CustomChip';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/context/ThemeContext';

interface IPacote {
  descricaoRecompensa: string;
  custoEmPontos: number;
  stockInicial: number;
  stockAtual: number;
  maximoPorUser: number;
}

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
  pacotes: IPacote[];
}

const CreateCampaign = () => {
  const { t, i18n } = useTranslation();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const [caeInput, setCaeInput] = useState('');
  const [erro, setErro] = useState('');

  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();

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

  const [pacote, setPacote] = useState({
    descricaoRecompensa: '',
    custoEmPontos: '',
    stockInicial: '',
    maximoPorUser: '1',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const [logoLoading, setLogoLoading] = useState(false);
  const [panfletoLoading, setPanfletoLoading] = useState(false);

  const onChangeDate = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dataExpiracao: selectedDate,
      }));
    }
  };

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
      const uri = resultado.assets[0].uri;
      setFormData({ ...formData, logo: uri });
    }
    setLogoLoading(false);
  };

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
      quality: 0.5,
    });

    if (!resultado.canceled) {
      const uri = resultado.assets[0].uri;
      setFormData({ ...formData, panfleto: uri });
    }
    setPanfletoLoading(false);
  };

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
      />
      <CustomTextInput
        label={t('campaign.slogan')}
        value={formData.slogan}
        onChangeText={val => setFormData({ ...formData, slogan: val })}
        required
      />
      <CustomTextInput
        label={t('campaign.description')}
        value={formData.descricaoCampanha}
        onChangeText={val =>
          setFormData({ ...formData, descricaoCampanha: val })
        }
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
          required={formData.listaCAES.length != 0 ? false : true}
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
                accessibilityLabel={t('accessibility.remove_cae_name', {
                  name: cae,
                  defaultValue: `Remover CAE ${cae}`,
                })}
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
            accessibilityLabel={
              formData.logo
                ? t('campaign.change_logo', {
                    defaultValue: 'Alterar Logótipo',
                  })
                : t('campaign.upload_logo', { defaultValue: 'Upload Logótipo' })
            }
            accessibilityHint={t('accessibility.choose_image')}
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
            accessibilityLabel={
              formData.panfleto
                ? t('campaign.change_flyer', {
                    defaultValue: 'Alterar Panfleto',
                  })
                : t('campaign.upload_flyer', {
                    defaultValue: 'Upload Panfleto',
                  })
            }
            accessibilityHint={t('accessibility.choose_flyer')}
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

      <CustomButton
        icon="calendar"
        onPress={() => setShowDatePicker(true)}
        accessibilityLabel={t('campaign.select_date')}
        accessibilityHint={t('accessibility.open_calendar')}
      >
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
      />
    </View>
  );

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

      data.append('titulo', formData.tituloCampanha);
      data.append('slogan', formData.slogan);
      data.append('descricao', formData.descricaoCampanha);
      data.append('normas', formData.normas);
      data.append('dataInicio', formData.dataInicio.toISOString());
      data.append('dataExpiracao', formData.dataExpiracao.toISOString());

      data.append('listaCAES', JSON.stringify(formData.listaCAES));

      const packsPayload = formData.pacotes.map(p => ({
        rewardDescription: p.descricaoRecompensa,
        pointsCost: Number(p.custoEmPontos),
        stock: Number(p.stockInicial),
        maxPerUser: Number(p.maximoPorUser),
      }));
      data.append('packs', JSON.stringify(packsPayload));

      if (formData.logo) {
        const logoParts = formData.logo.split('.');
        const logoType = logoParts[logoParts.length - 1];

        // @ts-ignore
        data.append('logo', {
          uri: formData.logo,
          name: `logo.${logoType}`,
          type: `image/${logoType === 'jpg' ? 'jpeg' : logoType}`,
        });
      }

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
        },
        body: data,
      });

      if (response.ok) {
        setSnackbarMessage(
          t('campaign.success_created', { defaultValue: 'Campanha criada!' }),
        );
        setSnackbarVisible(true);

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
      console.log(response);
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

  useEffect(() => {
    console.log('LOG CAES:', formData.listaCAES);
  }, [formData.listaCAES]);

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Text style={{ textAlign: 'right', marginBottom: 5 }}>
            {t('addBusiness.step_info', { step, totalSteps })}
          </Text>
          <ProgressBar
            progress={step / totalSteps}
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
                  required={formData.pacotes.length != 0 ? false : true}
                  lenght={100}
                />
                <CustomTextInput
                  label={t('campaign.cost_points')}
                  value={pacote.custoEmPontos}
                  onChangeText={t => setPacote({ ...pacote, custoEmPontos: t })}
                  required={formData.pacotes.length != 0 ? false : true}
                  isNumber
                  lenght={5}
                />
                <CustomTextInput
                  label={t('campaign.initial_stock')}
                  value={pacote.stockInicial}
                  onChangeText={t => setPacote({ ...pacote, stockInicial: t })}
                  required={formData.pacotes.length != 0 ? false : true}
                  isNumber
                  lenght={6}
                />

                <CustomButton
                  onPress={addPack}
                  className="m-5"
                  accessibilityLabel={t('campaign.add_package')}
                  accessibilityHint={t('accessibility.add_package_list')}
                >
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
              <CustomButton
                onPress={() => setStep(step - 1)}
                accessibilityLabel={t('addBusiness.prev_step')}
              >
                {t('common.back', { defaultValue: 'Anterior' })}
              </CustomButton>
            )}

            {step < totalSteps ? (
              <CustomButton
                onPress={() => setStep(step + 1)}
                accessibilityLabel={t('addBusiness.next_step')}
              >
                {t('common.next', { defaultValue: 'Próximo' })}
              </CustomButton>
            ) : (
              <CustomButton
                onPress={handleFinalSubmit}
                loading={loading}
                accessibilityLabel={t('campaign.submit_create')}
                accessibilityHint={t('accessibility.submit_campaign')}
              >
                {t('campaign.submit_create', {
                  defaultValue: 'Criar Campanha',
                })}
              </CustomButton>
            )}
          </View>
        </KeyboardAvoidingView>

        <CustomSnackBar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          message={snackbarMessage}
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
  );
};

export default CreateCampaign;
