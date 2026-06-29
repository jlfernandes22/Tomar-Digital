import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView, Linking } from 'react-native';
import { Text, Divider, Surface } from 'react-native-paper';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

// Contexts & Components
import { useAppTheme } from '@/context/ThemeContext';
import CustomButton from './CustomButton';

/**
 * Terms Screen
 *
 * Displays the legal Terms and Conditions of the application.
 * It is a purely presentational component that renders localized text
 * and provides a deep link to the support email.
 */
const Terms = () => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Handlers ---

  /**
   * Opens the native mail client to send a support email.
   * React Native's Linking API intercepts the 'mailto:' scheme and
   * routes it to the operating system's default email handler.
   */
  const handleOpenEmail = (url: string) => {
    Linking.openURL(url);
  };

  // --- Render ---
  return (
    <Surface style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* 
          Hides the default Expo Router header. 
          This allows the SafeAreaView to control the top inset seamlessly 
          and provides a cleaner full-screen reading experience.
        */}
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header / Title Section */}
          <View
            style={{
              alignItems: 'center',
              paddingVertical: 30,
              paddingHorizontal: 20,
              backgroundColor: theme.colors.secondaryContainer,
            }}
          >
            <Text
              variant="headlineSmall"
              style={{ fontWeight: 'bold', textAlign: 'center' }}
            >
              {t('terms.title_app', { defaultValue: '📱 Tomar+Digital' })}
            </Text>
            <Text
              variant="titleMedium"
              style={{
                marginTop: 8,
                color: theme.colors.onSecondaryContainer,
                textAlign: 'center',
              }}
            >
              {t('terms.terms_conditions', {
                defaultValue: 'Termos e Condições de Utilização',
              })}
            </Text>
          </View>

          {/* Main Content */}
          <View style={{ padding: 20, gap: 24 }}>
            {/* Introduction */}
            <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
              {t('terms.intro', {
                defaultValue:
                  'Estes Termos e Condições (”Termos”) regem o seu uso do Tomar+Digital ("Aplicação"), desenvolvido por Ângela Carolina da Silva Sebastião e José Luís Fernandes ("Desenvolvedores"). Ao baixar, instalar ou usar a Aplicação, concorda em ficar vinculado a estes termos. Se não concordar com estes Termos, não use a Aplicação.',
              })}
            </Text>

            <Divider style={{ backgroundColor: theme.colors.outlineVariant }} />

            {/* Definitions Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.definitions_title', {
                  defaultValue: '📚 Definições',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                •{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {t('terms.user', { defaultValue: '"Utilizador"' })}
                </Text>{' '}
                {t('terms.user_desc', {
                  defaultValue:
                    'refere-se a qualquer pessoa que baixe, instale ou use a Aplicação.',
                })}
                {'\n'}•{' '}
                <Text style={{ fontWeight: 'bold' }}>
                  {t('terms.content', { defaultValue: '"Conteúdo"' })}
                </Text>{' '}
                {t('terms.content_desc', {
                  defaultValue:
                    'refere-se a qualquer texto, imagem, vídeo, áudio ou outra mídia disponível por meio da Aplicação.',
                })}
              </Text>
            </View>

            {/* License Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.license_title', { defaultValue: '🎁 Licença' })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.license_desc', {
                  defaultValue:
                    'Sujeito ao seu cumprimento destes Termos, o Desenvolvedor concede-lhe uma licença limitada, não exclusiva e intransferível para baixar, instalar e usar a Aplicação para fins pessoais e não comerciais.',
                })}
              </Text>
            </View>

            {/* User Conduct Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.user_conduct_title', {
                  defaultValue: '🔐 Conduta do Utilizador',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.agree_not_to', { defaultValue: 'Concorda em não:' })}
              </Text>
              <Surface
                elevation={1}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  backgroundColor: theme.colors.surfaceVariant,
                  gap: 8,
                }}
              >
                <Text variant="bodyMedium">
                  {t('terms.conduct_1', {
                    defaultValue:
                      '• Usar a Aplicação para quaisquer fins ilegais ou fraudulentos.',
                  })}
                </Text>
                <Text variant="bodyMedium">
                  {t('terms.conduct_2', {
                    defaultValue:
                      '• Copiar, modificar, adaptar ou criar obras derivadas da Aplicação ou do seu Conteúdo.',
                  })}
                </Text>
                <Text variant="bodyMedium">
                  {t('terms.conduct_3', {
                    defaultValue:
                      '• Interferir, interromper ou sobrecarregar a Aplicação ou sua infraestrutura subjacente.',
                  })}
                </Text>
                <Text variant="bodyMedium">
                  {t('terms.conduct_4', {
                    defaultValue:
                      '• Tentar obter acesso não autorizado à Aplicação ou a quaisquer sistemas ou redes associados.',
                  })}
                </Text>
              </Surface>
            </View>

            {/* Intellectual Property Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.ip_title', {
                  defaultValue: '💾 Direitos de Propriedade Intelectual',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.ip_desc', {
                  defaultValue:
                    'Todos os direitos, títulos e interesses relativos à Aplicação, incluindo o seu Conteúdo e quaisquer direitos de propriedade intelectual associados, são propriedade exclusiva dos Desenvolvedores e dos seus licenciadores. Não pode reproduzir, distribuir ou criar obras derivadas da Aplicação ou do seu Conteúdo sem a permissão expressa por escrito dos Desenvolvedores.',
                })}
              </Text>
            </View>

            {/* Disclaimer Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.error }}
              >
                {t('terms.disclaimer_title', {
                  defaultValue: '🛡️ Aviso Legal',
                })}
              </Text>
              <Surface
                elevation={0}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.error,
                  backgroundColor: theme.colors.errorContainer,
                }}
              >
                <Text
                  variant="bodyMedium"
                  style={{
                    lineHeight: 22,
                    color: theme.colors.onErrorContainer,
                    fontWeight: '500',
                  }}
                >
                  {t('terms.disclaimer_desc', {
                    defaultValue:
                      'A APLICAÇÃO É FORNECIDA "NO ESTADO EM QUE SE ENCONTRA" E "CONFORME DISPONÍVEL", SEM GARANTIAS DE QUALQUER TIPO, EXPRESSAS OU IMPLÍCITAS, INCLUINDO, MAS NÃO SE LIMITANDO A, GARANTIAS DE COMERCIABILIDADE, ADEQUAÇÃO A UM FIM ESPECÍFICO E NÃO VIOLAÇÃO DE DIREITOS. OS DESENVOLVEDORES NÃO GARANTEM QUE A APLICAÇÃO SERÁ ININTERRUPTA, LIVRE DE ERROS OU COMPLETAMENTE SEGURA.',
                  })}
                </Text>
              </Surface>
            </View>

            {/* Limitation of Liability Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.liability_title', {
                  defaultValue: '⚖️ Limitação de Responsabilidade',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.liability_desc', {
                  defaultValue:
                    'Na máxima extensão permitida pela legislação aplicável, os desenvolvedores não serão responsáveis por quaisquer danos indiretos, incidentais, consequenciais, especiais ou exemplares decorrentes do uso da aplicação ou a ela relacionados, mesmo que tenha sido avisado da possibilidade de tais danos.',
                })}
              </Text>
            </View>

            {/* Governing Law Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.governing_law_title', {
                  defaultValue: '🌐 Lei Aplicável',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.governing_law_desc', {
                  defaultValue:
                    'Estes Termos serão regidos e interpretados de acordo com as leis de Portugal, sem levar em consideração os seus princípios de conflito de leis.',
                })}
              </Text>
            </View>

            {/* Modifications Section */}
            <View style={{ gap: 8 }}>
              <Text
                variant="titleMedium"
                style={{ fontWeight: 'bold', color: theme.colors.primary }}
              >
                {t('terms.modifications_title', {
                  defaultValue: '🔄 Modificações',
                })}
              </Text>
              <Text variant="bodyMedium" style={{ lineHeight: 22 }}>
                {t('terms.modifications_desc', {
                  defaultValue:
                    'Os desenvolvedores reservam-se ao direito de modificar estes Termos a qualquer momento, a seu exclusivo critério. O seu uso continuado da aplicação após qualquer modificação constitui a sua aceitação dos Termos modificados.',
                })}
              </Text>
            </View>

            <Divider
              style={{
                backgroundColor: theme.colors.outlineVariant,
                marginTop: 10,
              }}
            />

            {/* Contact Information Section */}
            <View style={{ marginTop: 10, marginBottom: 30, gap: 12 }}>
              <Text
                variant="titleMedium"
                style={{
                  fontWeight: 'bold',
                  color: theme.colors.primary,
                  textAlign: 'center',
                }}
              >
                {t('terms.contact_info_title', {
                  defaultValue: '📩 Informações de Contato',
                })}
              </Text>
              <Text
                variant="bodyMedium"
                style={{
                  textAlign: 'center',
                  lineHeight: 22,
                  paddingHorizontal: 10,
                }}
              >
                {t('terms.contact_info_desc', {
                  defaultValue:
                    'Caso tenha alguma dúvida ou preocupação sobre estes Termos ou a Aplicação, entre em contato com os Desenvolvedores.',
                })}
              </Text>

              <CustomButton
                onPress={() =>
                  handleOpenEmail('mailto:tomardigitalsuporte@gmail.com')
                }
                icon="email-outline"
              >
                {t('terms.send_support_email', {
                  defaultValue: 'Enviar Email de Suporte',
                })}
              </CustomButton>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Surface>
  );
};

export default Terms;
