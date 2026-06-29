/**
 * AppAbout Screen
 *
 * Displays static information about the application, including its mission,
 * core features, privacy/GDPR notices, and contact options.
 * It serves as a central place for users to understand the app's value proposition.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Image, Linking } from 'react-native';
import { Text, Card, Divider, Surface, Appbar } from 'react-native-paper';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Contexts & Constants
import { useAppTheme } from '@/context/ThemeContext';
import { images } from '@/constants/images';

// Components
import CustomButton from './CustomButton';

const AppAbout = () => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Configuration & Memoization ---
  /**
   * Defines the feature cards shown in the "How it works" section.
   * Wrapped in useMemo to prevent the array from being recreated on every render,
   * which helps avoid unnecessary re-renders of the mapped Card components.
   */
  const features = useMemo(
    () => [
      {
        title: t('about.feature_1_title', {
          defaultValue: 'Acumule Pontos usando o Contribuinte',
        }),
        desc: t('about.feature_1_desc', {
          defaultValue: 'Leia o QR-Code das suas faturas',
        }),
        icon: images.qrCodeImg,
      },
      {
        title: t('about.feature_2_title', {
          defaultValue: 'Apoie o Comércio Local',
        }),
        desc: t('about.feature_2_desc', {
          defaultValue: 'Descubra lojas aderentes próximas',
        }),
        icon: images.settingsImg,
      },
      {
        title: t('about.feature_3_title', {
          defaultValue: 'Receba Benefícios',
        }),
        desc: t('about.feature_3_desc', {
          defaultValue: 'Troque pontos por descontos ou pacotes',
        }),
        icon: images.preferencesImg,
      },
    ],
    [t],
  );

  // --- Handlers ---

  /**
   * Opens an external URL using the device's native handler.
   * For 'mailto:' links, this opens the default mail client.
   * For 'http:' links, this opens the default web browser.
   */
  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  // --- Render ---
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
        {/* Hides the default Expo Router header to use our custom Appbar instead */}
        <Stack.Screen options={{ headerShown: false }} />

        <SafeAreaView style={{ flex: 1 }} edges={['left', 'right']}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header / Logo Section */}
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
              {/* Mission Section */}
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

              {/* Features Section */}
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', marginBottom: 16 }}
              >
                {t('about.how_we_value', {
                  defaultValue: 'Como valorizamos a sua compra:',
                })}
              </Text>

              <View style={{ gap: 16 }}>
                {features.map((feature, index) => (
                  <Card
                    key={index}
                    style={{
                      backgroundColor: theme.colors.surfaceVariant,
                      borderRadius: 16,
                    }}
                    elevation={0}
                  >
                    <Card.Title
                      title={feature.title}
                      subtitle={feature.desc}
                      left={props => (
                        <Image
                          source={feature.icon}
                          style={{ width: 30, height: 30 }}
                          tintColor={theme.colors.primary}
                        />
                      )}
                    />
                  </Card>
                ))}
              </View>

              {/* Security & Privacy Section */}
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

              {/* Contact & Support Section */}
              <View style={{ marginTop: 40, gap: 12 }}>
                <Text
                  variant="labelLarge"
                  style={{ textAlign: 'center', marginBottom: 8 }}
                >
                  {t('about.need_help', { defaultValue: 'Precisa de Ajuda?' })}
                </Text>

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
                  onPress={() => router.push({ pathname: '/components/Terms' })}
                  buttonColor="transparent"
                  textColor={theme.colors.primary}
                >
                  {t('about.terms_of_use', {
                    defaultValue: 'Termos de Utilização',
                  })}
                </CustomButton>
              </View>

              {/* Credits Section */}
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

export default AppAbout;
