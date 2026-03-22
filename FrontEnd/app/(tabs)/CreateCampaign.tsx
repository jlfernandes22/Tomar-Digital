import { StyleSheet, View } from "react-native";
import React, { useState } from "react";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { ActivityIndicator, Surface, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomTextInput from "../components/CustomTextInput";
import DateTimePicker from "@react-native-community/datetimepicker";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import delay from "../utils/delay";

const CreateCampaign = () => {
  const { user } = useAuth();
  if (!user)
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
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
        //resetar as variáveis uiui
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

    // Se o utilizador não cancelou, atualizamos a data
    if (selectedDate) {
      setExpirationDate(selectedDate);
    }
  };

  const addPack = () => {
    console.log("adicionar pacote");
    setLoading(true);

    if (!pointsCost || !rewardDescription || !stock) {
      setSnackBarText(
        "Erro: tem de preencher a quantidade de pontos, a descrição do pacote e a quantidade de stock inicial",
      );
      setShowSnackBar(true);
      //console.log("falta preencher campos");
      setLoading(false);
      return;
    }

    console.log("campos preenchidos");

    try {
      const newPack = {
        pointsCost: Number(pointsCost),
        rewardDescription: rewardDescription,
        stock: Number(stock),
      };

      setPacksList([...packsList, newPack]);

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
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <Text variant="headlineLarge">Criar Campanha</Text>

        <View>
          <Text variant="headlineSmall">Campos da campanha</Text>
          <CustomTextInput
            label="Título da campanha"
            value={title}
            onChangeText={setTitle}
          ></CustomTextInput>
          <CustomTextInput
            label="Descrição da campanha"
            value={description}
            onChangeText={setDescription}
          ></CustomTextInput>
          <Text>
            Data de expiração selecionada:{" "}
            {expirationDate.toLocaleDateString("pt-PT")}
          </Text>
          <CustomButton onPress={() => setShowDatePicker(true)}>
            <Text>Escolher data limite</Text>
          </CustomButton>

          {showDatePicker && (
            <DateTimePicker
              value={expirationDate}
              mode="date"
              display="default"
              onValueChange={onChangeDate}
              minimumDate={new Date()}
            ></DateTimePicker>
          )}
        </View>

        <Text variant="headlineLarge" className="mt-4">
          {" "}
          Criação de pacotes
        </Text>

        <CustomTextInput
          label="Custo em pontos do pacote"
          value={pointsCost}
          onChangeText={setPointsCost}
          isNumber
        ></CustomTextInput>

        <CustomTextInput
          label="Descrição do pacote"
          value={rewardDescription}
          onChangeText={setRewardDescription}
        ></CustomTextInput>

        <CustomTextInput
          label="Quantidade de stock inicial"
          value={stock}
          onChangeText={setStock}
          isNumber
        ></CustomTextInput>

        <CustomButton className="mt-4" onPress={addPack} loading={loading}>
          Adicionar pacote à campanha
        </CustomButton>

        <CustomButton
          className="mt-8"
          onPress={handleCreateCampaign}
          loading={loading}
        >
          Adicionar campanha
        </CustomButton>
        <CustomSnackBar
          visible={showSnackBar}
          message={snakcBarText}
          onDismiss={() => {
            setShowSnackBar(false);
          }}
        ></CustomSnackBar>
      </SafeAreaView>
    </Surface>
  );
};

export default CreateCampaign;

const styles = StyleSheet.create({});
