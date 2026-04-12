import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import React, { useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, Surface, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTextInput from "../components/CustomTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import delay from "../utils/delay";

const CreateCampaign = () => {
  const theme = useTheme();
  const { user } = useAuth();

  /* Renderização de estado de carregamento enquanto os dados do utilizador não estão disponíveis */
  if (!user)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expirationDate, setExpirationDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [packsList, setPacksList] = useState([]);
  const [pointsCost, setPointsCost] = useState("");
  const [rewardDescription, setRewardDescription] = useState("");
  const [stock, setStock] = useState("");

  const [loading, setLoading] = useState(false);
  const [showSnackBar, setShowSnackBar] = useState(false);
  const [snakcBarText, setSnackBarText] = useState("");

  const handleCreateCampaign = async () => {
    setLoading(true);
    console.log("criar campanha");
    try {
      const response = await fetch(`${API_URL}/criarCampanha`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title,
          description: description,
          packs: packsList,
          expirationDate: expirationDate.toISOString(),
        }),
      });

      if (response.ok) {
        /* Reposição dos estados iniciais do formulário após o sucesso da operação */
        setTitle("");
        setDescription("");
        setExpirationDate(new Date());
        setPacksList([]);

        setSnackBarText("Campanha criada com sucesso");
        setShowSnackBar(true);
        setLoading(false);
      }
    } catch (err) {
      setSnackBarText("Erro: " + err);
      setShowSnackBar(true);
      setLoading(false);
      console.log("catch: " + err);
    } finally {
      setLoading(false);
      console.log("acabou");
    }
  };

  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(false);

    /* Atualização do estado da data caso a seleção no calendário seja confirmada */
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  const addPack = () => {
    console.log("adicionar pacote");
    setLoading(true);

    /* Validação para garantir que os campos obrigatórios do pacote não estão vazios */
    if (!pointsCost || !rewardDescription || !stock) {
      setSnackBarText(
        "Erro: tem de preencher a quantidade de pontos, a descrição do pacote e a quantidade de stock inicial",
      );
      setShowSnackBar(true);
      setLoading(false);
      return;
    }

    try {
      const newPack = {
        pointsCost: Number(pointsCost),
        rewardDescription: rewardDescription,
        stock: Number(stock),
      };

      /* Adição do novo pacote ao array existente preservando a imutabilidade */
      setPacksList([...packsList, newPack]);

      /* Limpeza dos campos de input do pacote */
      setPointsCost("");
      setRewardDescription("");
      setStock("");
    } catch (err) {
      console.log("Erro na adição do pacote: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          /* Ajuste do comportamento do teclado dependendo do sistema operativo para garantir visibilidade dos campos */
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20, paddingHorizontal: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="mt-4">
              <Text
                variant="displaySmall"
                style={{ color: theme.colors.primary, fontWeight: "bold" }}
              >
                Criar Campanha
              </Text>
            </View>

            {/* Secção 1: Dados Gerais da Campanha */}
            <Surface
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 24,
                marginBottom: 14,
                marginTop: 15,
              }}
              elevation={0}
            >
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 16,
                  marginTop: 15,
                  alignSelf: "center",
                }}
              >
                Dados Gerais
              </Text>
              <CustomTextInput
                label="Título da campanha"
                value={title}
                onChangeText={setTitle}
                className="mb-4"
              />
              <CustomTextInput
                label="Descrição da campanha"
                value={description}
                onChangeText={setDescription}
                className="mb-4"
              />

              <View className="mt-2 mb-2">
                <Text
                  variant="bodyMedium"
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    marginBottom: 8,
                  }}
                >
                  Expira a: {expirationDate.toLocaleDateString("pt-PT")}
                </Text>
                <CustomButton
                  onPress={() => setShowDatePicker(true)}
                  buttonColor={theme.colors.secondaryContainer}
                  textColor={theme.colors.onSecondaryContainer}
                >
                  Alterar data limite
                </CustomButton>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={expirationDate}
                  mode="date"
                  display="default"
                  onValueChange={onChangeDate}
                  minimumDate={new Date()}
                />
              )}
            </Surface>

            {/* Secção 2: Criação e Adição de Pacotes */}
            <Surface
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 24,
                marginTop: 20,
              }}
              elevation={0}
            >
              <Text
                variant="titleLarge"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  marginBottom: 16,
                  marginTop: 32,

                  alignSelf: "center",
                }}
              >
                Novo Pacote
              </Text>

              <CustomTextInput
                label="Descrição da recompensa"
                value={rewardDescription}
                onChangeText={setRewardDescription}
                className="mb-4"
              />

              <CustomTextInput
                label="Custo em pontos"
                value={pointsCost}
                onChangeText={setPointsCost}
                isNumber
                className="mb-4"
              />

              <CustomTextInput
                label="Stock inicial"
                value={stock}
                onChangeText={setStock}
                isNumber
                className="mb-6"
              />

              <CustomButton
                className="mb-2"
                onPress={addPack}
                loading={loading}
                buttonColor={theme.colors.secondaryContainer}
                textColor={theme.colors.onSecondaryContainer}
              >
                Adicionar Pacote
              </CustomButton>
            </Surface>

            {/* Secção 3: Visualização dos Pacotes Criados */}
            {packsList.length > 0 && (
              <View className="mt-8">
                <Text
                  variant="titleMedium"
                  style={{ color: theme.colors.onBackground, marginBottom: 12 }}
                >
                  Pacotes Adicionados ({packsList.length})
                </Text>

                <View className="gap-3">
                  {packsList.map((pack, index) => (
                    <Surface
                      key={index}
                      className="p-4"
                      style={{
                        backgroundColor: theme.colors.secondaryContainer,
                        borderRadius: 16,
                      }}
                      elevation={0}
                    >
                      <Text
                        variant="titleMedium"
                        style={{ color: theme.colors.onSecondaryContainer }}
                      >
                        {pack.rewardDescription}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: theme.colors.onSecondaryContainer,
                          opacity: 0.8,
                        }}
                      >
                        Custo: {pack.pointsCost} pontos • Stock: {pack.stock}
                      </Text>
                    </Surface>
                  ))}
                </View>
              </View>
            )}

            {/* Botão de Submissão Final */}
            <CustomButton
              className="mt-10 mb-8"
              onPress={handleCreateCampaign}
              loading={loading}
              buttonColor={theme.colors.primary}
            >
              Publicar Campanha
            </CustomButton>

            <CustomSnackBar
              visible={showSnackBar}
              message={snakcBarText}
              onDismiss={() => {
                setShowSnackBar(false);
              }}
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Surface>
  );
};

export default CreateCampaign;
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////// A FAZER   ///////////////////////////////////////////////////////
///  Em criar campanha - ícones, dar para apagar pacotes, imagem do folheto e imagem de logótipo
///  INTERFACE DINÂMICA NÃO APARECER LOGO TODOS OS CAMPOS, APENAS 2 ATÉ SEREM PREENCHIDOS PEGAR NAS
///  IDEIAS DA REUNIÃO
