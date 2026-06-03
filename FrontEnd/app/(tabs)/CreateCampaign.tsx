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
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarText, setSnackBarText] = useState('');

  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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
      setSnackBarText(
        'Erro: Preencha a descrição, o custo e o stock do pacote.',
      );
      setShowSnackBar(true);
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

      setSnackBarText('Pacote adicionado com sucesso!');
      setShowSnackBar(true);
    } catch (err) {
      console.error('Erro na adição do pacote: ', err);
      setSnackBarText('Erro ao formatar os dados do pacote.');
      setShowSnackBar(true);
    } finally {
      setLoading(false);
    }
  };

  const selecionarLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(
        'Precisamos de acesso às tuas fotos para carregares o logótipo da campanha!',
      );
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
      setFormData({ ...formData, logo: uri });
    }
  };

  const selecionarPanfleto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert(
        'Precisamos de ter acesso às tuas fotos para carregares o panfleto da campanha!',
      );
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
  };

  const handleAdicionarCae = () => {
    if (caeInput.length !== 5 || isNaN(Number(caeInput))) {
      setErro('O CAE deve ter 5 numeros.');
      return;
    }
    if (formData.listaCAES.includes(caeInput)) {
      setErro('Este CAE já foi adicionado.');
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
        Identidade
      </Text>
      <CustomTextInput
        label="Título da Campanha"
        value={formData.tituloCampanha}
        onChangeText={val => setFormData({ ...formData, tituloCampanha: val })}
      />
      <CustomTextInput
        label="Slogan"
        value={formData.slogan}
        onChangeText={val => setFormData({ ...formData, slogan: val })}
      />
      <CustomTextInput
        label="Descrição"
        value={formData.descricaoCampanha}
        onChangeText={val =>
          setFormData({ ...formData, descricaoCampanha: val })
        }
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
        CAES Abrangentes da Campanha
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
          mode="outlined"
          label="Adicionar CAE"
          placeholder="Ex: 01111"
          maxLength={5}
          keyboardType="numeric"
          value={caeInput}
          onChangeText={text => {
            setErro('');
            setCaeInput(text.replace(/[^0-9]/g, ''));
          }}
          style={{ flex: 1, height: 48 }}
        />
        <CustomButton onPress={handleAdicionarCae}>+</CustomButton>
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
              <Pressable onPress={() => handleRemoverCae(cae)} hitSlop={10}>
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
            Logótipo
          </Text>
          <CustomButton icon="image" onPress={selecionarLogo}>
            {formData.logo ? 'Alterar' : 'Upload'}
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
            Panfleto
          </Text>
          <CustomButton icon="file-image" onPress={selecionarPanfleto}>
            {formData.panfleto ? 'Alterar' : 'Upload'}
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
        Prazos e Regras
      </Text>

      <Text
        variant="labelMedium"
        style={{ marginBottom: 5, textAlign: 'center' }}
      >
        Data de Expiração:
      </Text>

      <CustomButton icon="calendar" onPress={() => setShowDatePicker(true)}>
        {formData.dataExpiracao.toLocaleDateString('pt-PT')}
      </CustomButton>

      {showDatePicker && (
        <DateTimePicker
        style={{backgroundColor: theme.colors.primary, margin: 10, alignSelf: "center"}}
          value={formData.dataExpiracao}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <CustomTextInput
        multiline={true}
        label="Termos e Condições"
        value={formData.normas}
        onChangeText={val => setFormData({ ...formData, normas: val })}
      />
    </View>
  );

  const handleFinalSubmit = async () => {
  setLoading(true);

  if (formData.pacotes.length === 0) {
    setSnackBarText("Erro: Adicione pacotes.");
    setLoading(false);
    return;
  }

  try {
    const data = new FormData();

    data.append("titulo", formData.tituloCampanha);
    data.append("slogan", formData.slogan);
    data.append("descricao", formData.descricaoCampanha);
    data.append("normas", formData.normas);
    data.append("dataInicio", formData.dataInicio.toISOString());
    data.append("dataExpiracao", formData.dataExpiracao.toISOString());

    data.append("listaCAES", JSON.stringify(formData.listaCAES));

    const packsPayload = formData.pacotes.map(p => ({
      rewardDescription: p.descricaoRecompensa,
      pointsCost: Number(p.custoEmPontos),
      stock: Number(p.stockInicial),
      maxPerUser: Number(p.maximoPorUser)
    }));
    data.append("packs", JSON.stringify(packsPayload));

if (formData.logo) {
  const logoParts = formData.logo.split('.');
  const logoType = logoParts[logoParts.length - 1];
  
  // @ts-ignore 
  data.append("logo", {
    uri: formData.logo,
    name: `logo.${logoType}`,
    type: `image/${logoType === 'jpg' ? 'jpeg' : logoType}`,
  });
}

if (formData.panfleto) {
  const panfletoParts = formData.panfleto.split('.');
  const panfletoType = panfletoParts[panfletoParts.length - 1];

  // @ts-ignore
  data.append("panfleto", {
    uri: formData.panfleto,
    name: `panfleto.${panfletoType}`,
    type: `image/${panfletoType === 'jpg' ? 'jpeg' : panfletoType}`,
  });
}

    const response = await fetch(`${API_URL}/criarCampanha`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
      body: data, 
    });

    if (response.ok) {
      setSnackBarText("Campanha criada!");
      setShowSnackBar(true);

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
        pacotes: []
      });

      setCaeInput("");
      setErro("");
      setPacote({
        descricaoRecompensa: '',
        custoEmPontos: '',
        stockInicial: '',
        maximoPorUser: '1'
      });

      setStep(1);
    } else {
      const errorData = await response.json();
      setSnackBarText("Erro: " + errorData.message);
      setShowSnackBar(true);
    }
    console.log(response)
  } catch (err) {
    console.error("Erro ao submeter campanha:", err);
    setSnackBarText("Erro na rede ou no upload.");
    setShowSnackBar(true);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    console.log('LOG CAES:', formData.listaCAES);
  }, [formData.listaCAES]);

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Text style={{ textAlign: 'right', marginBottom: 5 }}>
            Passo {step} de {totalSteps}
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
                  Configurar Pacotes
                </Text>

                <CustomTextInput
                  label="Descrição da Recompensa"
                  value={pacote.descricaoRecompensa}
                  onChangeText={t =>
                    setPacote({ ...pacote, descricaoRecompensa: t })
                  }
                />
                <CustomTextInput
                  label="Custo em Pontos"
                  value={pacote.custoEmPontos}
                  onChangeText={t => setPacote({ ...pacote, custoEmPontos: t })}
                />
                <CustomTextInput
                  label="Stock Inicial"
                  value={pacote.stockInicial}
                  onChangeText={t => setPacote({ ...pacote, stockInicial: t })}
                />

                <CustomButton onPress={addPack} className="m-5">
                  + Adicionar este Pacote
                </CustomButton>

                {formData.pacotes.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text variant="titleMedium">Packs na lista:</Text>
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
                          • {p.descricaoRecompensa} ({p.custoEmPontos} pts)
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
                Anterior
              </CustomButton>
            )}

            {step < totalSteps ? (
              <CustomButton onPress={() => setStep(step + 1)}>
                Próximo
              </CustomButton>
            ) : (
              <CustomButton onPress={handleFinalSubmit} loading={loading}>
                Criar Campanha
              </CustomButton>
            )}
          </View>
        </KeyboardAvoidingView>

        <CustomSnackBar
          visible={showSnackBar}
          onDismiss={() => setShowSnackBar(false)}
          message={snackBarText}
        />
      </SafeAreaView>
    </Surface>
  );
};

export default CreateCampaign;
