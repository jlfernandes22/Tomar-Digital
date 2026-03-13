import { ScrollView, View } from 'react-native';
import { ActivityIndicator, Text, Snackbar, Surface } from 'react-native-paper';
import React, { useState } from 'react';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import CustomButton from '../components/CustomButton' 
import { delay } from '@/app/utils/delay';
import CustomTextInput from '../components/CustomTextInput';

const EditProfile = () => {
    const { user, updateUser } = useAuth();
    
    
    if (!user) return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );

    const [name, setName] = useState(user.name || "");
    const [city, setCity] = useState(user.city || "");
    const [NIF, setNIF] = useState(user.NIF ? String(user.NIF) : "");
    const [loading, setLoading] = useState(false); // Para o botão de loading
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handleEdit = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/editar/${user.id}`, {
              method: 'POST',
              headers: { 
                'Authorization': `Bearer ${user.token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                  name: name,
                  city: city,
                  NIF: NIF ? Number(NIF) : null
            }),
          });

          if(response.ok){
            setSnackbarMessage("Sucesso! :Alteração de dados com sucesso");
            setSnackbarVisible(true);
            await delay(300)
            updateUser({ 
                  name: name, 
                  city: city, 
                  NIF: NIF ? Number(NIF) : null 
              });

              

            router.replace("/(tabs)/profile");
          } else {
            setSnackbarMessage("Aviso: O servidor rejeitou as alterações.");
            setSnackbarVisible(true);
            
          }
        } catch(err) {
            setSnackbarMessage("Erro: Falha na ligação ao servidor\n" + err);
            setSnackbarVisible(true);
        } finally {
            setLoading(false);
        }
    }

  return (
    <Surface className='flex-1'>
      <SafeAreaView className="flex-1 bg-convento-50">

        <ScrollView>

          {/* Cabeçalho */}
          <View className="items-center mt-6 mb-8 px-6">
            <View className="bg-convento-300 w-full py-4 rounded-2xl shadow-sm items-center">
              <Text className="text-white text-2xl font-bold text-center">
                Editar Informações
              </Text>
            </View>
          </View>

          <View className="px-9 space-y-4">

            <CustomTextInput 
              label="Nome Completo"
              value={name} 
              onChangeText={setName}  
            />

            <CustomTextInput 
              label="Cidade"
              value={city} 
              onChangeText={setCity} 
            />

            {user.NIF == null && (
              <CustomTextInput 
                label="NIF"
                value={NIF} 
                onChangeText={setNIF} 
                isNIF
                
              />
            )}

            <View className="items-center mt-10">

              <CustomButton onPress={handleEdit} buttonColor='#FF6600' loading={loading} className='mb-[3rem]'>
                Confirmar Alterações
              </CustomButton>

              <CustomButton onPress={ () => router.replace("/(tabs)/profile")} buttonColor='#FF3333'>
                Cancelar
              </CustomButton>

            </View>

          </View>
        </ScrollView>
        <Snackbar
          visible={snackbarVisible}
          onDismiss={() => setSnackbarVisible(false)}
          duration={3000} // Desaparece sozinho após 3 segundos
          style={{
            // Lógica simples: Se a mensagem contiver a palavra "Erro" ou "Aviso", fica vermelho. Se não, fica verde.
            backgroundColor: snackbarMessage.includes('Erro') || snackbarMessage.includes('Aviso') 
              ? '#DC2626' 
              : '#16A34A', 
            borderRadius: 16, // Mantém a coerência com os botões arredondados
            marginHorizontal: 16, // Dá o efeito de flutuação, não colado às margens
          }}
          action={{
            label: 'OK',
            textColor: 'white', // Texto da ação a branco para contrastar
            onPress: () => {
              setSnackbarVisible(false);
            },
          }}
        >
          {/* O texto do Snackbar */}
          <Text style={{ color: 'white', fontSize: 15, fontWeight: '500' }}>
            {snackbarMessage}
          </Text>
        </Snackbar>
      </SafeAreaView>
    </Surface>

    
  );
}

export default EditProfile;