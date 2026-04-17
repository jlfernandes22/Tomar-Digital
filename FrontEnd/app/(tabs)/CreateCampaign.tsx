import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View, Image
} from "react-native";
import React, { useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, Surface, Text, useTheme, ProgressBar } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTextInput from "../components/CustomTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import delay from "../utils/delay";
import * as ImagePicker from 'expo-image-picker';


const CreateCampaign = () => {

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
  logo: string;    // s minúsculo
  panfleto: string; // s minúsculo
  pacotes: IPacote[];
}
  const [step, setStep] = useState(1);
  const totalSteps = 3; 

  const theme = useTheme();
  const { user } = useAuth();

  /* Renderização de estado de carregamento enquanto os dados do utilizador não estão disponíveis */
  if (!user)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

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
    })

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showSnackBar, setShowSnackBar] = useState(false);
    const [snackBarText, setSnackBarText] = useState("");

  
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

  // 1. Validação usando o estado do pacote atual
  const { descricaoRecompensa, custoEmPontos, stockInicial } = pacote;

  if (!descricaoRecompensa || !custoEmPontos || !stockInicial) {
    setSnackBarText("Erro: Preencha a descrição, o custo e o stock do pacote.");
    setShowSnackBar(true);
    setLoading(false);
    return;
  }

  try {
    // 2. Criar o novo objeto formatado
    const newPack = {
      custoEmPontos: Number(custoEmPontos),
      descricaoRecompensa: descricaoRecompensa,
      stockInicial: Number(stockInicial),
      stockAtual: Number(stockInicial),
      maximoPorUser: Number(pacote.maximoPorUser || 1)
    };

    // 3. Atualizar o formData preservando o que já lá estava
    setFormData(prevState => ({
      ...prevState,
      pacotes: [...prevState.pacotes, newPack]
    }));

    // 4. Limpar os campos do pacote para permitir adicionar outro
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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Precisamos de acesso às tuas fotos para carregares o logótipo da campanha!');
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
}

  const selecionarPanfleto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Precisamos de acesso às tuas fotos para carregares o panfleto da campanha!');
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
    }

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
      //multiline 
      //numberOfLines={3}
      value={formData.descricaoCampanha} 
      onChangeText={(val) => setFormData({...formData, descricaoCampanha: val})} 
    />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
  <View style={{ width: '48%' }}>
    <Text variant="labelLarge">Logótipo</Text>
    <CustomButton icon="image" onPress={selecionarLogo}>
      {formData.logo ? "Alterar" : "Upload"}
    </CustomButton>
    {formData.logo && (
      <Image 
        source={{ uri: formData.logo as string }} 
        style={{ width: '100%', height: 100, borderRadius: 8, marginTop: 10 }} 
      />
    )}
  </View>

  <View style={{ width: '48%' }}>
    <Text variant="labelLarge">Panfleto</Text>
    <CustomButton icon="file-image" onPress={selecionarPanfleto}>
      {formData.panfleto ? "Alterar" : "Upload"}
    </CustomButton>
    {formData.panfleto && (
      <Image 
        source={{ uri: formData.panfleto as string }} 
        style={{ width: '100%', height: 100, borderRadius: 8, marginTop: 10 }} 
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

    {/* BOTÃO QUE ATIVA O PICKER */}
    <CustomButton 
      icon="calendar"
      onPress={() => setShowDatePicker(true)}
    >
      {/* Mostra a data atual do estado formatada */}
      {formData.dataExpiracao.toLocaleDateString('pt-PT')}
    </CustomButton>

    {/* O PICKER PROPRIAMENTE DITO */}
    {showDatePicker && (
      <DateTimePicker
        value={formData.dataExpiracao} // Usa o que está no estado
        mode="date"
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        onChange={onChangeDate} // Chama a função que fecha e guarda
        minimumDate={new Date()} // Impede selecionar datas passadas
      />
    )}

    <CustomTextInput 
      label="Termos e Condições" 

      value={formData.normas} 
      onChangeText={(val) => setFormData({...formData, normas: val})} 
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

  // Criar o objeto exatamente como o Backend espera
  const payload = {
    titulo: formData.tituloCampanha,
    slogan: formData.slogan,
    descricao: formData.descricaoCampanha,
    dataInicio: formData.dataInicio.toISOString(),
    dataExpiracao: formData.dataExpiracao.toISOString(),
    normas: formData.normas,
    logo: formData.logo,
    panfleto: formData.panfleto,
    packs: formData.pacotes.map(p => ({
      rewardDescription: p.descricaoRecompensa,
      pointsCost: Number(p.custoEmPontos),
      stock: Number(p.stockInicial),
      maxPerUser: Number(p.maximoPorUser)
    }))
  };

  try {
    const response = await fetch(`${API_URL}/criarCampanha`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload), // Enviamos o payload corrigido
    });

    if (response.ok) {
        console.log(formData);

      // Limpar formulário...
      setSnackBarText("Campanha criada!");
    } else {
      const errorData = await response.json();
      setSnackBarText("Erro: " + errorData.message);
    }
  } catch (err) {
    setSnackBarText("Erro na rede");
  } finally {
    setLoading(false);
  }
};
  return (
 <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
    <SafeAreaView style={{ flex: 1, padding: 16 }}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        
        {/* Barra de Progresso */}
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

    <CustomButton 
      onPress={addPack} 
    >
      + Adicionar este Pacote
    </CustomButton>
    
    {/* Lista de Packs para o utilizador ver o que já adicionou */}
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
            <CustomButton  onPress={() => setStep(step - 1)}>Anterior</CustomButton>
          )}
          
          {step < totalSteps ? (
            <CustomButton  onPress={() => setStep(step + 1)}>Próximo</CustomButton>
          ) : (
            <CustomButton  onPress={handleFinalSubmit}  loading={loading}>Criar Campanha</CustomButton>
          )
          }
        </View>

      </KeyboardAvoidingView>

      <CustomSnackBar visible={showSnackBar} onDismiss={() => setShowSnackBar(false)} message="Criado!" />
      
      {showDatePicker && (
        <DateTimePicker
          value={formData.dataExpiracao}
          mode="date"
          onChange={onChangeDate}
        />
      )}
      </SafeAreaView>
    </Surface>
  );
};

export default CreateCampaign;
