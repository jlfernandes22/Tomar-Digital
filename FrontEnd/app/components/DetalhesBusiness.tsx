import { ScrollView, StyleSheet, View, Image } from 'react-native';
import React, { useCallback, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Map from './Map';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import { API_URL } from '@/constants/api';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  IconButton,
  Surface,
  Text,
} from 'react-native-paper';
import MapRefType from '@/constants/Interfaces/MapRefType';
import NegocioInterface from '@/constants/Interfaces/Negocio';
import { useAppTheme } from '@/context/ThemeContext';

const DetalhesBusiness = () => {
  const businessId = useLocalSearchParams();
  const [business, setBusiness] = useState<NegocioInterface>();
  const [loading, setLoading] = useState(true); // Começa em true para mostrar o spinner inicial
  const router = useRouter();
  const { currentTheme: theme } = useAppTheme();
  const mapRef = useRef<MapRefType>(null);

  const handleBusiness = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/negocios/${businessId.id}`);
      const dados = await response.json();
      setBusiness(dados);
      //console.log(dados.location);
    } catch (error) {
      console.log('Não foi possível obter a informação sobre o negócio', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      handleBusiness();
    }, []),
  );

  if (loading) {
    return (
      <Surface
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Surface>
    );
  }

  if (business) {
    return (
      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          <Stack.Screen options={{ headerShown: false }} />

          {/* --- CABEÇALHO LIMPO --- */}
          <View className="flex-row items-center px-2 py-1">
            <IconButton
              icon="arrow-left"
              size={24}
              iconColor={theme.colors.onBackground}
              onPress={() => router.back()}
            />
          </View>

          {/* --- CORPO DA PÁGINA --- */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
          >
            {/* HERÓI (Imagem) - Bleed ligeiro nas margens para um look moderno */}
            <View className="px-4">
              {business.logo !== '' && (
                <Image
                  source={{ uri: business.logo as string }}
                  // Altura reduzida para h-64. Sombras suaves adicionadas.
                  className="h-64 w-full rounded-2xl shadow-sm"
                  style={{ backgroundColor: theme.colors.surfaceVariant }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* CONTEÚDO PRINCIPAL (Tudo alinhado perfeitamente à esquerda com px-5) */}
            <View className="mt-5 px-5">
              {/* Título e Categoria */}
              <View className="mb-2 flex-row items-center justify-between">
                <Text
                  variant="headlineLarge"
                  className="mr-3 flex-1 font-bold"
                  style={{
                    color: theme.colors.primary,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    textAlign: 'center',
                    margin: 10,
                  }}
                >
                  {business.name}
                </Text>
              </View>

              {/* Tag da Categoria Limpa */}
              <View
                className="mb-6 flex-row items-center self-start rounded-lg px-3 py-1.5"
                style={{
                  backgroundColor: theme.colors.secondaryContainer,
                  alignSelf: 'center',
                }}
              >
                <Ionicons
                  name="pricetag-outline"
                  size={14}
                  color={theme.colors.onSecondaryContainer}
                  style={{ marginRight: 6 }}
                />
                <Text
                  variant="labelMedium"
                  style={{
                    color: theme.colors.onSecondaryContainer,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    textAlign: 'center',
                    margin: 10,
                  }}
                >
                  {business.category}
                </Text>
              </View>

              {/* Descrição sem margens estranhas */}
              <Text
                variant="bodyLarge"
                className="mb-8 leading-6"
                style={{
                  color: theme.colors.onSurfaceVariant,
                  alignSelf: 'center',
                }}
              >
                {business.description}
              </Text>

              {/* Galeria de fotos */}
              {business.gallery && business.gallery.length > 0 && (
                <View className="mb-8">
                  {/* Cabeçalho de secção minimalista (sem a bolha à volta) */}
                  <Text
                    variant="titleLarge"
                    className="mb-4 font-bold"
                    style={{
                      color: theme.colors.onBackground,
                      fontWeight: 'bold',
                      marginBottom: 10,
                      textAlign: 'center',
                      margin: 10,
                    }}
                  >
                    Galeria
                  </Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {business.gallery.map((uri: string, index: number) =>
                      uri ? (
                        <Image
                          key={index}
                          source={{ uri }}
                          className="mr-3 h-32 w-32 rounded-xl"
                          style={{
                            backgroundColor: theme.colors.surfaceVariant,
                          }}
                          resizeMode="cover"
                        />
                      ) : null,
                    )}
                  </ScrollView>
                </View>
              )}

              {/* Secção do Mapa */}
              <View className="mb-4">
                <Text
                  variant="titleLarge"
                  className="mb-4 font-bold"
                  style={{
                    color: theme.colors.onBackground,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    textAlign: 'center',
                    margin: 10,
                  }}
                >
                  Localização
                </Text>

                <View
                  className="h-[20rem] overflow-hidden rounded-2xl border"
                  style={{ borderColor: theme.colors.outlineVariant }}
                >
                  <Map
                    ref={mapRef}
                    location={business.location}
                    showPin={true}
                    readOnly
                  />
                </View>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Surface>
    );
  }

  // 3. ESTADO DE ERRO/VAZIO
  return (
    <SafeAreaView
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Text variant="bodyLarge">Não foi possível carregar o negócio.</Text>
    </SafeAreaView>
  );
};

export default DetalhesBusiness;
