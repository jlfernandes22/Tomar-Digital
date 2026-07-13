/**
 * CampaignIndex Screen (Camara Campaign Hub)
 *
 * Acts as the main hub for Camara staff to manage campaigns. It displays
 * two options as interactive cards:
 *   1. "Ver Campanhas" — navigates to a list of all campaigns (CampaignList)
 *   2. "Criar Campanha" — navigates to the campaign creation wizard (CampaignCreate)
 *
 * This replaces the old direct tab to CampaignCreate, giving the Camara a
 * central place to both view existing campaigns and create new ones.
 *
 * The layout follows the same pattern as MunicipalIndex.tsx for consistency.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function CampaignIndex() {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Configuration & Memoization ---
  /**
   * Defines the menu items for the campaign hub.
   * Wrapped in useMemo to prevent the array from being recreated on every render.
   * Dependencies are included so the menu updates if the language or theme changes.
   */
  const menus = useMemo(
    () => [
      {
        title: t('camara.view_campaigns', {
          defaultValue: 'Ver Campanhas',
        }),
        description: t('camara.view_campaigns_desc', {
          defaultValue: 'Consultar todas as campanhas existentes',
        }),
        icon: 'format-list-bulleted',
        route: '/components/CampaignList',
        color: theme.colors.primary,
      },
      {
        title: t('camara.create_campaign', {
          defaultValue: 'Criar Campanha',
        }),
        description: t('camara.create_campaign_desc', {
          defaultValue: 'Criar uma nova campanha com pacotes e prémios',
        }),
        icon: 'plus-circle-outline',
        route: '/components/CampaignCreate',
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
          {t('camara.campaigns_title', {
            defaultValue: 'Campanhas',
          })}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
        >
          {t('camara.campaigns_subtitle', {
            defaultValue: 'Gestão de campanhas e prémios',
          })}
        </Text>

        <Divider style={{ marginBottom: 20 }} />

        {/* Menu Cards */}
        <View className="gap-y-4">
          {menus.map(item => (
            <Card
              key={item.route}
              onPress={() => router.push(item.route as any)}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
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
                  {item.route.includes('Create')
                    ? t('camara.new', { defaultValue: 'Nova' })
                    : t('camara.view', { defaultValue: 'Ver' })}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
