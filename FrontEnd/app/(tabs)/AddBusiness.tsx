import React, { useState } from "react";
import { View, ScrollView, Image } from "react-native";
import {
  Surface,
  Text,
  useTheme,
  ProgressBar,
  TouchableRipple,
  IconButton,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import Map from "@/app/components/Map";
import { delay } from "../utils/delay";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import CustomSnackBar from "../components/CustomSnackBar";
import CustomChip from "../components/CustomChip";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { router } from "expo-router";

export default function AddBusiness() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [reverseLocation, setReverseLocation] = useState<string | null>(null);
  const INITIAL_FORM_DATA = {
    nomeNegocio: "",
    NIFnegocio: "",
    categoriaNegocio: "",
    logotipoNegocio: "",
    moradaNegocio: "",
    freguesiaNegocio: "",
    localizacao: {
      latitude: 0,
      longitude: 0,
    },
    telefoneDono: "",
    emailDono: "",
    descricaoNegocio: "",
    galeriaFotos: [] as string[],
  };
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const theme = useTheme();

  const categories = [
    "Património & Museus",
    "Restauração",
    "Cafés & Pastelarias",
    "Alojamento",
    "Comércio Local",
    "Lazer & Natureza",
    "Serviços",
  ];

  const selecionarLogotipo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert(
        "Precisamos de acesso às tuas fotos para carregares o logótipo do negócio!",
      );
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!resultado.canceled) {
      setFormData({ ...formData, logotipoNegocio: resultado.assets[0].uri });
    }
  };

  const adicionarFotosGaleria = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Precisamos de ter acesso às tuas fotos para carregares imagens!");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.7,
    });
    if (!resultado.canceled) {
      const novasFotos = resultado.assets.map((asset) => asset.uri);
      setFormData({
        ...formData,
        galeriaFotos: [...formData.galeriaFotos, ...novasFotos],
      });
    }
  };
  const handleNewBusiness = async () => {
    if (!user?.token) {
      setSnackbarMessage("Erro: Sessão expirada.");
      setSnackbarVisible(true);
      return;
    }

    // Validação local rigorosa para evitar 400 do backend
    if (
      !formData.nomeNegocio ||
      !formData.categoriaNegocio ||
      !formData.telefoneDono ||
      !formData.emailDono
    ) {
      setSnackbarMessage(
        "Erro:\nPor favor, preencha todos os campos obrigatórios (incluindo E-mail).",
      );
      setSnackbarVisible(true);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/registarNegocio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          nomeNegocio: formData.nomeNegocio,
          NIFnegocio: formData.NIFnegocio,
          categoriaNegocio: formData.categoriaNegocio,
          logotipoNegocio: formData.logotipoNegocio,
          moradaNegocio: formData.moradaNegocio,
          freguesiaNegocio: formData.freguesiaNegocio,
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
        //console.log(formData);
        console.log(formData.galeriaFotos);
        setSnackbarMessage("Sucesso! Negócio registado.");
        setSnackbarVisible(true);
        await delay(500);

        setFormData(INITIAL_FORM_DATA);

        router.back();
        setStep(1);

        // Reset...
      } else {
        setSnackbarMessage(data.message || "Erro no registo.");
        setSnackbarVisible(true);
      }
    } catch (error) {
      setSnackbarMessage("Erro de ligação ao servidor.");
      setSnackbarVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} className="p-4">
        <ProgressBar
          progress={step / totalSteps}
          color={theme.colors.onBackground}
          style={{ marginBottom: 20 }}
        />
        <Text style={{ marginBottom: 10 }}>
          Página {step} de {totalSteps}
        </Text>

        {step === 1 && (
          <View>
            <CustomTextInput
              label="Nome do Negócio"
              value={formData.nomeNegocio}
              onChangeText={(t) => setFormData({ ...formData, nomeNegocio: t })}
            />
            <CustomTextInput
              label="NIF"
              value={formData.NIFnegocio}
              onChangeText={(t) => setFormData({ ...formData, NIFnegocio: t })}
            />
            <View className="mb-2">
              <Text variant="bodyMedium" className="mt-4 mb-2">
                Categoria do Negócio:
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                contentContainerStyle={{
                  paddingVertical: 5,
                  paddingHorizontal: 5,
                }}
              >
                {categories.map((cat) => {
                  const isSelected = formData.categoriaNegocio === cat;
                  return (
                    <CustomChip
                      key={cat}
                      isSelected={isSelected}
                      onPress={() => {
                        setFormData({ ...formData, categoriaNegocio: cat });
                      }}
                      className="p-1 m-1"
                    >
                      {cat}
                    </CustomChip>
                  );
                })}
              </ScrollView>
            </View>
            <View style={{ marginVertical: 10 }}>
              <Text
                style={{
                  marginBottom: 15,
                  fontSize: 14.5,
                  color: theme.colors.onBackground,
                }}
              >
                Logótipo do Negócio:
              </Text>
              <TouchableRipple
                onPress={selecionarLogotipo}
                style={{
                  height: 200,
                  width: 200,
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderStyle: "dashed",
                  borderRadius: 10,
                  backgroundColor: theme.colors.onBackground,
                }}
              >
                {formData.logotipoNegocio ? (
                  <Image
                    source={{ uri: formData.logotipoNegocio }}
                    style={{ width: "100%", height: "100%", borderRadius: 10 }}
                  />
                ) : (
                  <Text
                    style={{
                      color: theme.colors.background,
                      textAlign: "center",
                      margin: 60,
                    }}
                  >
                    Clique para carregar o logótipo
                  </Text>
                )}
              </TouchableRipple>
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <CustomTextInput
              label="Morada completa do negócio:"
              value={formData.moradaNegocio}
              onChangeText={(t) =>
                setFormData({ ...formData, moradaNegocio: t })
              }
            />
            <CustomTextInput
              label="Freguesia:"
              value={formData.freguesiaNegocio}
              onChangeText={(t) =>
                setFormData({ ...formData, freguesiaNegocio: t })
              }
            />
            <View
              style={{
                marginTop: 15,
                height: 350,
                borderRadius: 10,
                overflow: "hidden",
              }}
            >
              <Map
                showPin={true}
                onLocationSelect={async (location) => {
                  console.log(location);
                  setFormData({
                    ...formData,
                    localizacao: {
                      latitude: location.latitude,
                      longitude: location.longitude,
                    },
                  });

                  try {
                    const geocode = await Location.reverseGeocodeAsync({
                      latitude: location.latitude,
                      longitude: location.longitude,
                    });

                    if (geocode.length > 0) {
                      //console.log(geocode);
                      const address = geocode[0].formattedAddress;
                      setFormData({
                        ...formData,
                        moradaNegocio: address || "",
                      });
                    }
                  } catch (err) {}
                }}
              />
            </View>
          </View>
        )}

        {step === 3 && (
          <View>
            <CustomTextInput
              label="Telefone do Dono"
              value={formData.telefoneDono}
              onChangeText={(t) =>
                setFormData({ ...formData, telefoneDono: t })
              }
            />
            <CustomTextInput
              label="Descrição Detalhada do Negócio"
              value={formData.descricaoNegocio}
              onChangeText={(t) =>
                setFormData({ ...formData, descricaoNegocio: t })
              }
            />
            <CustomTextInput
              label="E-mail do Dono"
              value={formData.emailDono}
              onChangeText={(t) => setFormData({ ...formData, emailDono: t })}
            />
            <View style={{ marginVertical: 15 }}>
              <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
                Galeria de Fotos (Máx. 5)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flexDirection: "row" }}
              >
                {formData.galeriaFotos.length < 5 && (
                  <TouchableRipple
                    onPress={adicionarFotosGaleria}
                    style={{
                      width: 100,
                      height: 100,
                      borderWidth: 1,
                      borderColor: "#ccc",
                      borderStyle: "dashed",
                      borderRadius: 8,
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 10,
                    }}
                  >
                    <Text style={{ textAlign: "center", fontSize: 12 }}>
                      + Foto
                    </Text>
                  </TouchableRipple>
                )}
                {formData.galeriaFotos.map((uri, index) =>
                  uri ? (
                    <View
                      key={index}
                      style={{ marginRight: 10, position: "relative" }}
                    >
                      <Image
                        source={{ uri }}
                        style={{ width: 100, height: 100, borderRadius: 8 }}
                      />
                      <IconButton
                        icon="close-circle"
                        size={20}
                        iconColor="red"
                        style={{
                          position: "absolute",
                          top: -10,
                          right: -10,
                          backgroundColor: "white",
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
          </View>
        )}

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20,
          }}
        >
          {step > 1 && (
            <CustomButton
              onPress={prevStep}
              buttonColor={theme.colors.onBackground}
              textColor={theme.colors.background}
            >
              Anterior
            </CustomButton>
          )}
          {step < totalSteps ? (
            <CustomButton
              onPress={nextStep}
              buttonColor={theme.colors.onBackground}
              textColor={theme.colors.background}
            >
              Próximo
            </CustomButton>
          ) : (
            <CustomButton
              loading={loading}
              onPress={handleNewBusiness}
              buttonColor={theme.colors.onBackground}
              textColor={theme.colors.background}
            >
              Enviar
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
