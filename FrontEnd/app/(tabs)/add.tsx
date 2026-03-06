import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from "react-native";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from 'react-native-maps'; 
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { Dimensions } from "react-native";
import  Map  from "@/app/components/map"
export default function AddBusinessCamara() {


  const { user } = useAuth(); // Importa o utilizador da sessão atual
  const { width } = Dimensions.get('window');
  const [name, setName] = useState("");
  const [userName, setUserName] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
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
    Alert.alert("Erro", "Por favor, indique o nome do negócio.");
    return;
  }

  // Verificação de segurança: Se não há user ou token, nem vale a pena tentar
  if (!user?.token) {
    Alert.alert("Erro", "Sessão expirada. Por favor, faça login novamente.");
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
        Alert.alert("Sucesso!", "Negócio registado no local escolhido.");
        setName("");
      } else {
        const erro = await response.json();
        Alert.alert("Aviso", erro.message || "Erro no registo.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na ligação.");
    } finally {
      setLoading(false);
    }
  };
return (
    <SafeAreaView className="flex-1 bg-tomar-50">
      <ScrollView className="p-4 mr-2">
        <Text className="text-3xl font-bold text-primary text-center mb-8">
          Adicionar Negócio
        </Text>
        
          {/* Nome do Negócio */}
          <View>
            <Text className="text-primary text-center  mb-2 ">Nome do Negócio:</Text>
            <TextInput 
              className="bg-white border-2 border-tomar-300 p-4 rounded-xl text-primary text-lg"
              placeholder="Ex: Pastelaria Nabão"
              placeholderTextColor="#946648" 
              value={name}
              onChangeText={setName}
              accessibilityLabel="Introduza o nome do negócio"
            />
          </View>

          {/* Categoria */}
          <View className="mb-2">
            <Text className="text-primary mt-4 text-center">Categoria:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="flex-row"
              contentContainerStyle={{ paddingVertical: 5 }}
            >
              {categories.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`mr-3 px-6 h-11 justify-center rounded-full border-2 ${
                      isSelected 
                      ? 'bg-accent border-accent' 
                      : 'bg-white border-tomar-200'
                    }`}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`Categoria ${cat}`}
                  >
                    <Text className={`text-base font-bold ${isSelected ? 'text-white' : 'text-primary'}`}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MAPA INTERATIVO */}
          <View>
            <Text className="text-primary  mb-2 text-center">Localização no Mapa:</Text>
            <View 
              style={{ height: 350, borderRadius: 20, overflow: 'hidden', backgroundColor: '#ebe1da' }}
              className="border-2 border-tomar-200"
              accessibilityLabel="Mapa interativo para selecionar localização"
            >
              <Map/>

            </View>
            <Text className="text-tomar-600 text-s mt-2 text-center">
              Toque no mapa para marcar o local exato do negócio.
            </Text>
          </View>
          
          {/* Botão Submeter */}
          <View className="mt-8">
            <TouchableOpacity 
              onPress={handleNewBusiness}
              disabled={loading}
              className="bg-brand-600 h-16 rounded-2xl items-center justify-center shadow-md active:bg-brand-800"
              accessibilityRole="button"
              accessibilityLabel="Submeter negócio para aprovação"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-bold text-xl">Submeter para Aprovação</Text>
              )}
            </TouchableOpacity>
          </View>
      </ScrollView>
    </SafeAreaView>
  );
}