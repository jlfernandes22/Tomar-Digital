import { ScrollView, View, Image, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  Appbar,
} from 'react-native-paper';
import MapRefType from '@/constants/Interfaces/MapRefType';
import { API_URL } from '@/constants/api';
import CustomButton from './CustomButton';
import { curiosidades } from '@/constants/curiosities';
import { useLoadingState } from '@/context/LoadingContext';
import LoadingScreen from './LoadingScreen';

const DetalhesBusiness = () => {
  const { t, i18n } = useTranslation();
  const { dadosNegocio } = useLocalSearchParams<{ dadosNegocio: string }>();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [business, setBusiness] = useState(JSON.parse(dadosNegocio || '{}'));
  const { loadingQR, setLoadingQR } = useLoadingState();
  const [loading, setLoading] = useState(false);
  const hoje = new Date();

  const router = useRouter();
  const theme = useTheme();
  const mapRef = useRef<MapRefType>(null);

  useEffect(() => {
    if (!id) {
      console.warn('Nenhum businessId fornecido');
      setLoading(false);
      return;
    }

    const fetchBusiness = async () => {
      console.log('fetch business data');
      try {
        setLoading(true);

        const response = await fetch(`${API_URL}/negocios/${id}`);
        if (!response.ok) throw new Error('Erro ao carregar');
        const data = await response.json();
        console.log('DADOS DO NEGOCIO:', JSON.stringify(data, null, 2));
        await setBusiness(data);
        //console.log(business.location)
      } catch (e) {
        console.error('Erro ao buscar negócio:', e);
      } finally {
        setLoading(false);
      }
    };

    if (business) {
      console.log('Conteúdo de campanhas:', JSON.stringify(business.campaigns));
    }

    fetchBusiness();
  }, [id]);

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
        <Text variant="bodyLarge">
          {t('merchant.error_load_business', {
            defaultValue: 'Não foi possível carregar o negócio.',
          })}
        </Text>
        <IconButton
          icon="arrow-left"
          mode="contained"
          style={{ marginTop: 16 }}
          onPress={() => router.back()}
          accessible={true}
          accessibilityLabel={t('accessibility.go_back', {
            defaultValue: 'Voltar atrás',
          })}
        />
      </Surface>
    );
  }

  useEffect(() => {
    setLoadingQR(loading);
  }, [loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction
          onPress={() => router.back()}
          color={theme.colors.onBackground}
        />
        <Appbar.Content
          title={t('common.back_btn', { defaultValue: 'Voltar' })}
          titleStyle={{ fontWeight: 'bold' }}
        />
      </Appbar.Header>
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['left', 'right']}
      >
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          <View className="px-4">
            {business.logo ? (
              <Image
                source={{
                  uri:
                    business.logo.startsWith('file://') ||
                    business.logo.startsWith('content://') ||
                    business.logo.startsWith('http')
                      ? business.logo
                      : `${API_URL}${business.logo}`,
                }}
                className="h-32 w-32 items-center justify-center rounded-full border-2"
                style={{
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.outline,
                }}
              />
            ) : (
              <></>
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
              {t(`categories.${business.category}`, {
                defaultValue: business.category,
              })}
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
                {t('merchant.by_owner', {
                  owner: business.owner.name,
                  defaultValue: `Por ${business.owner.name}`,
                })}
              </Text>
            )}

            <View className="h-6" />

            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              {business.description ||
                t('common.no_description_available', {
                  defaultValue: 'Sem descrição disponível.',
                })}
            </Text>

            {/* Secção da Galeria */}
            {business.gallery && business.gallery.length > 0 && (
              <View style={{ marginTop: 24 }}>
                <Text
                  variant="titleMedium"
                  style={{ fontWeight: 'bold', marginBottom: 12 }}
                >
                  {t('merchant.photo_gallery', {
                    defaultValue: 'Galeria de Fotos',
                  })}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="flex-row"
                >
                  {business.gallery.map((fotoUrl: string, index: number) => (
                    <Image
                      key={index}
                      source={{
                        uri:
                          fotoUrl.startsWith('file://') ||
                          fotoUrl.startsWith('content://') ||
                          fotoUrl.startsWith('http')
                            ? fotoUrl
                            : `${API_URL}${fotoUrl}`,
                      }}
                      style={{
                        width: 200,
                        height: 150,
                        borderRadius: 12,
                        marginRight: 12,
                        backgroundColor: theme.colors.surfaceVariant,
                      }}
                      resizeMode="cover"
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Secção de Campanhas - Hierarquia Corrigida */}
            <View style={{ marginTop: 24 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', marginBottom: 8 }}
              >
                {t('merchant.active_campaigns', {
                  defaultValue: 'Campanhas Ativas:',
                })}
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
                      {c.campaign?.titulo ||
                        t('common.no_title_campaign', {
                          defaultValue: 'Campanha sem título',
                        })}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {t('merchant.valid_until', {
                        defaultValue: 'Válida até:',
                      })}{' '}
                      {new Date(c.campaign.DataExpiracao).toLocaleDateString(
                        i18n.language === 'pt' ? 'pt-PT' : 'en-US',
                      )}
                    </Text>
                  </Surface>
                ))
              ) : (
                <Text
                  variant="bodyMedium"
                  style={{ fontStyle: 'italic', opacity: 0.7 }}
                >
                  {t('merchant.no_active_campaigns', {
                    defaultValue: 'Não existem campanhas ativas neste momento.',
                  })}
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
    </>
  );
};

export default DetalhesBusiness;
