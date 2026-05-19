import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Image } from "expo-image"; // Substituído pelo expo-image para performance
import React, { useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import {
  ActivityIndicator,
  Surface,
  Text,
  useTheme,
  ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTextInput from "../components/CustomTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import UploadImage from "../components/UploadImage"; // A tua função utilitária de upload

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
  dataExpiracao: Date;
  dataInicio: Date;
  normas: string;
  logo: string;    
  panfleto: string; 
  pacotes: IPacote[];
}

// CORREÇÃO: Removido o "async" da declaração do componente
const CreateCampaign = () => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const theme = useTheme();
  const { user } = useAuth();

  const [formData, setFormData] = useState<ICampanhaForm>({
    tituloCampanha: '',
    slogan: '',
    descricaoCampanha: '',
    dataExpiracao: new Date(),
    dataInicio: new Date(),
    normas: '',
    logo: '',
    panfleto:'',
    pacotes: []
  });

  const [pacote, setPacote] = useState({
    descricaoRecompensa: '', 
    custoEmPontos: '',
    stockInicial: '',
    maximoPorUser: '1'   
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingPanfleto, setUploadingPanfleto] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snackBarText, setSnackBarText] = useState("");

  /* Renderização de estado de carregamento se user não existir */
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const onChangeDate = (event: any, selectedDate: any) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dataExpiracao: selectedDate
      }));
    }
  };

  const addPack = () => {
    setLoading(true);
    const { descricaoRecompensa, custoEmPontos, stockInicial } = pacote;

    if (!descricaoRecompensa || !custoEmPontos || !stockInicial) {
      setSnackBarText("Erro: Preencha a descrição, o custo e o stock do pacote.");
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
        maximoPorUser: Number(pacote.maximoPorUser || 1)
      };

      setFormData(prevState => ({
        ...prevState,
        pacotes: [...prevState.pacotes, newPack]
      }));

      setPacote({
        descricaoRecompensa: '',
        custoEmPontos: '',
        stockInicial: '',
        maximoPorUser: '1'
      });

      setSnackBarText("Pacote adicionado com sucesso!");
      setShowSnackBar(true);
    } catch (err) {
      console.error("Erro na adição do pacote: ", err);
      setSnackBarText("Erro ao formatar os dados do pacote.");
      setShowSnackBar(true);
    } finally {
      setLoading(false);
    }
  };

  const selecionarLogo = async () => {
  const uriLocal = await UploadImage(); // A tua função que abre a galeria
  if (uriLocal) {
    // Garante que o caminho começa sempre por 'file://'
    const uriFormatado = uriLocal.startsWith('file://') ? uriLocal : `file://${uriLocal}`;
    
    setFormData(prev => ({ ...prev, logo: uriFormatado }));
    setSnackBarText("Logótipo selecionado!");
    setShowSnackBar(true);
  }
};

 const selecionarPanfleto = async () => {
  const uriLocal = await UploadImage(); // A tua função que abre a galeria
  if (uriLocal) {
    // Garante que o caminho começa sempre por 'file://'
    const uriFormatado = uriLocal.startsWith('file://') ? uriLocal : `file://${uriLocal}`;
    
    setFormData(prev => ({ ...prev, panfleto: uriFormatado }));
    setSnackBarText("Panfleto selecionado!");
    setShowSnackBar(true);
  }
};

  const handleFinalSubmit = async () => {
  setLoading(true);

  if (formData.pacotes.length === 0) {
    setSnackBarText("Erro: Adicione pelo menos um pacote.");
    setShowSnackBar(true);
    setLoading(false);
    return;
  }

  // 1. Criamos um objeto FormData em vez de um objeto JSON puro
  const dataToSend = new FormData();

  // 2. Adicionamos os campos de texto simples
  dataToSend.append("titulo", formData.tituloCampanha);
  dataToSend.append("slogan", formData.slogan);
  dataToSend.append("descricao", formData.descricaoCampanha);
  dataToSend.append("dataInicio", formData.dataInicio.toISOString());
  dataToSend.append("dataExpiracao", formData.dataExpiracao.toISOString());
  dataToSend.append("normas", formData.normas);
  
  // Como o FormData só aceita strings ou ficheiros, convertemos o array de pacotes para String JSON
  dataToSend.append("packs", JSON.stringify(
    formData.pacotes.map(p => ({
      rewardDescription: p.descricaoRecompensa,
      pointsCost: Number(p.custoEmPontos),
      stock: Number(p.stockInicial),
      maxPerUser: Number(p.maximoPorUser)
    }))
  ));

  // 3. Adicionamos o ficheiro do LOGÓTIPO (se o utilizador escolheu um)
  if (formData.logo) {
    const filename = formData.logo.split('/').pop() || 'logo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    dataToSend.append("logo", {
      uri: formData.logo, // O URI local do telemóvel (file:///...)
      name: filename,
      type: type
    } as any);
  }

  // 4. Adicionamos o ficheiro do PANFLETO (se o utilizador escolheu um)
  if (formData.panfleto) {
    const filename = formData.panfleto.split('/').pop() || 'panfleto.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : `image/jpeg`;
    
    dataToSend.append("panfleto", {
      uri: formData.panfleto, 
      name: filename,
      type: type
    } as any);
  }

  try {
    const response = await fetch(`${API_URL}/criarCampanha`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
     },
      body: dataToSend, // Passamos o FormData completo
    });

    if (response.ok) {
      setSnackBarText("Campanha criada com sucesso!");
      setShowSnackBar(true);
    } else {
      const errorData = await response.json();
      setSnackBarText("Erro: " + errorData.message);
      setShowSnackBar(true);
    }
  } catch (err) {
    console.error(err);
    setSnackBarText("Erro na ligação ao servidor");
    setShowSnackBar(true);
  } finally {
    setLoading(false);
  }
};

  const renderStep1 = () => (
    <View>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Identidade</Text>
      <CustomTextInput 
        label="Título da Campanha" 
        value={formData.tituloCampanha} 
        onChangeText={(val) => setFormData({...formData, tituloCampanha: val})} 
      />
      <CustomTextInput 
        label="Slogan" 
        value={formData.slogan} 
        onChangeText={(val) => setFormData({...formData, slogan: val})} 
      />
      <CustomTextInput 
        label="Descrição" 
        value={formData.descricaoCampanha} 
        onChangeText={(val) => setFormData({...formData, descricaoCampanha: val})} 
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        {/* SECÇÃO LOGO */}
        <View style={{ width: '48%' }}>
          <Text variant="labelLarge">Logótipo</Text>
          <CustomButton icon="image" onPress={selecionarLogo} loading={uploadingLogo} disabled={uploadingLogo}>
            {formData.logo ? "Alterar" : "Upload"}
          </CustomButton>
          {formData.logo && (
            <Image 
              source={{ uri: formData.logo }} 
              style={{ width: '100%', height: 100, borderRadius: 8, marginTop: 10 }} 
              contentFit="cover"
            />
          )}
        </View>

        {/* SECÇÃO PANFLETO */}
        <View style={{ width: '48%' }}>
          <Text variant="labelLarge">Panfleto</Text>
          <CustomButton icon="file-image" onPress={selecionarPanfleto} loading={uploadingPanfleto} disabled={uploadingPanfleto}>
            {formData.panfleto ? "Alterar" : "Upload"}
          </CustomButton>
          {formData.panfleto && !uploadingPanfleto && (
            <Image 
              source={{uri : formData.panfleto}} 
              style={{ width: '100%', height: 100, borderRadius: 8, marginTop: 10 }} 
              contentFit="cover"
              transition={500}
            />
          )}
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View>
      <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Prazos e Regras</Text>
      <Text variant="labelMedium" style={{ marginBottom: 5 }}>Data de Expiração:</Text>

      <CustomButton icon="calendar" onPress={() => setShowDatePicker(true)}>
        {formData.dataExpiracao.toLocaleDateString('pt-PT')}
      </CustomButton>

      {showDatePicker && (
        <DateTimePicker
          value={formData.dataExpiracao}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={onChangeDate}
          minimumDate={new Date()}
        />
      )}

      <CustomTextInput 
        label="Termos e Condições" 
        value={formData.normas} 
        onChangeText={(val) => setFormData({...formData, normas: val})} 
      />
    </View>
  );

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          
          <Text style={{ textAlign: 'right', marginBottom: 5 }}>Passo {step} de {totalSteps}</Text>
          <ProgressBar progress={step / totalSteps} color={theme.colors.primary} style={{ marginBottom: 20 }} />

          <ScrollView showsVerticalScrollIndicator={false}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}

            {step === 3 && (
              <View>
                <Text variant="headlineSmall" style={{ marginBottom: 10 }}>Configurar Pacotes</Text>
                
                <CustomTextInput 
                  label="Descrição da Recompensa" 
                  value={pacote.descricaoRecompensa} 
                  onChangeText={(t) => setPacote({...pacote, descricaoRecompensa: t})}
                />
                <CustomTextInput 
                  label="Custo em Pontos" 
                  value={pacote.custoEmPontos} 
                  onChangeText={(t) => setPacote({...pacote, custoEmPontos: t})}
                />
                <CustomTextInput 
                  label="Stock Inicial" 
                  value={pacote.stockInicial} 
                  onChangeText={(t) => setPacote({...pacote, stockInicial: t})}
                />

                <CustomButton onPress={addPack}>
                  + Adicionar este Pacote
                </CustomButton>
                
                {formData.pacotes.length > 0 && (
                  <View style={{ marginTop: 10 }}>
                    <Text variant="titleMedium">Packs na lista:</Text>
                    {formData.pacotes.map((p, i) => (
                      <Surface key={i} style={{ padding: 10, marginVertical: 5, borderRadius: 8, backgroundColor: '#f0f0f0' }}>
                        <Text>• {p.descricaoRecompensa} ({p.custoEmPontos} pts)</Text>
                      </Surface>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Navegação entre passos */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
            {step > 1 && (
              <CustomButton onPress={() => setStep(step - 1)}>Anterior</CustomButton>
            )}
            
            {step < totalSteps ? (
              <CustomButton onPress={() => setStep(step + 1)}>Próximo</CustomButton>
            ) : (
              <CustomButton onPress={handleFinalSubmit} loading={loading}>Criar Campanha</CustomButton>
            )}
          </View>

        </KeyboardAvoidingView>

        <CustomSnackBar visible={showSnackBar} onDismiss={() => setShowSnackBar(false)} message={snackBarText} />
        
      </SafeAreaView>
    </Surface>
  );
};

export default CreateCampaign;