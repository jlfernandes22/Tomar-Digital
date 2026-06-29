/**
 * MunicipalIndex Screen (City Council Dashboard)
 *
 * Acts as the main hub for users with the 'camara' role. It displays a list of
 * management areas (pending businesses, merchant applications, campaign applications)
 * as interactive cards that navigate to their respective approval screens.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function CamaraIndex() {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Configuration & Memoization ---
  /**
   * Defines the menu items for the dashboard.
   * Wrapped in useMemo to prevent the array from being recreated on every render,
   * which helps avoid unnecessary re-renders of the mapped Card components.
   * Dependencies are included so the menu updates if the language or theme changes.
   */
  const menus = useMemo(
    () => [
      {
        title: t('camara.new_businesses', { defaultValue: 'Novos Negócios' }),
        description: t('camara.new_businesses_desc', {
          defaultValue: 'Aprovar registos de lojas e estabelecimentos',
        }),
        icon: 'store-search',
        route: '/components/BusinessCandidates',
        count: t('camara.pending', { defaultValue: 'Pendentes' }),
        color: theme.colors.primary,
      },
      {
        title: t('camara.merchant_applications', {
          defaultValue: 'Candidaturas a Comerciante',
        }),
        description: t('camara.merchant_applications_desc', {
          defaultValue: 'Validar documentos PDF para novos comerciantes',
        }),
        icon: 'account-check',
        route: '/components/MerchantsCandidates',
        count: t('camara.pending', { defaultValue: 'Pendentes' }),
        color: theme.colors.secondary,
      },
      {
        title: t('camara.campaign_applications', {
          defaultValue: 'Candidaturas a Campanhas',
        }),
        description: t('camara.campaign_applications_desc', {
          defaultValue: 'Aprovar negócios a participar em campanhas',
        }),
        icon: 'store-search',
        route: '/components/CampaignCandidates',
        count: t('camara.pending', { defaultValue: 'Pendentes' }),
        color: theme.colors.secondary,
      },
    ],
    [t, theme],
  );

  // --- Render ---

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView className="p-4">
        {/* Header Section */}
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
          {t('camara.welcome_msg', {
            defaultValue: 'Olá, Câmara de Tomar. Escolha uma área para gerir.',
          })}
        </Text>

        <Divider style={{ marginBottom: 20 }} />

        {/* Menu Cards */}
        <View className="gap-y-4">
          {menus.map(item => (
            <Card
              key={item.route} // Using route as a stable key is better than array index
              onPress={() => router.push(item.route as any)}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
              // Accessibility props help screen reader users understand the action
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              accessibilityHint={item.description}
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
