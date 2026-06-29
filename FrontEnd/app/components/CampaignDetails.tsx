/**
 * CampaignDetails Modal Component
 *
 * A multi-step modal wizard for merchants to join a specific campaign.
 * Step 1: Fetches and displays the user's businesses that match the campaign's CAE codes.
 * Step 2: Confirmation step to submit the join request to the backend.
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Modal, ScrollView } from 'react-native';
import { Surface, Text, IconButton, Divider } from 'react-native-paper';

// Contexts & Hooks
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLoadingState } from '@/context/LoadingContext';
import { API_URL } from '@/constants/api';

// Components & Types
import CustomButton from './CustomButton';
import LoadingScreen from './LoadingScreen';
import DetalhesProps from '@/constants/Interfaces/PropsDetails';

const DetalhesCampanha = ({ visible, campaign, onClose }: DetalhesProps) => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user } = useAuth();
  const { setLoadingQR } = useLoadingState(); // Setter used to sync loading state with the global FAB

  // --- Local State ---
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meusNegocios, setMeusNegocios] = useState<any[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<string | null>(
    null,
  );

  // --- Handlers ---

  /** Submits the request to join the selected campaign with the chosen business. */
  const handleAderir = async () => {
    if (!negocioSelecionado || !campaign) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/campanhas/aderir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          businessId: negocioSelecionado,
          campaignId: campaign._id,
        }),
      });

      // Read as text first to safely handle potential non-JSON error responses from the server
      const textoResposta = await response.text();

      if (response.ok) {
        alert(t('common.success_alert', { defaultValue: 'Sucesso!' }));
        onClose();
      } else {
        alert(textoResposta);
      }
    } catch (error) {
      console.log('Erro capturado no Catch:', error);
      alert(t('common.error_connection', { defaultValue: 'Erro de conexão!' }));
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  /**
   * Fetches the user's businesses that match the campaign's CAE codes.
   * Runs whenever the modal becomes visible or the campaign changes.
   */
  useEffect(() => {
    const carregarNegocios = async () => {
      // Guard clause: ensure we have a campaign and it has CAE codes
      if (!visible || !campaign?.listaCAES) return;

      // Handle CAE being either an array or a single string
      const caeParaBuscar = Array.isArray(campaign.listaCAES)
        ? campaign.listaCAES[0]
        : campaign.listaCAES;

      try {
        const response = await fetch(
          `${API_URL}/negociosCae?cae=${caeParaBuscar}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          },
        );

        if (response.ok) {
          const data = await response.json();
          setMeusNegocios(data);
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    carregarNegocios();
  }, [visible, user?.token, campaign]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the submission is processing.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // --- Early Returns ---
  // Placed AFTER all hooks (useState, useEffect) to respect React's Rules of Hooks.
  if (!campaign) return null;

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Render ---
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <Surface
          style={{
            width: '100%',
            maxHeight: '100%',
            borderRadius: 24,
            padding: 20,
          }}
        >
          {/* Modal Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text variant="titleLarge" style={{ color: theme.colors.primary }}>
              {t('campaign.details', { defaultValue: 'Detalhes' })}
            </Text>
            <IconButton
              icon="close"
              size={24}
              onPress={onClose}
              accessible={true}
              accessibilityLabel={t('accessibility.close_window', {
                defaultValue: 'Fechar janela',
              })}
            />
          </View>

          <Divider style={{ marginVertical: 10 }} />

          <ScrollView style={{ flexGrow: 0 }}>
            {/* Step 1: Select Business */}
            {passo === 1 ? (
              <View>
                <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                  {t('campaign.select_business_step1', {
                    defaultValue: '1. Selecione o negócio:',
                  })}
                </Text>

                {meusNegocios.map(negocio => (
                  <View key={negocio._id} style={{ marginBottom: 12 }}>
                    <CustomButton
                      onPress={() => setNegocioSelecionado(negocio._id)}
                      textColor={
                        negocioSelecionado === negocio._id
                          ? '#FFF'
                          : theme.colors.onSurface
                      }
                      accessibilityLabel={t('accessibility.select_name', {
                        name: negocio.name,
                        defaultValue: `Selecionar ${negocio.name}`,
                      })}
                      accessibilityHint={t(
                        'accessibility.select_business_campaign',
                        {
                          defaultValue:
                            'Clica para selecionar este negócio para a campanha',
                        },
                      )}
                    >
                      {negocio.name}
                    </CustomButton>
                  </View>
                ))}

                <CustomButton
                  style={{
                    backgroundColor: theme.colors.onBackground,
                    marginTop: 10,
                  }}
                  onPress={() =>
                    negocioSelecionado
                      ? setPasso(2)
                      : alert(
                          t('campaign.select_business_alert', {
                            defaultValue: 'Selecione um negócio!',
                          }),
                        )
                  }
                  accessibilityLabel={t('accessibility.continue_confirmation', {
                    defaultValue: 'Continuar para a confirmação',
                  })}
                >
                  {t('common.continue', { defaultValue: 'Continuar' })}
                </CustomButton>
              </View>
            ) : (
              /* Step 2: Confirm Joining */
              <View style={{ alignItems: 'center', padding: 20 }}>
                <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                  {t('campaign.confirm_join_campaign', {
                    title: campaign.titulo,
                    defaultValue: `Confirma a adesão à campanha "${campaign.titulo}"?`,
                  })}
                </Text>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <CustomButton
                    onPress={() => setPasso(1)}
                    accessibilityLabel={t('addBusiness.prev_step', {
                      defaultValue: 'Voltar ao passo anterior',
                    })}
                  >
                    {t('common.back', { defaultValue: 'Voltar' })}
                  </CustomButton>

                  <CustomButton
                    style={{ backgroundColor: theme.colors.onBackground }}
                    onPress={handleAderir}
                    loading={loading}
                    disabled={loading}
                    accessibilityLabel={t('accessibility.confirm_join', {
                      defaultValue: 'Confirmar adesão à campanha',
                    })}
                  >
                    {loading
                      ? t('common.sending', { defaultValue: 'A enviar...' })
                      : t('common.confirm_btn', { defaultValue: 'Confirmar' })}
                  </CustomButton>
                </View>
              </View>
            )}
          </ScrollView>
        </Surface>
      </View>
    </Modal>
  );
};

export default DetalhesCampanha;
