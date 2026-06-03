import { ScrollView, View, Image, Dimensions } from 'react-native';
import React, { useEffect, useState, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Map from './Map';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  IconButton,
  Surface,
  Text,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import MapRefType from '@/constants/Interfaces/MapRefType';
import { API_URL } from '@/constants/api'; // Certifica-te que importas o teu API_URL

const DetalhesBusiness = () => {
  const { dadosNegocio } = useLocalSearchParams<{ dadosNegocio: string }>();
  const { businessId } = useLocalSearchParams<{ businessId: string }>();
  const [business, setBusiness] = useState(JSON.parse(dadosNegocio || '{}'));
  const [loading, setLoading] = useState(false);
  const hoje = new Date();

  const router = useRouter();
  const theme = useTheme();
  const mapRef = useRef<MapRefType>(null);

  useEffect(() => {
    if (business) {
      console.log('Conteúdo de campanhas:', JSON.stringify(business.campaigns));
    }
    if (!businessId) {
      console.warn('Nenhum businessId fornecido');
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/negocios/${businessId}`);
        if (!response.ok) throw new Error('Erro ao carregar');
        const data = await response.json();
        console.log('DADOS DO NEGOCIO:', JSON.stringify(data, null, 2));
        setBusiness(data);
      } catch (e) {
        console.error('Erro ao buscar negócio:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [businessId]);
  if (loading) {
    return (
      <Surface
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <ActivityIndicator size="large" />
      </Surface>
    );
  }

  const campanhasAtivas =
    business.campaigns?.filter((c: any) => {
      const inicio = new Date(c.campaign.DataInicio);
      const fim = new Date(c.campaign.DataExpiracao);

      return c.status === 'aprovado' && hoje >= inicio && hoje <= fim;
    }) || [];

  if (!business) {
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
        <Text variant="bodyLarge">Não foi possível carregar o negócio.</Text>
        <IconButton
          icon="arrow-left"
          mode="contained"
          style={{ marginTop: 16 }}
          onPress={() => router.back()}
        />
      </Surface>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: false }} />

        <View className="flex-row items-center px-3 py-2">
          <IconButton
            icon="arrow-left"
            size={24}
            iconColor={theme.colors.onBackground}
            onPress={() => router.back()}
          />
          <Text
            variant="titleMedium"
            className="ml-1 flex-1 font-bold"
            style={{ color: theme.colors.onBackground }}
          >
            Voltar
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-4">
            {business.logo ? (
              <Image
                source={{ uri: business.logo }}
                className="h-56 w-full rounded-2xl"
                resizeMode="cover"
              />
            ) : (
              <Text>SEM logo</Text>
            )}
          </View>

          <View className="mt-5 px-5">
            <Text
              variant="labelLarge"
              style={{
                color: theme.colors.primary,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}
            >
              {business.category}
            </Text>

            <Text
              variant="headlineMedium"
              className="mt-1 font-bold"
              style={{ color: theme.colors.onBackground }}
            >
              {business.name}
            </Text>

            {business.owner?.name && (
              <Text
                variant="bodyMedium"
                className="mt-1"
                style={{ opacity: 0.7 }}
              >
                Por {business.owner.name}
              </Text>
            )}

            <View className="h-6" />

            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {business.description || 'Sem descrição disponível.'}
            </Text>

            {/* Secção de Campanhas - Hierarquia Corrigida */}
            <View style={{ marginTop: 24 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', marginBottom: 8 }}
              >
                Campanhas Ativas:
              </Text>

              {campanhasAtivas.length > 0 ? (
                campanhasAtivas.map((c: any, index: number) => (
                  <Surface
                    key={index}
                    elevation={1}
                    style={{
                      marginBottom: 10,
                      padding: 16,
                      borderRadius: 12,
                      backgroundColor: theme.colors.surfaceVariant,
                    }}
                  >
                    <Text variant="titleSmall" style={{ fontWeight: 'bold' }}>
                      {c.campaign?.titulo || 'Campanha sem título'}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      Válida até:{' '}
                      {new Date(c.campaign.DataExpiracao).toLocaleDateString()}
                    </Text>
                  </Surface>
                ))
              ) : (
                <Text
                  variant="bodyMedium"
                  style={{ fontStyle: 'italic', opacity: 0.7 }}
                >
                  Não existem campanhas ativas neste momento.
                </Text>
              )}
            </View>

            {/* Mapa */}
            <Surface
              style={{
                marginTop: 32,
                borderRadius: 16,
                elevation: 4,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View
                style={{
                  borderRadius: 16,
                  overflow: 'hidden',
                  height: 240,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                }}
              >
                <Map
                  ref={mapRef}
                  location={business.location}
                  showPin={true}
                  readOnly
                />
              </View>
            </Surface>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

export default DetalhesBusiness;
