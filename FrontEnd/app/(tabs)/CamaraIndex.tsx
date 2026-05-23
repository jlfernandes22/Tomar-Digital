import React from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, Text, useTheme, Card, Avatar, Divider } from "react-native-paper";
import { router } from "expo-router";

export default function CamaraIndex() {
  const theme = useTheme();

  // Configuração dos botões (Escalável: basta adicionar mais objetos aqui)
  const menus = [
    {
      title: "Novos Negócios",
      description: "Aprovar registos de lojas e estabelecimentos",
      icon: "store-search",
      route: "/components/AprovarNegocios", 
      count: "Pendentes",
      color: theme.colors.primary,
    },
    {
      title: "Candidaturas a Comerciante",
      description: "Validar documentos PDF para novos comerciantes",
      icon: "account-check",
      route: "/components/AprovarComerciantes", 
      color: theme.colors.secondary,
    },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView className="p-4">
        <Text variant="headlineMedium" style={{ fontWeight: "bold", color: theme.colors.primary }}>
          Painel de Gestão
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 20 }}>
          Olá, Câmara de Tomar. Escolha uma área para gerir.
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
                left={(props) => <Avatar.Icon {...props} icon={item.icon}  />}
              />
              <Card.Content>
                <Text variant="labelSmall" style={{ color: item.color, fontWeight: "bold" }}>
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