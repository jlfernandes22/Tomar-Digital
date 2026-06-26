import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View, FlatList, RefreshControl, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '@/constants/api';
import { useAuth } from '@/context/AuthContext';
import { router, Stack } from 'expo-router';
// Substituímos os componentes antigos pelos do Paper para suportar Dark Mode
import {
  ActivityIndicator,
  TouchableRipple,
  Surface,
  Text,
  Divider,
  Appbar,
  Dialog,
  Portal,
} from 'react-native-paper';
import CustomButton from './CustomButton';
import CustomDialog from './CustomDialog';
import BusinessList from './BusinessList';
import { useAppTheme } from '@/context/ThemeContext';
import { useLoadingState } from '@/context/LoadingContext';
import LoadingScreen from './LoadingScreen';

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

export default function AprovarNegocios() {
  const { t } = useTranslation();
  const [pendentes, setPendentes] = useState<Business[]>([]);
  const [pendOwners, setPendOwners] = useState<Owner[]>([]);
  const { loadingQR, setLoadingQR } = useLoadingState();
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');

  const [discardDialogVisible, setDiscardDialogVisible] = useState(false);
  const [discardId, setDiscardId] = useState<string | null>(null);

  const onRefresh = async () => {
    setRefreshing(true);

    try {
      await carregarDados();
    } catch (err) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load_info'));
      setDialogVisible(true);
    } finally {
      setRefreshing(false);
    }
  };

  const { currentTheme: theme } = useAppTheme();

  const carregarDados = useCallback(async () => {
    // Se não há token, paramos o loading para não ficar preso
    if (!user?.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [resPendentes, resOwners] = await Promise.all([
        fetch(`${API_URL}/business/pendentes`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }),
        fetch(`${API_URL}/utilizador/negocioPendentes`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
        }),
      ]);

      if (resPendentes.ok) setPendentes(await resPendentes.json());
      if (resOwners.ok) setPendOwners(await resOwners.json());
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.error_load'));
      setDialogVisible(true);
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
        method: 'POST',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPendentes(prev => prev.filter(item => item._id !== id));
      } else {
        setDialogTitle(t('common.error'));
        setDialogText(t('camara.server_reject_approve'));
        setDialogVisible(true);
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.fail_approve'));
      setDialogVisible(true);
    }
  };

  const handleDescartar = (id: string) => {
    setDiscardId(id);
    setDiscardDialogVisible(true);
  };

  const executeDescartar = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/business/rejeitar/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user?.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setPendentes(prev => prev.filter(item => item._id !== id));
      }
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('camara.fail_discard'));
      setDialogVisible(true);
    }
  };

  useEffect(() => {
    setLoadingQR(loading);
  }, [loading]);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
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
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
        edges={['left', 'right']}
        className="p-4"
      >
        <Text
          variant="headlineMedium"
          style={{
            color: theme.colors.primary,
            fontWeight: 'bold',
            marginBottom: 10,
          }}
        >
          {t('camara.businesses_title')}
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
            className="mt-10 text-center"
          >
            {t('camara.no_new_businesses')}
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
            keyExtractor={item => item._id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const donoEspecifico = pendOwners.find(
                dono => dono._id === item.owner,
              );

              //console.log(item);
              return (
                <Surface
                  style={{
                    borderRadius: 12,
                    marginBottom: 16,
                    borderWidth: 1,
                    borderColor: theme.colors.outlineVariant,
                    overflow: 'hidden',
                    backgroundColor: theme.colors.secondaryContainer,
                  }}
                  elevation={1}
                >
                  <TouchableRipple
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={t('accessibility.open_details_name', {
                      name: item.name,
                      defaultValue: `Ver detalhes de ${item.name}`,
                    })}
                    accessibilityHint={t('accessibility.open_details')}
                    onPress={() => {
                      router.push({
                        pathname: '/components/BusinessDetails',
                        params: { id: item._id },
                      });
                    }}
                    rippleColor="rgba(150, 150, 150, 0.2)"
                  >
                    <View className="p-1 ">
                      <BusinessList
                        name={item.name}
                        category={item.category}
                        ownerName={
                          donoEspecifico?.name ||
                          t('common.loading_short', {
                            defaultValue: 'A carregar...',
                          })
                        }
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
                      accessibilityLabel={t(
                        'accessibility.accept_business_name',
                        {
                          name: item.name,
                          defaultValue: `Aceitar negócio ${item.name}`,
                        },
                      )}
                      accessibilityHint={t('accessibility.approve_business')}
                    >
                      {t('common.accept', { defaultValue: 'Aceitar' })}
                    </CustomButton>

                    {/* Botão DESCARTAR */}
                    <CustomButton
                      className="flex-1"
                      onPress={() => handleDescartar(item._id)}
                      buttonColor={theme.colors.errorContainer}
                      textColor={theme.colors.onErrorContainer}
                      accessibilityLabel={t(
                        'accessibility.discard_business_name',
                        {
                          name: item.name,
                          defaultValue: `Descartar negócio ${item.name}`,
                        },
                      )}
                      accessibilityHint={t('accessibility.reject_business')}
                    >
                      {t('common.discard', { defaultValue: 'Descartar' })}
                    </CustomButton>
                  </View>
                </Surface>
              );
            }}
          />
        )}
      </SafeAreaView>

      <Portal>
        <Dialog
          visible={discardDialogVisible}
          onDismiss={() => setDiscardDialogVisible(false)}
          style={{ backgroundColor: theme.colors.surface }}
        >
          <Dialog.Title>{t('common.confirm')}</Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurface }}>
              {t('camara.reject_confirm_biz', {
                defaultValue:
                  'Tens a certeza que queres descartar este pedido?',
              })}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <CustomButton
              onPress={() => setDiscardDialogVisible(false)}
              buttonColor={theme.colors.surfaceVariant}
              textColor={theme.colors.onSurface}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </CustomButton>
            <CustomButton
              onPress={async () => {
                setDiscardDialogVisible(false);
                if (discardId) {
                  await executeDescartar(discardId);
                  setDiscardId(null);
                }
              }}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
            >
              {t('common.discard', { defaultValue: 'Descartar' })}
            </CustomButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <CustomDialog
        title={dialogTitle}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>
    </>
  );
}
