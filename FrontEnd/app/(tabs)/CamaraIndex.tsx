import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Alert,
  RefreshControl,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_URL } from "@/constants/api";
import { useAuth } from "@/context/AuthContext";
import { router } from "expo-router";
// Substituímos os componentes antigos pelos do Paper para suportar Dark Mode
import {
  ActivityIndicator,
  TouchableRipple,
  Surface,
  Text,
  useTheme,
  Divider,
} from "react-native-paper";
import CustomButton from "../components/CustomButton";
import BusinessList from "../components/BusinessList";

// 1. Interfaces MOVIDAS PARA FORA do componente
interface Business {
  _id: string;
  name: string;
  category: string;
  owner: string;
  status: string;
}

interface Owner {
  _id: string;
  name: string;
  email: string;
}

export default function CamaraIndex() {
  const [pendentes, setPendentes] = useState<Business[]>([]);
  const [pendOwners, setPendOwners] = useState<Owner[]>([]);
  // Começamos o loading a true
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await carregarDados();
    } catch (err) {
      Alert.alert("erro", "erro ao carregar informação");
    } finally {
      setRefreshing(false);
    }
  };

  const theme = useTheme();

  // 2. FUNÇÃO UNIFICADA: Carrega tudo ao mesmo tempo e gere o loading perfeitamente
  const carregarDados = useCallback(async () => {
    // Se não há token, paramos o loading para não ficar preso
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // O Promise.all faz as duas chamadas ao servidor em simultâneo (mais rápido e seguro)
      const [resPendentes, resOwners] = await Promise.all([
        fetch(`${API_URL}/business/pendentes`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${API_URL}/utilizador/negocioPendentes`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (resPendentes.ok) setPendentes(await resPendentes.json());
      if (resOwners.ok) setPendOwners(await resOwners.json());
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const handleAprovar = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/business/aprovar/${id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user?.token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setPendentes((prev) => prev.filter((item) => item._id !== id));
      } else {
        Alert.alert("Erro", "O servidor recusou a aprovação.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao aprovar.");
    }
  };

  const handleDescartar = async (id: string) => {
    Alert.alert(
      "Confirmar",
      "Tens a certeza que queres descartar este pedido?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Descartar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_URL}/business/rejeitar/${id}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${user?.token}`,
                    "Content-Type": "application/json",
                  },
                },
              );

              if (response.ok) {
                setPendentes((prev) => prev.filter((item) => item._id !== id));
              }
            } catch (error) {
              Alert.alert("Erro", "Falha ao descartar.");
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <Surface
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: theme.colors.surface,
        }}
      >
        <ActivityIndicator
          animating={true}
          size="large"
          color={theme.colors.primary}
        />
      </Surface>
    );
  }
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={["top", "left", "right"]}
      className="p-4"
    >
      <Text
        variant="headlineMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: "bold",
          marginBottom: 10,
        }}
      >
        Pedidos Pendentes
      </Text>

      <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />

      {pendentes.length === 0 ? (
        <Text
          variant="bodyLarge"
          style={{ color: theme.colors.onSurfaceVariant }}
          className="text-center mt-10"
        >
          Não há novos pedidos de Tomar.
        </Text>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.colors.primary]} // Android
              tintColor={theme.colors.primary} // iOS
            />
          }
          data={pendentes}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const donoEspecifico = pendOwners.find(
              (dono) => dono._id === item.owner,
            );

            return (
              <Surface
                style={{
                  borderRadius: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.outlineVariant,
                  overflow: "hidden",
                  backgroundColor: theme.colors.secondaryContainer,
                }}
                elevation={1}
              >
                <TouchableRipple
                  onPress={() => {
                    router.push({
                      pathname: "/components/DetalhesBusiness",
                      params: { id: item._id },
                    });
                  }}
                  rippleColor="rgba(150, 150, 150, 0.2)"
                >
                  <View className="p-1 ">
                    <BusinessList
                      name={item.name}
                      category={item.category}
                      ownerName={donoEspecifico?.name || "A carregar..."}
                    />
                  </View>
                </TouchableRipple>

                <View className="flex-row gap-x-3 px-4 pb-4">
                  {/* Botão ACEITAR */}
                  <CustomButton
                    className="flex-1"
                    onPress={() => handleAprovar(item._id)}
                    textColor={theme.colors.onPrimary}
                    buttonColor={theme.colors.primary}
                  >
                    Aceitar
                  </CustomButton>

                  {/* Botão DESCARTAR */}
                  <CustomButton
                    className="flex-1"
                    onPress={() => handleDescartar(item._id)}
                    buttonColor={theme.colors.errorContainer}
                    textColor={theme.colors.onErrorContainer}
                  >
                    Descartar
                  </CustomButton>
                </View>
              </Surface>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
