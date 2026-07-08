/**
 * CampaignMerchant Screen (Merchant Campaign Hub)
 *
 * Acts as the main hub for users with the 'comerciante' role to access campaign
 * features. Mirrors the structure of CampaignIndex (camara's hub) but exposes
 * the two merchant-specific actions as interactive cards:
 *
 *   1. "Ver Campanhas"   — navigates to CampaignListMerchant, where the merchant
 *                          can browse all active campaigns and BUY PACKS with
 *                          their accumulated points (just like a citizen).
 *
 *   2. "Aderir a Campanhas" — navigates to CampaignMerchantJoin, where the
 *                          merchant can see their participation status on each
 *                          campaign (Participando / Pendente / Rejeitado /
 *                          Não participando) and submit a new join request for
 *                          one of their businesses.
 *
 * IMPORTANT: A comerciante is ALSO able to buy packs. The previous design only
 * showed the participation list, hiding the pack-purchase flow from merchants.
 * This hub corrects that by exposing both flows side-by-side, mirroring the
 * Camara's CampaignIndex layout for visual consistency.
 *
 * The layout follows the same pattern as CampaignIndex.tsx and MunicipalIndex.tsx
 * for consistency across role hubs.
 */

import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Surface, Text, Card, Avatar, Divider } from 'react-native-paper';
import { router } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';

export default function CampaignMerchant() {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();

  // --- Configuration & Memoization ---
  /**
   * Defines the menu items for the merchant campaign hub.
   * Wrapped in useMemo to prevent the array from being recreated on every render.
   * Dependencies are included so the menu updates if the language or theme changes.
   */
  const menus = useMemo(
    () => [
      {
        title: t('merchant.view_campaigns', {
          defaultValue: 'Ver Campanhas',
        }),
        description: t('merchant.view_campaigns_desc', {
          defaultValue: 'Consultar campanhas e comprar pacotes com pontos',
        }),
        icon: 'shopping-outline',
        route: '/components/CampaignListMerchant',
        color: theme.colors.primary,
        // Chip label shown at the bottom of the card
        badge: t('merchant.view', { defaultValue: 'Ver' }),
      },
      {
        title: t('merchant.join_campaigns', {
          defaultValue: 'Aderir a Campanhas',
        }),
        description: t('merchant.join_campaigns_desc', {
          defaultValue: 'Gerir a participação dos seus negócios em campanhas',
        }),
        icon: 'handshake-outline',
        route: '/components/CampaignMerchantJoin',
        color: theme.colors.secondary,
        badge: t('merchant.manage', { defaultValue: 'Gerir' }),
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
          {t('merchant.campaigns_title', {
            defaultValue: 'Campanhas',
          })}
        </Text>
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}
        >
          {t('merchant.campaigns_subtitle', {
            defaultValue: 'Compre pacotes com pontos e participe com o seu negócio',
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
                  {item.badge}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
