import React, { useState } from "react";
import { View, ScrollView, Image, Pressable } from "react-native";
import {
  Surface,
  Text,
  ProgressBar,
  HelperText,
  TextInput,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import Map from "@/app/components/Map";
import { delay } from "../../utils/delay";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import CustomChip from "../components/CustomChip";
import { pickImage } from "@/utils/imagePicker";
import { router } from "expo-router";
import getAddress from "../../utils/getAddress";
import { IconButton } from "react-native-paper";

export default function AddBusiness() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const INITIAL_FORM_DATA = {
    nomeNegocio: "",
    NIFnegocio: "",
    categoriaNegocio: "",
    logotipoNegocio: "",
    moradaNegocio: "",
    freguesiaNegocio: "",
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
  const [caeInput, setCaeInput] = useState("");
  const [erro, setErro] = useState("");
    
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
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

  // 🚀 CORREÇÃO: Utilização de 'as any' para evitar que o TS infira o tipo como 'never'
  const selecionarLogotipo = async () => {
    try {
      const resultado = await pickImage({
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!resultado) return;

      const respostaObj = resultado as any;

      // Verifica se é o formato de objeto do Expo ImagePicker com .assets
      if (respostaObj && typeof respostaObj === "object" && "assets" in respostaObj && respostaObj.assets && respostaObj.assets.length > 0) {
        const uriLogotipo = respostaObj.assets[0].uri;
        setFormData({ ...formData, logotipoNegocio: uriLogotipo });
      } 
      // Fallback caso o teu utilitário já devolva a string direta
      else if (typeof resultado === "string") {
        setFormData({ ...formData, logotipoNegocio: resultado });
      }
    } catch (error: any) {
      setSnackbarMessage("Erro ao carregar imagem: " + error.message);
      setSnackbarVisible(true);
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
      if (respostaObj && typeof respostaObj === "object" && "assets" in respostaObj && respostaObj.assets) {
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
      else if (typeof resultado === "string") {
        setFormData({
          ...formData,
          galeriaFotos: [...formData.galeriaFotos, resultado],
        });
      }
    } catch (error: any) {
      setSnackbarMessage("Erro ao carregar galeria: " + error.message);
      setSnackbarVisible(true);
    }
  };

  const handleNewBusiness = async () => {
    if (!user?.token) {
      setSnackbarMessage('Erro: Sessão expirada.');
      setSnackbarVisible(true);
      return;
    }

    if (
      !formData.nomeNegocio ||
      !formData.categoriaNegocio ||
      !formData.telefoneDono ||
      !formData.emailDono
    ) {
      setSnackbarMessage("Erro:\nPor favor, preencha todos os campos obrigatórios.");
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/registarNegocio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          nomeNegocio: formData.nomeNegocio,
          NIFnegocio: formData.NIFnegocio,
          categoriaNegocio: formData.categoriaNegocio,
          logotipoNegocio: formData.logotipoNegocio,
          moradaNegocio: formData.moradaNegocio,
          freguesiaNegocio: formData.freguesiaNegocio,
          listaCAES: formData.listaCAES,
          localizacao: {
            latitude: formData.localizacao.latitude,
            longitude: formData.localizacao.longitude,
          },
          telefoneDono: formData.telefoneDono,
          emailDono: formData.emailDono,
          descricaoNegocio: formData.descricaoNegocio,
          galeriaFotos: formData.galeriaFotos,
          owner: user?.id,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbarMessage("Sucesso! Negócio registado.");
        setSnackbarVisible(true);
        await delay(500);
        setFormData(INITIAL_FORM_DATA);
        router.back();
        setStep(1);
      } else {
        setSnackbarMessage(data.message || 'Erro no registo.');
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage('Erro de ligação ao servidor.');
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleAdicionarCae = () => {
    if (caeInput.length !== 5 || isNaN(Number(caeInput))) {
      setErro("O CAE deve ter exatamente 5 números.");
      return;
    }
    if (formData.listaCAES.includes(caeInput)) {
      setErro("Este código CAE já foi adicionado.");
      return;
    }
    setErro("");
    setFormData({
      ...formData,
      listaCAES: [...formData.listaCAES, caeInput],
    });
    setCaeInput("");
  };

  const handleRemoverCae = (caeParaRemover: string) => {
    setFormData({
      ...formData,
      listaCAES: formData.listaCAES.filter((c) => c !== caeParaRemover),
    });
  };

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1, padding: 16 }} edges={["top", "left", "right"]}>
        
        {/* Barra de Progresso e Paginação Baseada no CreateCampaign */}
        <Text style={{ textAlign: "right", marginBottom: 5 }}>
          Passo {step} de {totalSteps}
        </Text>
        <ProgressBar
          progress={step / totalSteps}
          color={theme.colors.primary}
          style={{ marginBottom: 20 }}
        />

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          
          {/* STEP 1: IDENTIDADE DO ESTABELECIMENTO */}
          {step === 1 && (
            <View>
              <Text 
                variant="headlineSmall" 
                style={{
                  color: theme.colors.primary,
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center"
                }}
              >
                Novo Negócio
              </Text>

              <CustomTextInput
                label="Nome do Negócio"
                value={formData.nomeNegocio}
                onChangeText={(t) => setFormData({ ...formData, nomeNegocio: t })}
              />
              
              <TextInput
                label="NIF"
                value={formData.NIFnegocio}
                onChangeText={(t) => setFormData({ ...formData, NIFnegocio: t })}
                keyboardType="numeric"
                maxLength={9}
              />

              {/* Módulo de CAEs Baseado Inteiramente no Modelo do CreateCampaign */}
              <Text 
                variant="titleMedium" 
                style={{
                  color: theme.colors.primary,
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center",
                  margin: 10
                }}
              >
                CAES do Negócio
              </Text>
              
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <TextInput
                  label="Adicionar CAE"
                  placeholder="Ex: 01111"
                  maxLength={5}
                  keyboardType="numeric"
                  value={caeInput}
                  onChangeText={(text) => {
                    setErro("");
                    setCaeInput(text.replace(/[^0-9]/g, ""));
                  }}
                  style={{ flex: 1 }}
                />
                <CustomButton onPress={handleAdicionarCae}>
                  +
                </CustomButton>
              </View>
              
              <HelperText type="error" visible={!!erro} style={{ paddingHorizontal: 0 }}>
                {erro}
              </HelperText>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                {formData.listaCAES.map((cae) => (
                  <View key={cae} style={{ position: "relative", paddingTop: 4, paddingRight: 4 }}>
                    <CustomChip isSelected={true} icon="tag" onPress={() => {}}>
                      {cae}
                    </CustomChip>
                    
                    <View 
                      style={{ 
                        position: "absolute", 
                        top: 0, 
                        right: 0, 
                        backgroundColor: "#ef4444", 
                        borderRadius: 10, 
                        width: 20, 
                        height: 20, 
                        alignItems: "center", 
                        justifyContent: "center", 
                        borderColor: "#fff", 
                        borderWidth: 1,
                        elevation: 2 
                      }}
                    >
                      <Pressable onPress={() => handleRemoverCae(cae)} hitSlop={10}>
                        <Text style={{ color: "#fff", fontSize: 10, fontWeight: "bold", lineHeight: 12 }}>X</Text>
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
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center",
                  margin: 10
                }}
              >
                Categoria do Negócio
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 8, paddingBottom: 15 }}
                style={{ flexDirection: "row" }}
              >
                {categories.map((cat) => (
                  <CustomChip
                    key={cat}
                    isSelected={formData.categoriaNegocio === cat}
                    onPress={() => setFormData({ ...formData, categoriaNegocio: cat })}
                  >
                    {cat}
                  </CustomChip>
                ))}
              </ScrollView>

              {/* Upload do Logótipo */}
              <View style={{ width: "100%", alignItems: "center", marginTop: 10 }}>
                <Text 
                  variant="labelLarge" 
                  style={{
                    color: theme.colors.primary,
                    fontWeight: "bold",
                    marginBottom: 10,
                    textAlign: "center"
                  }}
                >
                  Logótipo do Estabelecimento
                </Text>
                <CustomButton icon="image" onPress={selecionarLogotipo}>
                  {formData.logotipoNegocio ? "Alterar Logótipo" : "Upload Logótipo"}
                </CustomButton>
                {formData.logotipoNegocio && (
                  <Image 
                    source={{ uri: formData.logotipoNegocio }} 
                    style={{ width: 140, height: 140, borderRadius: 8, marginTop: 10 }} 
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
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center",
                  margin: 10
                }}
              >
                Localização
              </Text>
              
              <CustomTextInput
                label="Morada completa do negócio"
                placeholder="Ex: Rua, nº, Tomar"
                value={formData.moradaNegocio}
                onChangeText={(t) => setFormData({ ...formData, moradaNegocio: t })}
              />
              
              <CustomTextInput
                label="Freguesia"
                placeholder="Ex: São João Baptista"
                value={formData.freguesiaNegocio}
                onChangeText={(t) => setFormData({ ...formData, freguesiaNegocio: t })}
              />
              
              <View style={{ marginTop: 15, height: 320, borderRadius: 10, overflow: "hidden" }}>
                <Map
                  showPin={true}
                  onLocationSelect={async (location) => {
                    if (!location || typeof location.latitude !== "number") return;

                    setFormData((prev) => ({
                      ...prev,
                      localizacao: {
                        latitude: location.latitude,
                        longitude: location.longitude,
                      },
                    }));

                    try {
                      const { latitude, longitude } = location;
                      const address = await getAddress({ latitude, longitude });

                      if (address && address !== "undefined") {
                        setFormData((prev) => ({
                          ...prev,
                          moradaNegocio: address,
                        }));
                      }
                    } catch (err) {
                      console.error("Erro ao converter coordenadas:", err);
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
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center",
                  margin: 10
                }}
              >
                Informações de Contacto
              </Text>

              <CustomTextInput
                label="Telefone do Dono"
                value={formData.telefoneDono}
                onChangeText={(t) => setFormData({ ...formData, telefoneDono: t })}
                keyboardType="phone-pad"
              />
              <CustomTextInput
                label="E-mail do Dono"
                value={formData.emailDono}
                onChangeText={(t) => setFormData({ ...formData, emailDono: t })}
                keyboardType="email-address"
              />
              <CustomTextInput
                label="Descrição Detalhada do Negócio"
                value={formData.descricaoNegocio}
                onChangeText={(t) => setFormData({ ...formData, descricaoNegocio: t })}
                multiline={true}
              />
              
              <Text 
                variant="titleMedium" 
                style={{
                  color: theme.colors.primary,
                  fontWeight: "bold",
                  marginBottom: 10,
                  textAlign: "center",
                  margin: 10
                }}
              >
                Galeria de Fotos ({formData.galeriaFotos.length}/5)
              </Text>

              <CustomButton icon="file-image" onPress={adicionarFotosGaleria}>
                Adicionar Imagens
              </CustomButton>

              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, gap: 16 }}
                style={{ flexDirection: "row", marginTop: 10, minHeight: 110 }}
              >
                {formData.galeriaFotos.map((uri, index) =>
                  uri ? (
                    <View key={index} style={{ position: "relative", width: 90, height: 90 }}>
                      <Image 
                        source={{ uri }} 
                        style={{ width: 90, height: 90, borderRadius: 8, backgroundColor: theme.colors.surfaceVariant }} 
                        resizeMode="cover"
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        iconColor={theme.colors.error}
                        style={{
                          position: "absolute",
                          top: -12,
                          right: -12,
                          backgroundColor: theme.colors.surface,
                          margin: 0,
                          elevation: 4,
                          zIndex: 10
                        }}
                        onPress={() => {
                          const novaLista = formData.galeriaFotos.filter((_, i) => i !== index);
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

        <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
          {step > 1 && (
            <CustomButton onPress={prevStep}>
              Anterior
            </CustomButton>
          )}
          
          {step < totalSteps ? (
            <CustomButton onPress={nextStep}>
              Próximo
            </CustomButton>
          ) : (
            <CustomButton loading={loading} onPress={handleNewBusiness}>
              Enviar Negócio
            </CustomButton>
          )}
        </View>

      </SafeAreaView>

      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
    </Surface>
  );
}