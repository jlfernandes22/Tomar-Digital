import React from 'react';
import { View, ScrollView, Image, Linking } from 'react-native';
import { Text, Card, Divider, Surface } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from './CustomButton'; // Seu componente
import { images } from '@/constants/images'; // Ajuste conforme seu caminho

const SobreAPP = () => {
  const { currentTheme: theme } = useAppTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* HEADER / LOGO */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 40,
              backgroundColor: theme.colors.secondaryContainer,
            }}
          >
            <Surface
              elevation={2}
              style={{
                borderRadius: 20,
                padding: 10,
                backgroundColor: 'white',
              }}
            >
              <Image
                source={images.logo}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </Surface>
            <Text
              variant="headlineSmall"
              style={{ fontWeight: 'bold', marginTop: 16 }}
            >
              Tomar+Digital
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant }}
            >
              v1.0.2 (Beta)
            </Text>
          </View>

          <View style={{ padding: 20 }}>
            {/* MISSÃO */}
            <View style={{ marginBottom: 30 }}>
              <Text
                variant="titleLarge"
                style={{
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: theme.colors.primary,
                }}
              >
                A Nossa Missão
              </Text>
              <Text
                variant="bodyMedium"
                style={{ lineHeight: 22, textAlign: 'justify' }}
              >
                A <Text style={{ fontWeight: 'bold' }}>Tomar+Digital</Text>{' '}
                nasceu para renovar o coração da nossa cidade. O nosso objetivo
                é criar uma ponte digital entre o cidadão e o comércio local,
                recompensando a fidelidade e incentivando o crescimento da
                economia local.
              </Text>
            </View>

            <Divider style={{ marginBottom: 30 }} />

            {/* FUNCIONALIDADES / COMO FUNCIONA */}
            <Text
              variant="titleMedium"
              style={{ fontWeight: 'bold', marginBottom: 16 }}
            >
              Como valorizamos a sua compra:
            </Text>

            <View style={{ gap: 16 }}>
              <Card
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16,
                }}
                elevation={0}
              >
                <Card.Title
                  title="Acumule Pontos usando o Contribuinte"
                  subtitle="Leia o QR-Code das suas faturas"
                  left={props => (
                    <Image
                      source={images.qrCodeImg}
                      style={{ width: 30, height: 30 }}
                      tintColor={theme.colors.primary}
                    />
                  )}
                />
              </Card>

              <Card
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16,
                }}
                elevation={0}
              >
                <Card.Title
                  title="Apoie o Comércio Local"
                  subtitle="Descubra lojas aderentes próximas"
                  left={props => (
                    <Image
                      source={images.settingsImg}
                      style={{ width: 30, height: 30 }}
                      tintColor={theme.colors.primary}
                    />
                  )}
                />
              </Card>

              <Card
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16,
                }}
                elevation={0}
              >
                <Card.Title
                  title="Receba Benefícios"
                  subtitle="Troque pontos por descontos ou pacotes"
                  left={props => (
                    <Image
                      source={images.preferencesImg}
                      style={{ width: 30, height: 30 }}
                      tintColor={theme.colors.primary}
                    />
                  )}
                />
              </Card>
            </View>

            {/* SEGURANÇA E PRIVACIDADE */}
            <Surface
              style={{
                marginTop: 40,
                padding: 20,
                borderRadius: 24,
                backgroundColor: theme.colors.primaryContainer,
              }}
              elevation={0}
            >
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: 'bold',
                  marginBottom: 8,
                  color: theme.colors.onPrimaryContainer,
                }}
              >
                Segurança & RGPD
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.onPrimaryContainer,
                  lineHeight: 18,
                }}
              >
                Levamos a sua privacidade a sério. Todos os dados de faturação e
                informações pessoais são encriptados e tratados de acordo com as
                normas europeias de proteção de dados.
              </Text>
            </Surface>

            {/* BOTÕES DE CONTACTO */}
            <View style={{ marginTop: 40, gap: 12 }}>
              <Text
                variant="labelLarge"
                style={{ textAlign: 'center', marginBottom: 8 }}
              >
                Precisa de Ajuda?
              </Text>

              {/* TEMOS DE FAZER EMAIL DE SUPORTE */}
              <CustomButton
                onPress={() =>
                  handleOpenLink('mailto:tomardigitalsuporte@gmail.com')
                }
                icon="email-outline"
              >
                Contactar Suporte
              </CustomButton>

              <CustomButton
                onPress={() =>
                  router.push({
                    pathname: '/components/Termos',
                  })
                }
                buttonColor="transparent"
                textColor={theme.colors.primary}
              >
                Termos de Utilização
              </CustomButton>
            </View>

            {/* CRÉDITOS */}
            <View
              style={{ marginTop: 60, marginBottom: 20, alignItems: 'center' }}
            >
              <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                Desenvolvido em parceria com o
              </Text>
              <Text variant="labelLarge" style={{ fontWeight: 'bold' }}>
                Softinsa + IPT
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
};

export default SobreAPP;
