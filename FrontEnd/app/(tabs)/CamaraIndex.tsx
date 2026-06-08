import React from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function CamaraIndex() {
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // Configuração dos botões (Escalável: basta adicionar mais objetos aqui)
  const menus = [
    {
      title: t('camara.new_businesses', { defaultValue: 'Novos Negócios' }),
      description: t('camara.new_businesses_desc', { defaultValue: 'Aprovar registos de lojas e estabelecimentos' }),
      icon: 'store-search',
      route: '/components/AprovarNegocios',
      count: t('camara.pending', { defaultValue: 'Pendentes' }),
      color: theme.colors.primary,
    },
    {
      title: t('camara.merchant_applications', { defaultValue: 'Candidaturas a Comerciante' }),
      description: t('camara.merchant_applications_desc', { defaultValue: 'Validar documentos PDF para novos comerciantes' }),
      icon: 'account-check',
      route: '/components/AprovarComerciantes',
      count: t('camara.pending', { defaultValue: 'Pendentes' }),

      color: theme.colors.secondary,
    },

     {
      title: t('camara.campaign_applications', { defaultValue: "Candidaturas a Campanhas" }),
      description: t('camara.campaign_applications_desc', { defaultValue: "Aprovar negócios a participar em campanhas" }),
      icon: "store-search",
      route: "/components/CandidaturasCampanha", 
            count: t('camara.pending', { defaultValue: "Pendentes" }),

      color: theme.colors.secondary,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView className="p-4">
        <Text
          variant="headlineMedium"
          style={{ fontWeight: 'bold', color: theme.colors.primary }}
        >
          {t('camara.management_panel', { defaultValue: 'Painel de Gestão' })}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
        >
          {t('camara.welcome_msg', { defaultValue: 'Olá, Câmara de Tomar. Escolha uma área para gerir.' })}
        </Text>

        <Divider style={{ marginBottom: 20 }} />

        <View className="gap-y-4">
          {menus.map((item, index) => (
            <Card
              key={index}
              onPress={() => router.push(item.route as any)}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
            >
              <Card.Title
                title={item.title}
                subtitle={item.description}
                left={props => <Avatar.Icon {...props} icon={item.icon} />}
              />
              <Card.Content>
                <Text
                  variant="labelSmall"
                  style={{ color: item.color, fontWeight: 'bold' }}
                >
                  {item.count}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
