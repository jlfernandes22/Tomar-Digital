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
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator animating={true} size="large" color="#FF6600" />
      </Surface>
    );
  }

  return (
    <Surface style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }} className="p-4">
        <Text
          variant="headlineMedium"
          style={{ color: theme.colors.secondary }}
        >
          Pedidos Pendentes
        </Text>

        <Divider className="mb-2w" />

        {pendentes.length === 0 ? (
          <Text variant="bodyLarge" className="text-center mt-10 opacity-60">
            Não há novos pedidos de Tomar.
          </Text>
        ) : (
          <FlatList
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            data={pendentes}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const donoEspecifico = pendOwners.find(
                (dono) => dono._id === item.owner,
              );

              return (
                <View className="relative mt-4">
                  <Surface
                    className="border border-convento-200"
                    elevation={1}
                    style={{ borderRadius: 12 }}
                  >
                    <TouchableRipple
                      onPress={() => {
                        router.push({
                          pathname: "/components/BusinessDetails",
                          params: { id: item._id },
                        });
                      }}
                      className="p-4"
                    >
                      <View>
                        <Text variant="titleLarge" className="font-bold">
                          {item.name}
                        </Text>
                        <Text
                          variant="bodyMedium"
                          className="italic opacity-80"
                        >
                          {item.category}
                        </Text>
                        <Text variant="bodySmall" className="mt-1 opacity-50">
                          Dono: {donoEspecifico?.name || "A carregar..."}
                        </Text>
                      </View>
                    </TouchableRipple>

                    <View className="flex-row gap-x-3 px-4 pb-4 mt-2">
                      <CustomButton
                        className="flex-1"
                        onPress={() => handleAprovar(item._id)}
                        buttonColor="#10B981"
                      >
                        Aceitar
                      </CustomButton>

                      <CustomButton
                        className="flex-1"
                        onPress={() => handleDescartar(item._id)}
                        buttonColor="#EF4444"
                      >
                        Descartar
                      </CustomButton>
                    </View>
                  </Surface>
                </View>
              );
            }}
          />
        )}
      </SafeAreaView>
    </Surface>
  );
}
