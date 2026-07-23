/**
 * CampaignDetails Modal Component
 *
 * A multi-purpose modal that displays campaign details and adapts its behavior
 * based on the user's role:
 *
 *   - Cidadão:   Sees the list of available packs with a "Comprar" button.
 *                On purchase, calls POST /packs/comprar, which deducts points
 *                and generates a pickup code. A success dialog shows the code.
 *
 *   - Comerciante: Sees the list of packs (read-only, so they know what rewards
 *                their customers can get) AND retains the existing multi-step
 *                flow to apply one of their businesses to the campaign.
 *
 *   - Camara:    Read-only view (camara creates campaigns, doesn't buy packs).
 *
 * The component respects the app's theme system (useAppTheme), uses the custom
 * feedback components (CustomDialog, CustomSnackBar), and is fully commented
 * to match the codebase's documentation standards.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Modal, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, IconButton, Divider, Chip } from 'react-native-paper';
import { router } from 'expo-router';

// Contexts & Hooks
import { useAppTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useLoadingState } from '@/context/LoadingContext';

// Components & Types
import CustomButton from './CustomButton';
import CustomDialog from './CustomDialog';
import LoadingScreen from './LoadingScreen';
import DetalhesProps from '@/constants/Interfaces/PropsDetails';

import { useApiFetch } from '@/utils/apiFetch';
const DetalhesCampanha = ({
  visible,
  campaign,
  onClose,
  onSnackbar,
  onError,
  onPurchaseSuccess,
  showJoinFlow = true,
}: DetalhesProps) => {
  // --- Hooks (Context & Global State) ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { user, updateUser } = useAuth();
  const { setLoadingQR } = useLoadingState();
  const apiFetch = useApiFetch(); // Setter used to sync loading state with the global FAB

  // --- Role Flags ---
  // Determine which UI flows to show based on the user's role.
  const isCidadao = user?.role === 'cidadao';
  const isComerciante = user?.role === 'comerciante';
  // Both citizens AND merchants can buy packs (the backend /packs/comprar
  // accepts cidadao, comerciante and camara roles). Only Camara staff see
  // packs as read-only (they create campaigns, they don't buy from them).
  const canBuyPacks = isCidadao || isComerciante;

  // --- Local State ---
  // Merchant flow state (existing)
  const [passo, setPasso] = useState(1);
  const [loading, setLoading] = useState(false);
  const [meusNegocios, setMeusNegocios] = useState<any[]>([]);
  const [negocioSelecionado, setNegocioSelecionado] = useState<string | null>(
    null,
  );

  // Citizen purchase state (new)
  const [purchasingPackId, setPurchasingPackId] = useState<string | null>(null);
  // NOTE: The snackbar is NOT rendered here — it lives in the parent.
  // We call onSnackbar() to propagate messages up. See PropsDetails.

  // Local copy of the campaign — we keep this in state so we can update
  // the pack's currentStock immediately after a purchase, without waiting
  // for the parent to refetch. The prop `campaign` is immutable; this local
  // copy is the one we render.
  const [localCampaign, setLocalCampaign] = useState(campaign);

  // Sync localCampaign whenever the prop changes (e.g. parent refetches
  // after onPurchaseSuccess, or the user opens a different campaign).
  useEffect(() => {
    setLocalCampaign(campaign);
  }, [campaign]);

  // Use localCampaign for rendering; fall back to the prop as safety net.
  const renderedCampaign = localCampaign || campaign;

  // Purchase success dialog state
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);
  const [successData, setSuccessData] = useState<{
    pickupCode: string;
    rewardDescription: string;
    pointsRemaining: number;
  } | null>(null);

  // Participating businesses state (for citizens to see where they can earn points)
  const [participatingBusinesses, setParticipatingBusinesses] = useState<any[]>(
    [],
  );
  const [showBusinesses, setShowBusinesses] = useState(false);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);
  // Tracks whether the API has been called at least once (even if result was empty)
  const [businessesLoaded, setBusinessesLoaded] = useState(false);
  // Guard ref to prevent double-tap navigation to BusinessDetails.
  // Refs don't trigger re-renders, so this is ideal for a mutation flag.
  const isNavigatingRef = useRef(false);

  // Local error dialog state — rendered INSIDE the modal (not via Portal)
  // so it appears above the modal overlay. Paper's Portal renders below
  // React Native's Modal, so a Portal-based CustomDialog would be hidden.
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const [errorDialogTitle, setErrorDialogTitle] = useState('');
  const [errorDialogText, setErrorDialogText] = useState('');

  /** Shows an error dialog inside the modal. */
  const showLocalError = (title: string, message: string) => {
    setErrorDialogTitle(title);
    setErrorDialogText(message);
    setErrorDialogVisible(true);
  };

  // --- Handlers ---

  /**
   * Citizen: Purchases a pack from the current campaign.
   * Calls POST /packs/comprar with the campaignId and packId.
   * On success, updates the user's point balance in AuthContext and shows
   * a success dialog with the generated pickup code.
   */
  const handleComprarPack = async (packId: string) => {
    if (!renderedCampaign) return;

    setPurchasingPackId(packId);
    try {
      const response = await apiFetch(`/packs/comprar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          campaignId: renderedCampaign._id,
          packId: packId,
        }),
      });

      // --- Safely parse the response as JSON ---
      // If the server returns HTML (e.g. a 404 page from a misconfigured
      // server or a production URL that doesn't have the /packs routes yet),
      // response.json() would throw a SyntaxError. We read as text first,
      // then try to parse, so we can show a helpful error message.
      const responseText = await response.text();
      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          '[CampaignDetails] Resposta não-JSON do servidor (provável HTML 404).',
          'Status:',
          response.status,
          'Primeiros 100 chars:',
          responseText.substring(0, 100),
        );
        if (showLocalError) {
          showLocalError(
            t('common.error_alert', { defaultValue: 'Erro' }),
            t('packs.server_not_available', {
              defaultValue:
                'Não foi possível contactar o servidor. Verifique se o backend está a correr e se a rota /packs/comprar existe.',
            }),
          );
        }
        return;
      }

      if (response.ok) {
        // Update the user's point balance in global state immediately
        updateUser({ Points: data.pointsRemaining });

        // --- Update local stock immediately (optimistic UI) ---
        // Decrement the purchased pack's currentStock in the local copy
        // so the user sees the updated stock right away.
        setLocalCampaign(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            packs: prev.packs.map((p: any) =>
              p._id === packId
                ? { ...p, currentStock: Math.max(0, p.currentStock - 1) }
                : p,
            ),
          };
        });

        // Notify the parent so it can refetch its campaign list too.
        if (onPurchaseSuccess) {
          onPurchaseSuccess();
        }

        // NOTE: The success snackbar is NOT shown here — it's triggered when
        // the success dialog is dismissed (see the success dialog onDismiss).
        // This is because the snackbar lives in the parent (via Portal), and
        // Portal renders BELOW React Native's Modal. If we call onSnackbar
        // while the modal is open, the snackbar would be hidden behind it.
        // By delaying until the dialog is dismissed, the modal starts closing
        // and the snackbar appears on top.

        // Store the success data and show the pickup code dialog
        setSuccessData({
          pickupCode: data.pickupCode,
          rewardDescription: data.rewardDescription,
          pointsRemaining: data.pointsRemaining,
        });
        setSuccessDialogVisible(true);
      } else {
        // Show the error message from the backend via local dialog (inside modal).
        showLocalError(
          t('common.error_alert', { defaultValue: 'Erro' }),
          data.message || t('packs.purchase_error'),
        );
      }
    } catch (error) {
      console.error('[CampaignDetails] Erro ao comprar pacote:', error);
      showLocalError(
        t('common.error_alert', { defaultValue: 'Erro' }),
        t('common.error_comm_server', {
          defaultValue: 'Não foi possível comunicar com o servidor.',
        }),
      );
    } finally {
      setPurchasingPackId(null);
    }
  };

  /**
   * Merchant: Submits the request to join the selected campaign with the chosen business.
   * This is the existing flow — unchanged.
   */
  const handleAderir = async () => {
    if (!negocioSelecionado || !campaign) return;

    setLoading(true);
    try {
      const response = await apiFetch(`/campanhas/aderir`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: negocioSelecionado,
          campaignId: renderedCampaign._id,
        }),
      });

      // Read as text first to safely handle potential non-JSON error responses
      const textoResposta = await response.text();

      if (response.ok) {
        // Success — snackbar (short-lived, non-blocking).
        // IMPORTANT: Call onSnackbar AFTER onClose() so the modal starts
        // closing first. The snackbar lives in the parent and will render
        // above the modal as it animates away.
        onClose();
        if (onSnackbar) {
          onSnackbar(t('common.success_alert', { defaultValue: 'Sucesso!' }));
        }
      } else {
        // Error — local dialog (inside modal, above overlay)
        showLocalError(
          t('common.error_alert', { defaultValue: 'Erro' }),
          textoResposta,
        );
      }
    } catch (error) {
      console.log('Erro capturado no Catch:', error);
      showLocalError(
        t('common.error_alert', { defaultValue: 'Erro' }),
        t('common.error_connection', { defaultValue: 'Erro de conexão!' }),
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  /**
   * Merchant flow: Fetches the user's businesses that match the campaign's CAE codes.
   * Runs whenever the modal becomes visible or the campaign changes.
   * Only executes for merchants — citizens skip this entirely.
   */
  useEffect(() => {
    const carregarNegocios = async () => {
      // Guard clause: only merchants need to load businesses, AND only when
      // the join flow is enabled (i.e. the modal was opened from "Aderir a
      // Campanhas"). When opened from "Ver Campanhas", showJoinFlow is false
      // and we skip the fetch entirely to avoid an unnecessary API call.
      if (!isComerciante || !showJoinFlow || !visible || !campaign?.listaCAES)
        return;

      // Handle CAE being either an array or a single string
      const caeParaBuscar = Array.isArray(renderedCampaign.listaCAES)
        ? renderedCampaign.listaCAES[0]
        : renderedCampaign.listaCAES;

      try {
        const response = await apiFetch(`/negociosCae?cae=${caeParaBuscar}`);

        if (response.ok) {
          const data = await response.json();
          setMeusNegocios(data);
        }
      } catch (error) {
        console.error('Erro:', error);
      }
    };

    carregarNegocios();
  }, [visible, user?.token, campaign, isComerciante, showJoinFlow]);

  /**
   * Syncs local loading state with the global LoadingContext.
   * This ensures the global QrCodeFAB hides while the submission is processing.
   * Must be declared before any early returns to respect React's Rules of Hooks.
   */
  useEffect(() => {
    setLoadingQR(loading);
  }, [loading, setLoadingQR]);

  // Reset the merchant flow step whenever the modal is reopened
  useEffect(() => {
    if (visible) {
      setPasso(1);
      setNegocioSelecionado(null);
    }
  }, [visible]);

  /**
   * Fetches the approved businesses participating in this campaign.
   * Called when the user taps "Ver negócios participantes".
   * Uses the endpoint GET /packs/campanha/:id/negocios.
   *
   * Cache behaviour:
   *   - If already loaded, just toggle visibility (no API call).
   *   - If empty (never loaded or error), fetches from the API.
   *
   * The button is disabled while loading to prevent multiple requests.
   */
  const fetchParticipatingBusinesses = async () => {
    if (!renderedCampaign) return;

    // If already loaded (even if empty), toggle visibility without calling the API
    // The `businessesLoaded` flag tracks whether we've fetched at least once
    if (businessesLoaded) {
      setShowBusinesses(!showBusinesses);
      return;
    }

    // First load — fetch from API
    setLoadingBusinesses(true);
    try {
      const response = await apiFetch(
        `/packs/campanha/${renderedCampaign._id}/negocios`,
      );
      if (response.ok) {
        const data = await response.json();
        setParticipatingBusinesses(data);
        setShowBusinesses(true);
        setBusinessesLoaded(true); // Mark as loaded even if empty
      }
    } catch (error) {
      console.error('[CampaignDetails] Erro ao buscar negócios:', error);
      showLocalError(
        t('common.error_alert', { defaultValue: 'Erro' }),
        t('packs.error_loading_businesses', {
          defaultValue: 'Erro ao carregar negócios participantes.',
        }),
      );
    } finally {
      setLoadingBusinesses(false);
    }
  };

  // --- Early Returns ---
  // Placed AFTER all hooks (useState, useEffect) to respect React's Rules of Hooks.
  if (!renderedCampaign) return null;

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Derived Values ---
  // Determine if the campaign has packs to display
  const temPacks = renderedCampaign.packs && renderedCampaign.packs.length > 0;

  // --- Render ---
  return (
    <>
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
              <Text
                variant="titleLarge"
                style={{ color: theme.colors.primary }}
              >
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
              {/* Campaign Title & Description — visible to all roles */}
              <Text
                variant="headlineSmall"
                style={{ marginBottom: 6, color: theme.colors.primary }}
              >
                {renderedCampaign.titulo}
              </Text>
              {renderedCampaign.slogan ? (
                <Text
                  variant="bodyMedium"
                  style={{
                    marginBottom: 8,
                    fontStyle: 'italic',
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {renderedCampaign.slogan}
                </Text>
              ) : null}
              <Text variant="bodyMedium" style={{ marginBottom: 16 }}>
                {renderedCampaign.descricao}
              </Text>

              {/* --- Packs Section --- */}
              {/* Visible to all roles. Citizens see a "Comprar" button; others see read-only. */}
              {temPacks ? (
                <View style={{ marginBottom: 16 }}>
                  <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                    {t('packs.available_packs', {
                      defaultValue: 'Pacotes disponíveis',
                    })}
                  </Text>

                  {renderedCampaign.packs.map((pack: any) => {
                    // Determine if the current user (citizen OR merchant) can buy this pack
                    const insufficientPoints =
                      canBuyPacks && user.Points < pack.pointsCost;
                    const outOfStock = pack.currentStock <= 0;
                    const isThisPackLoading = purchasingPackId === pack._id;

                    return (
                      <View
                        key={pack._id}
                        style={{
                          marginBottom: 12,
                          padding: 14,
                          borderRadius: theme.roundness,
                          borderWidth: 1,
                          borderColor: theme.colors.outlineVariant,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                      >
                        {/* Pack description and cost */}
                        <Text
                          variant="titleSmall"
                          style={{ fontWeight: 'bold' }}
                        >
                          {pack.rewardDescription}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 12,
                            marginTop: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip compact textStyle={{ fontSize: 12 }}>
                            {t('packs.cost', { defaultValue: 'Custo' })}:{' '}
                            {pack.pointsCost}{' '}
                            {t('packs.points', { defaultValue: 'pts' })}
                          </Chip>
                          <Chip compact textStyle={{ fontSize: 12 }}>
                            {t('packs.stock', { defaultValue: 'Stock' })}:{' '}
                            {pack.currentStock}/{pack.stock}
                          </Chip>
                          {pack.maxPerUser > 1 && (
                            <Chip compact textStyle={{ fontSize: 12 }}>
                              {t('packs.max_per_user', {
                                defaultValue: 'Máx./utilizador',
                              })}
                              : {pack.maxPerUser}
                            </Chip>
                          )}
                        </View>

                        {/* Citizen / Comerciante: Purchase button */}
                        {canBuyPacks && (
                          <View style={{ marginTop: 10 }}>
                            <CustomButton
                              onPress={() => handleComprarPack(pack._id)}
                              disabled={
                                insufficientPoints ||
                                outOfStock ||
                                isThisPackLoading
                              }
                              loading={isThisPackLoading}
                              buttonColor={theme.colors.primary}
                              textColor={theme.colors.onPrimary}
                              accessibilityLabel={t('accessibility.buy_pack', {
                                defaultValue: `Comprar pacote ${pack.rewardDescription}`,
                              })}
                              accessibilityHint={t(
                                'accessibility.buy_pack_hint',
                                {
                                  defaultValue:
                                    'Gasta pontos para comprar este pacote e recebe um código de levantamento',
                                },
                              )}
                            >
                              {isThisPackLoading
                                ? t('common.processing', {
                                    defaultValue: 'A processar...',
                                  })
                                : insufficientPoints
                                  ? t('packs.insufficient_points', {
                                      defaultValue: 'Pontos insuficientes',
                                    })
                                  : outOfStock
                                    ? t('packs.out_of_stock', {
                                        defaultValue: 'Esgotado',
                                      })
                                    : t('packs.buy_button', {
                                        defaultValue: 'Comprar',
                                      })}
                            </CustomButton>
                          </View>
                        )}

                        {/* Camara (read-only): note that only citizens/merchants can buy */}
                        {!canBuyPacks && (
                          <Text
                            variant="labelSmall"
                            style={{
                              marginTop: 8,
                              color: theme.colors.onSurfaceVariant,
                            }}
                          >
                            {t('packs.citizen_can_buy', {
                              defaultValue: 'Disponível para cidadãos',
                            })}
                          </Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              ) : (
                <Text
                  variant="bodyMedium"
                  style={{
                    marginBottom: 16,
                    color: theme.colors.onSurfaceVariant,
                  }}
                >
                  {t('packs.no_packs', {
                    defaultValue: 'Esta campanha não tem pacotes disponíveis.',
                  })}
                </Text>
              )}

              {/* --- Participating Businesses Section --- */}
              {/* Visible to all roles. Lets citizens see where they can spend
                  money to earn points (businesses that joined this campaign). */}
              <Divider style={{ marginVertical: 10 }} />

              <View style={{ marginBottom: 16 }}>
                <CustomButton
                  onPress={fetchParticipatingBusinesses}
                  disabled={loadingBusinesses}
                  loading={loadingBusinesses}
                  accessibilityLabel={t(
                    'accessibility.view_participating_businesses',
                    {
                      defaultValue: 'Ver negócios participantes nesta campanha',
                    },
                  )}
                >
                  {loadingBusinesses
                    ? t('common.loading', { defaultValue: 'A carregar...' })
                    : showBusinesses
                      ? t('packs.hide_businesses', {
                          defaultValue: 'Ocultar negócios participantes',
                        })
                      : t('packs.view_businesses', {
                          defaultValue: 'Ver negócios participantes',
                        })}
                </CustomButton>

                {showBusinesses && (
                  <View style={{ marginTop: 8 }}>
                    {participatingBusinesses.length > 0 ? (
                      participatingBusinesses.map((biz: any) => (
                        <TouchableOpacity
                          key={biz._id}
                          onPress={() => {
                            // Guard against double-tap: if already navigating,
                            // ignore the press. The ref is reset when the
                            // component re-mounts (next time the modal opens).
                            if (isNavigatingRef.current) return;
                            isNavigatingRef.current = true;

                            // Close this modal first, then navigate to BusinessDetails.
                            // We pass the business data as a param to avoid a refetch.
                            onClose();
                            router.push({
                              pathname: '/components/BusinessDetails',
                              params: {
                                id: biz._id,
                                dadosNegocio: JSON.stringify(biz),
                              },
                            });
                          }}
                          accessible={true}
                          accessibilityRole="button"
                          accessibilityLabel={t(
                            'accessibility.view_business_details',
                            {
                              name: biz.name,
                              defaultValue: `Ver detalhes de ${biz.name}`,
                            },
                          )}
                          accessibilityHint={t(
                            'accessibility.view_business_details_hint',
                            {
                              defaultValue:
                                'Clica para ver os detalhes deste negócio',
                            },
                          )}
                          style={{
                            marginBottom: 8,
                            padding: 10,
                            borderRadius: theme.roundness,
                            borderWidth: 1,
                            borderColor: theme.colors.outlineVariant,
                            backgroundColor: theme.colors.surface,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <Text
                                variant="titleSmall"
                                style={{ fontWeight: 'bold' }}
                              >
                                {biz.name}
                              </Text>
                              <Text
                                variant="bodySmall"
                                style={{ color: theme.colors.onSurfaceVariant }}
                              >
                                {biz.category}
                              </Text>
                              {biz.address ? (
                                <Text
                                  variant="labelSmall"
                                  style={{
                                    color: theme.colors.onSurfaceVariant,
                                    marginTop: 2,
                                  }}
                                >
                                  {biz.address}
                                </Text>
                              ) : null}
                            </View>
                            <IconButton
                              icon="chevron-right"
                              size={20}
                              iconColor={theme.colors.onSurfaceVariant}
                            />
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text
                        variant="bodySmall"
                        style={{
                          color: theme.colors.onSurfaceVariant,
                          textAlign: 'center',
                          marginTop: 8,
                        }}
                      >
                        {t('packs.no_participating_businesses', {
                          defaultValue:
                            'Ainda não há negócios participantes nesta campanha.',
                        })}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* --- Merchant Flow: Business join (only for comerciantes AND only
                   when the modal was opened from the "Aderir a Campanhas" screen) ---
                   When the merchant opens the modal from "Ver Campanhas" (where they
                   act as a customer buying packs), showJoinFlow is false and this
                   entire section is hidden so the merchant isn't prompted to
                   candidate a business. */}
              {isComerciante && showJoinFlow && (
                <>
                  <Divider style={{ marginVertical: 10 }} />

                  {passo === 1 ? (
                    <View>
                      <Text variant="titleMedium" style={{ marginBottom: 10 }}>
                        {t('campaign.select_business_step1', {
                          defaultValue: '1. Selecione o negócio:',
                        })}
                      </Text>

                      {meusNegocios.map(negocio => {
                        // Track whether THIS specific business is the one currently
                        // selected. We use this to swap the button colors so the
                        // selection state is visually obvious.
                        const isSelected = negocioSelecionado === negocio._id;

                        return (
                          <View key={negocio._id} style={{ marginBottom: 12 }}>
                            <CustomButton
                              onPress={() => setNegocioSelecionado(negocio._id)}
                              // When NOT selected: use Paper's secondaryContainer
                              //   (background) + onSecondaryContainer (text) so the
                              //   button blends with the modal surface like a
                              //   standard Paper button.
                              // When selected: use Paper's primary (background) +
                              //   onPrimary (text) so the selection stands out.
                              buttonColor={
                                isSelected
                                  ? theme.colors.primary
                                  : theme.colors.secondaryContainer
                              }
                              textColor={
                                isSelected
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSecondaryContainer
                              }
                              accessibilityLabel={t(
                                'accessibility.select_name',
                                {
                                  name: negocio.name,
                                  defaultValue: `Selecionar ${negocio.name}`,
                                },
                              )}
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
                        );
                      })}

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
                        accessibilityLabel={t(
                          'accessibility.continue_confirmation',
                          {
                            defaultValue: 'Continuar para a confirmação',
                          },
                        )}
                      >
                        {t('common.continue', { defaultValue: 'Continuar' })}
                      </CustomButton>
                    </View>
                  ) : (
                    /* Step 2: Confirm Joining */
                    <View style={{ alignItems: 'center', padding: 20 }}>
                      <Text style={{ textAlign: 'center', marginBottom: 20 }}>
                        {t('campaign.confirm_join_campaign', {
                          title: renderedCampaign.titulo,
                          defaultValue: `Confirma a adesão à campanha "${renderedCampaign.titulo}"?`,
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
                            ? t('common.sending', {
                                defaultValue: 'A enviar...',
                              })
                            : t('common.confirm_btn', {
                                defaultValue: 'Confirmar',
                              })}
                        </CustomButton>
                      </View>
                    </View>
                  )}
                </>
              )}
            </ScrollView>

            {/*
              Local Error Dialog — rendered INSIDE the modal using the
              `inModal` prop on CustomDialog. This prop skips the <Portal>
              wrapper, because Paper's Portal renders at the root level
              (below React Native's Modal in the view hierarchy) and would
              be invisible to the user. See CustomDialog.tsx for details.
            */}
            <CustomDialog
              inModal
              visible={errorDialogVisible}
              title={errorDialogTitle}
              onDismiss={() => setErrorDialogVisible(false)}
              onPress={() => setErrorDialogVisible(false)}
              buttonText={t('common.ok', { defaultValue: 'OK' })}
              accessibilityLabel={t('accessibility.close_message', {
                defaultValue: 'Fechar mensagem',
              })}
            >
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant }}
              >
                {errorDialogText}
              </Text>
            </CustomDialog>

            {/*
              Purchase Success Dialog — shows the pickup code after a
              successful purchase. Also rendered with `inModal` so it
              appears on top of the modal content (not hidden behind it).
            */}
            <CustomDialog
              inModal
              visible={successDialogVisible}
              title={t('packs.purchase_success_title', {
                defaultValue: 'Compra efetuada!',
              })}
              onDismiss={() => {
                setSuccessDialogVisible(false);
                setSuccessData(null);
                // No snackbar — the success dialog itself confirms the
                // purchase. Showing a snackbar after closing the campaign
                // details modal would be redundant and confusing.
              }}
              onPress={() => {
                setSuccessDialogVisible(false);
                setSuccessData(null);
                // Same — no snackbar. The dialog already showed the
                // pickup code and success message.
              }}
              buttonText={t('common.ok', { defaultValue: 'OK' })}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.onPrimary}
              icon="check-circle"
            >
              {successData ? (
                <View>
                  <Text
                    variant="bodyMedium"
                    style={{ marginBottom: 12, textAlign: 'center' }}
                  >
                    {successData.rewardDescription}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      textAlign: 'center',
                      color: theme.colors.onSurfaceVariant,
                      marginBottom: 4,
                    }}
                  >
                    {t('packs.your_pickup_code', {
                      defaultValue: 'O seu código de levantamento',
                    })}
                  </Text>
                  <Text
                    variant="headlineMedium"
                    style={{
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: theme.colors.primary,
                      marginBottom: 12,
                      fontFamily: 'monospace',
                    }}
                  >
                    {successData.pickupCode}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{
                      textAlign: 'center',
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {t('packs.present_at_camara', {
                      defaultValue:
                        'Apresente este código na Câmara Municipal para levantar o seu prémio.',
                    })}
                  </Text>
                  <Text
                    variant="labelSmall"
                    style={{
                      textAlign: 'center',
                      marginTop: 8,
                      color: theme.colors.onSurfaceVariant,
                    }}
                  >
                    {t('packs.points_remaining', {
                      defaultValue: 'Pontos restantes',
                    })}
                    : {successData.pointsRemaining}
                  </Text>
                </View>
              ) : null}
            </CustomDialog>
          </Surface>
        </View>
      </Modal>

      {/*
        NOTE: The snackbar is NOT rendered here.
        It lives in the parent component (CampaignJoin) and is triggered
        via the onSnackbar callback. This ensures the snackbar:
          1. Renders above the modal overlay (not behind it).
          2. Persists after the modal closes.
      */}
    </>
  );
};

export default DetalhesCampanha;
