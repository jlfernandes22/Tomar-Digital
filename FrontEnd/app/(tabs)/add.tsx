import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { Chip, Surface, Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import  Map  from "@/app/components/Map"
import {delay} from "../utils/delay";
import CustomTextInput from "../components/CustomTextInput";
import CustomButton from "../components/CustomButton";
import PortalSnackBar from "../components/CustomSnackBar";

export default function AddBusinessCamara() {


  const { user } = useAuth() // Importa o utilizador da sessão atual
  const [name, setName] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(false)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage,setSnackbarMessage] = useState("")
  const theme = useTheme()
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 39.6036, 
    longitude: -8.4151,
  });

  // Categorias vindas do seu Schema
  const categories = ['Património & Museus', // Para o Convento, Sinagoga, Mata dos Sete Montes
        'Restauração',         // Restaurantes e Tabernas
        'Cafés & Pastelarias', // Essencial para as "Fatias de Tomar"
        'Alojamento',          // Hotéis e ALs
        'Comércio Local',      // Lojas do centro histórico
        'Lazer & Natureza',    // Rio Nabão, Parque do Mouchão
        'Serviços'     ];


const handleNewBusiness = async () => {
  if (!name) {
    setSnackbarMessage("Erro: " + "Por favor indique o nome do negócio")
    setSnackbarVisible(true)
    await delay(400)
    
    return;
  }

  // Verificação de segurança: Se não há user ou token, nem vale a pena tentar
  if (!user?.token) {
    setSnackbarMessage("Erro: " + "Sessão expirada. Por favor, faça login novamente")
    setSnackbarVisible(true)
    await delay(400)

    return;
  }

  setLoading(true);

  try {
    
    const response = await fetch(`${API_URL}/registarNegocio`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user?.token}` 
        },
        body: JSON.stringify({ 
          name,           
          category,   
          owner: user?.id, 
          location: { 
            lat: selectedLocation.latitude, 
            long: selectedLocation.longitude 
          } 
        }),
      });

    
  if (response.ok) {
    setSnackbarMessage("Sucesso!\n " + "Negócio registado no local escolhido.")
    setSnackbarVisible(true)
    await delay(400)
    setName("");
    } else {
      const error = await response.json();
      setSnackbarMessage("Aviso\n " + error.message || "Erro no registo.")
      setSnackbarVisible(true)
      await delay(400)

    }
    } catch (error) {
      setSnackbarMessage("Erro\n " + error.message || "Falha na ligação.")
      setSnackbarVisible(true)
      await delay(400)

    } finally {
      setLoading(false);
    }
  };
  return (
    <Surface className="flex-1">
      <SafeAreaView >
        <ScrollView className="p-4 mr-2">
          <Text className="text-3xl font-bold text-center mb-8">
            Adicionar Negócio
          </Text>

            {/* Nome do Negócio */}
            <View
              accessibilityLabel="Introduza o nome do negócio"
            >
              <CustomTextInput 
                label="Nome do negócio"
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* Categoria */}
            <View className="mb-2">
              <Text variant="bodyLarge" className="mt-4 mb-2 text-center opacity-70">
                Categoria:
              </Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                contentContainerStyle={{ paddingVertical: 5, paddingHorizontal: 16 }}
              >
                {categories.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <Chip
                      key={cat}
                      mode="outlined" 
                      selected={isSelected} 
                      onPress={() => setCategory(cat)}
                      className="mr-3 mb-2" 
                      showSelectedCheck={false}
                      // A MAGIA DAS CORES AQUI:
                      style={{
                        backgroundColor: isSelected ? '#FF6600' : 'transparent',
                        borderColor: isSelected ? '#FF6600' : theme.colors.outline,
                      }}
                      textStyle={{
                        color: isSelected ? 'white' : theme.colors.onSurface,
                        fontWeight: isSelected ? 'bold' : 'normal',
                      }}
                    >
                      {cat}
                    </Chip>
                  );
                })}
              </ScrollView>
            </View>

            {/* MAPA INTERATIVO */}
            <View>
              <Text className="text-primary  mb-2 text-center">Localização no Mapa:</Text>
              <View 
                className="border-2 border-tomar-200 rounded-lg h-[20rem] overflow-hidden bg-primary"
                accessibilityLabel="Mapa interativo para selecionar localização"
              >
                <Map 
                  showPin={true}
                  onLocationSelect={(location) => setSelectedLocation(location)}
                />

              </View>
              <Text className="text-tomar-600 text-s mt-2 text-center">
                Toque no mapa para marcar o local exato do negócio.
              </Text>
            </View>
              
            {/* Botão Submeter */}
            <View 
              className="mt-8"
              accessibilityRole="button"
              accessibilityLabel="Submeter negócio para aprovação"
            >
              <CustomButton 
                onPress={handleNewBusiness}
                loading={loading}
                               
              >
                Submeter para Aprovação
              </CustomButton>
            </View>

        </ScrollView>
        <PortalSnackBar 
          visible={snackbarVisible} 
          message={snackbarMessage} 
          onDismiss={() => setSnackbarVisible(false)} 
        />
      </SafeAreaView>
    </Surface>              
  );
}