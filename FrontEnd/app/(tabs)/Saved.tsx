import React, { useState, useCallback } from 'react';
import { Image, FlatList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { API_URL } from '@/constants/api';
import BusinessList from '../components/BusinessList';
import { useAuth } from '@/context/AuthContext';
import { images } from '@/constants/images';
import {
  Surface,
  Text,
  TouchableRipple,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import CustomButton from '../components/CustomButton';
import CustomSnackBar from '../components/CustomSnackBar';
import CustomDialog from '../components/CustomDialog';
import { useAppTheme } from '@/context/ThemeContext';
import { curiosidades } from '@/constants/curiosities';
import { useTranslation } from 'react-i18next';

interface Favorito {
  _id: string;
  userId: string;
  businessId: {
    _id: string;
    name: string;
    category: string;
    location: any;
  } | null;
}

const Saved = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [favoritos, setFavoritos] = useState<Favorito[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogText, setDialogText] = useState('');
  const { currentTheme: theme } = useAppTheme();

  const carregarFavoritos = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/meusFavoritos/${user.id}`);
      const dados = await response.json();

      const listaFinal = Array.isArray(dados) ? dados : dados.favoritos || [];

      setFavoritos(listaFinal);
    } catch (error) {
      setDialogTitle(t('common.error'));
      setDialogText(t('common.error') + '\n' + error);
      setDialogVisible(true);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarFavoritos();
    }, [user?.id]),
  );

  const retirarFavorito = async (businessId: string) => {
    // 1. Atualiza a UI localmente primeiro (Optimistic Update)
    setFavoritos(prev =>
      prev.filter(item => item.businessId?._id !== businessId),
    );

    try {
      const response = await fetch(`${API_URL}/retirarFavorito`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, businessId }),
      });

      if (response.ok) {
        setSnackbarMessage(t('common.success'));
        setSnackbarVisible(true);
        // Não precisas de chamar carregarFavoritos() aqui se o filter correu bem
      } else {
        // Se falhar no servidor, recarregamos para repor o item na lista
        carregarFavoritos();
        setDialogTitle(t('common.error'));
        setDialogText(t('common.error'));
        setDialogVisible(true);
      }
    } catch (error) {
      carregarFavoritos();
    }
  };

  const handleRandomPhrase = () => {
    return curiosidades[Math.floor(Math.random() * curiosidades.length)];
  };
  const [randomPhrase, setRandomPhrase] = useState(handleRandomPhrase());

  if (loading) {
    return (
      <Surface
        className=" items-center justify-center p-6"
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <ActivityIndicator
          size="large"
          color={theme.colors.primary}
          style={{ marginBottom: 20 }}
        />

        <Text
          variant="titleLarge"
          style={{
            fontWeight: 'bold',
            color: theme.colors.primary,
            marginBottom: 10,
          }}
        >
          {t('common.loading')}
        </Text>

        <CustomButton
          labelStyle={{ textAlign: 'center' }}
          onPress={() => setRandomPhrase(handleRandomPhrase())}
          accessibilityLabel={t('accessibility.discover_curiosity')}
          accessibilityHint={t('accessibility.see_curiosity')}
        >
          {t('saved.did_you_know', { phrase: t(randomPhrase) })}
        </CustomButton>
      </Surface>
    );
  }

  return (
    <SafeAreaView
      className="p-4"
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      edges={['top', 'left', 'right']}
    >
      {/* Header Elegante */}
      <Text
        variant="headlineMedium"
        style={{
          color: theme.colors.primary,
          fontWeight: 'bold',
          marginBottom: 10,
        }}
      >
        {t('saved.title')}
      </Text>
      <Divider
        style={{
          backgroundColor: theme.colors.outlineVariant,
          marginBottom: 16,
        }}
      />
      <FlatList
        data={favoritos}
        keyExtractor={(item: any) => item._id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="relative">
            {/* Card do Negócio */}
            <Surface
              elevation={1}
              style={{
                backgroundColor: theme.colors.secondaryContainer,
                borderRadius: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: theme.colors.outlineVariant,
                overflow: 'hidden',
              }}
            >
              <TouchableRipple
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={
                  item.businessId?.name
                    ? t('accessibility.open_details_name', {
                        name: item.businessId.name,
                      })
                    : t('accessibility.open_details_generic')
                }
                accessibilityHint={t('accessibility.open_details')}
                onPress={() => {
                  router.push({
                    pathname: '/components/BusinessDetails',
                    params: { id: item.businessId?._id },
                  });
                }}
                rippleColor="rgba(150, 150, 150, 0.2)"
              >
                <View className="p-1 ">
                  <BusinessList
                    name={
                      item.businessId?.name || t('saved.business_not_available')
                    }
                    category={
                      item.businessId?.category
                        ? t(`categories.${item.businessId.category}` as any, {
                            defaultValue: item.businessId.category,
                          })
                        : 'N/A'
                    }
                    location={item.businessId?.location || ''}
                  />
                </View>
              </TouchableRipple>
              <View className="flex-row gap-x-3 px-4 pb-4">
                <CustomButton
                  className="flex-1"
                  buttonColor={theme.colors.error}
                  accessibilityLabel={
                    item.businessId?.name
                      ? `${t('saved.remove')} ${item.businessId.name}`
                      : t('saved.remove')
                  }
                  accessibilityHint={t('accessibility.remove_favorite')}
                  onPress={() => {
                    if (item.businessId) retirarFavorito(item.businessId._id);
                  }}
                >
                  {t('saved.remove')}
                </CustomButton>
              </View>
            </Surface>

            {/* Botão Remover - Integrado com o Tema de Erro */}
          </View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-10 pb-20">
            <Image
              source={images.favWaiting}
              className="mb-8 h-64 w-64"
              style={{
                tintColor: theme.colors.onSurfaceVariant,
                opacity: 0.6,
              }}
              resizeMode="contain"
            />

            <Text
              variant="headlineSmall"
              style={{ color: theme.colors.onSurface, fontWeight: 'bold' }}
              className="mb-2 text-center"
            >
              {t('common.empty_list')}
            </Text>
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant }}
              className="mb-10 text-center opacity-70"
            >
              {t('saved.empty_message')}
            </Text>

            <CustomButton
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              onPress={() => router.push('/Home')}
              className="h-14 w-full"
              accessibilityLabel={t('saved.discover_businesses')}
              accessibilityHint={t('accessibility.go_home')}
            >
              {t('saved.discover_businesses')}
            </CustomButton>
          </View>
        }
      />

      <CustomSnackBar
        visible={snackbarVisible}
        message={snackbarMessage}
        onDismiss={() => setSnackbarVisible(false)}
      />
      <CustomDialog
        title={dialogTitle}
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
      >
        <Text>{dialogText}</Text>
      </CustomDialog>
    </SafeAreaView>
  );
};

export default Saved;
