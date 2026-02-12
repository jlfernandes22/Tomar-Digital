import React, { useState } from "react";
import { Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { Picker } from "@react-native-picker/picker";
import MapView, { Marker } from 'react-native-maps'; 
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { Dimensions } from "react-native";
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
    <SafeAreaView className="flex-1 p-6 bg-white">
      <Text className="text-2xl font-bold mb-6 text-center">Adicionar Negócio</Text>
      
      <View className="space-y-4">
        <TextInput 
          className="border border-gray-300 p-4 rounded-xl"
          placeholder="Nome do Negócio"
          value={name}
          onChangeText={setName}
        />

        <Text className="font-semibold ml-1">Categoria:</Text>
        <View className="border border-gray-300 rounded-xl overflow-hidden">
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
          >
            {categories.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        {/* MAPA INTERATIVO */}
      <View style={{ height: 350, width: width - 40, alignSelf: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#e5e5e5' }}>
            <MapView
                style={{ flex: 1 }}
                initialRegion={{
                latitude: 39.6036,
                longitude: -8.4151,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
                }}
                onPress={(e) => setSelectedLocation(e.nativeEvent.coordinate)}
            >
                <Marker coordinate={selectedLocation} />
            </MapView>
        </View>
<View className="p-4 bg-white">
        <TouchableOpacity 
          onPress={handleNewBusiness}
          className="bg-purple-600 p-4 rounded-2xl items-center shadow-sm"
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold">Submeter para Aprovação</Text>}
        </TouchableOpacity>
      </View>
      </View>
    </SafeAreaView>
  );
}