import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Linking } from 'react-native';
import { Text, Card, Divider, Surface, Appbar } from 'react-native-paper';
import { useAppTheme } from '@/context/ThemeContext';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomButton from './CustomButton'; // Seu componente
import { images } from '@/constants/images'; // Ajuste conforme seu caminho

const SobreAPP = () => {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

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
      <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
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
                  {t('about.our_mission', { defaultValue: 'A Nossa Missão' })}
                </Text>
                <Text
                  variant="bodyMedium"
                  style={{ lineHeight: 22, textAlign: 'justify' }}
                >
                  {t('about.mission_desc', {
                    defaultValue:
                      'A Tomar+Digital nasceu para renovar o coração da nossa cidade. O nosso objetivo é criar uma ponte digital entre o cidadão e o comércio local, recompensando a fidelidade e incentivando o crescimento da economia local.',
                  })}
                </Text>
              </View>

              <Divider style={{ marginBottom: 30 }} />

              {/* FUNCIONALIDADES / COMO FUNCIONA */}
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', marginBottom: 16 }}
              >
                {t('about.how_we_value', {
                  defaultValue: 'Como valorizamos a sua compra:',
                })}
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
                    title={t('about.feature_1_title', {
                      defaultValue: 'Acumule Pontos usando o Contribuinte',
                    })}
                    subtitle={t('about.feature_1_desc', {
                      defaultValue: 'Leia o QR-Code das suas faturas',
                    })}
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
                    title={t('about.feature_2_title', {
                      defaultValue: 'Apoie o Comércio Local',
                    })}
                    subtitle={t('about.feature_2_desc', {
                      defaultValue: 'Descubra lojas aderentes próximas',
                    })}
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
                    title={t('about.feature_3_title', {
                      defaultValue: 'Receba Benefícios',
                    })}
                    subtitle={t('about.feature_3_desc', {
                      defaultValue: 'Troque pontos por descontos ou pacotes',
                    })}
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
                  {t('about.security_gdpr', {
                    defaultValue: 'Segurança & RGPD',
                  })}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: theme.colors.onPrimaryContainer,
                    lineHeight: 18,
                  }}
                >
                  {t('about.security_desc', {
                    defaultValue:
                      'Levamos a sua privacidade a sério. Todos os dados de faturação e informações pessoais são encriptados e tratados de acordo com as normas europeias de proteção de dados.',
                  })}
                </Text>
              </Surface>

              {/* BOTÕES DE CONTACTO */}
              <View style={{ marginTop: 40, gap: 12 }}>
                <Text
                  variant="labelLarge"
                  style={{ textAlign: 'center', marginBottom: 8 }}
                >
                  {t('about.need_help', { defaultValue: 'Precisa de Ajuda?' })}
                </Text>

                {/* TEMOS DE FAZER EMAIL DE SUPORTE */}
                <CustomButton
                  onPress={() =>
                    handleOpenLink('mailto:tomardigitalsuporte@gmail.com')
                  }
                  icon="email-outline"
                >
                  {t('about.contact_support', {
                    defaultValue: 'Contactar Suporte',
                  })}
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
                  {t('about.terms_of_use', {
                    defaultValue: 'Termos de Utilização',
                  })}
                </CustomButton>
              </View>

              {/* CRÉDITOS */}
              <View
                style={{
                  marginTop: 60,
                  marginBottom: 20,
                  alignItems: 'center',
                }}
              >
                <Text
                  variant="bodySmall"
                  style={{ color: theme.colors.outline }}
                >
                  {t('about.developed_by', {
                    defaultValue: 'Desenvolvido em parceria com o',
                  })}
                </Text>
                <Text variant="labelLarge" style={{ fontWeight: 'bold' }}>
                  Softinsa + IPT
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Surface>
    </>
  );
};

export default SobreAPP;
