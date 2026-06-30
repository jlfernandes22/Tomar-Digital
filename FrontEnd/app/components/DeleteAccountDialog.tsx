/**
 * DeleteAccountDialog Component
 *
 * A destructive-action confirmation dialog that asks the user to re-enter their
 * password before permanently deleting their account. Designed to be safe by
 * default:
 *
 *   - The password field is required and validated client-side before the request.
 *   - The DELETE /apagarConta call is made with the user's JWT in the Authorization header.
 *   - While the request is in-flight, the dialog shows a loading spinner and disables all buttons.
 *   - On success, a success dialog is shown FIRST. Only when the user dismisses
 *     that success dialog is logout() called — this ensures the user actually
 *     sees the confirmation before being redirected to login.
 *   - On failure, an inline error message is shown and the user can retry.
 *   - The dialog can be dismissed at any time (except during the in-flight request).
 *
 * Usage:
 *   <DeleteAccountDialog
 *     visible={deleteDialogVisible}
 *     onDismiss={() => setDeleteDialogVisible(false)}
 *   />
 */
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Portal, Dialog, Text } from 'react-native-paper';

// Contexts & Hooks
import { useAuth } from '@/context/AuthContext';
import { useAppTheme } from '@/context/ThemeContext';
import { API_URL } from '@/constants/api';

// Components
import CustomButton from './CustomButton';
import CustomTextInput from './CustomTextInput';
import CustomDialog from './CustomDialog';
import delay from '@/utils/delay';

interface DeleteAccountDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const DeleteAccountDialog = ({
  visible,
  onDismiss,
}: DeleteAccountDialogProps) => {
  // --- Hooks ---
  const { t } = useTranslation();
  const { currentTheme: theme } = useAppTheme();
  const { logout, user } = useAuth();

  // --- State ---
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Success dialog state — shown AFTER the account is deleted, BEFORE logout.
  // We delay logout() until the user dismisses this dialog, otherwise the
  // route change unmounts the component and the dialog never renders.
  const [successDialogVisible, setSuccessDialogVisible] = useState(false);

  // Reset the dialog state every time it is opened/closed so the user never
  // sees a stale error or a leftover password from a previous attempt.
  useEffect(() => {
    if (!visible) {
      // Small delay so the close animation doesn't show the fields resetting
      const timer = setTimeout(() => {
        setPassword('');
        setErrorMessage('');
        setLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  // --- Handlers ---

  /**
   * Called when the user dismisses the success dialog.
   * NOW we call logout() — this clears the JWT from SecureStore and
   * redirects to the login screen.
   */
  const handleSuccessDismiss = () => {
    setSuccessDialogVisible(false);
    logout();
  };

  const handleDeleteAccount = async () => {
    // --- Client-side validation ---
    if (!password) {
      setErrorMessage(
        t('profile.delete_account_password_required', {
          defaultValue: 'Introduza a sua palavra-passe para confirmar.',
        }),
      );
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/apagarConta`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ password }),
      });

      // The backend always returns JSON (even on error)
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // Success — the account is gone.
        // Close the password dialog first, then show the success dialog.
        // We do NOT call logout() here — that happens when the user
        // dismisses the success dialog (see handleSuccessDismiss).
        setLoading(false);
        onDismiss();
        await delay(300);
        setSuccessDialogVisible(true);
        return;
      }

      // Map known server errors to user-facing messages. The backend sends
      // messages in Portuguese, but we use i18n keys so the frontend can
      // localize them if the user has English selected.
      if (response.status === 400) {
        // Most likely: wrong password
        setErrorMessage(
          t('profile.delete_account_wrong_password', {
            defaultValue: 'Palavra-passe incorreta. A conta não foi apagada.',
          }),
        );
      } else if (response.status === 404) {
        setErrorMessage(
          t('profile.delete_account_user_not_found', {
            defaultValue: 'Utilizador não encontrado.',
          }),
        );
      } else if (response.status === 429) {
        setErrorMessage(
          t('profile.delete_account_rate_limited', {
            defaultValue:
              'Muitas tentativas. Aguarde um minuto e tente novamente.',
          }),
        );
      } else {
        setErrorMessage(
          data?.message ||
            t('profile.delete_account_error', {
              defaultValue:
                'Ocorreu um erro ao apagar a conta. Tente novamente.',
            }),
        );
      }
    } catch (error) {
      // Network error, server down, etc.
      console.error('[DeleteAccountDialog] Network error:', error);
      setErrorMessage(
        t('common.error_comm_server', {
          defaultValue: 'Não foi possível comunicar com o servidor.',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <>
      <Portal>
        <Dialog
          visible={visible}
          onDismiss={loading ? undefined : onDismiss}
          style={{ backgroundColor: theme.colors.surfaceContainer }}
        >
          {/* Destructive icon */}
          <Dialog.Icon
            icon="alert-circle"
            size={40}
            color={theme.colors.error}
          />

          <Dialog.Title style={{ textAlign: 'center' }}>
            {t('profile.delete_account', { defaultValue: 'Apagar Conta' })}
          </Dialog.Title>

          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{
                color: theme.colors.onSurfaceVariant,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              {t('profile.delete_account_warning', {
                defaultValue:
                  'Esta ação é irreversível. Todos os seus dados (perfil, favoritos, pontos, faturas e negócios) serão permanentemente apagados.',
              })}
            </Text>

            {/* Password confirmation field */}
            <CustomTextInput
              label={t('profile.delete_account_password_label', {
                defaultValue: 'Introduza a sua palavra-passe',
              })}
              value={password}
              onChangeText={text => {
                setPassword(text);
                if (errorMessage) setErrorMessage('');
              }}
              isPassword={true}
              required={true}
              accessibilityLabel={t('accessibility.delete_account_password', {
                defaultValue:
                  'Campo para introduzir a palavra-passe de confirmação',
              })}
              accessibilityHint={t(
                'accessibility.delete_account_password_hint',
                {
                  defaultValue:
                    'Introduza a sua palavra-passe para confirmar a eliminação da conta',
                },
              )}
            />

            {/* Inline error message */}
            {errorMessage ? (
              <Text
                variant="bodySmall"
                style={{
                  color: theme.colors.error,
                  marginTop: 8,
                  textAlign: 'center',
                }}
              >
                {errorMessage}
              </Text>
            ) : null}
          </Dialog.Content>

          <Dialog.Actions
            style={{ gap: 10, paddingHorizontal: 16, paddingBottom: 26 }}
          >
            {/* Cancel button — disabled while loading */}
            <CustomButton
              onPress={onDismiss}
              disabled={loading}
              buttonColor={theme.colors.surfaceVariant}
              textColor={theme.colors.onSurfaceVariant}
              accessibilityLabel={t('accessibility.cancel_delete_account', {
                defaultValue: 'Cancelar e fechar',
              })}
            >
              {t('common.cancel', { defaultValue: 'Cancelar' })}
            </CustomButton>

            {/* Confirm (destructive) button */}
            <CustomButton
              onPress={handleDeleteAccount}
              disabled={loading || !password}
              loading={loading}
              buttonColor={theme.colors.error}
              textColor={theme.colors.onError}
              className="flex-1"
              accessibilityLabel={t('accessibility.confirm_delete_account', {
                defaultValue: 'Apagar definitivamente a minha conta',
              })}
              accessibilityHint={t(
                'accessibility.confirm_delete_account_hint',
                {
                  defaultValue:
                    'Esta ação é irreversível. Todos os seus dados serão apagados.',
                },
              )}
            >
              {loading
                ? t('common.deleting', { defaultValue: 'A apagar...' })
                : t('profile.delete_account_confirm_btn', {
                    defaultValue: 'Apagar Conta',
                  })}
            </CustomButton>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/*
        Success dialog — rendered SEPARATELY from the password dialog (its own
        Portal) so it can appear after the first dialog is dismissed.
        logout() is called only when the user dismisses this dialog, ensuring
        they see the confirmation before being redirected to login.
      */}
      <CustomDialog
        visible={successDialogVisible}
        title={t('common.success_alert', { defaultValue: 'Sucesso' })}
        onDismiss={handleSuccessDismiss}
        onPress={handleSuccessDismiss}
        buttonText={t('common.ok', { defaultValue: 'OK' })}
        buttonColor={theme.colors.primary}
        textColor={theme.colors.onPrimary}
      >
        <Text>
          {t('profile.delete_account_success', {
            defaultValue:
              'A sua conta foi apagada com sucesso. Será redirecionado para o ecrã de login.',
          })}
        </Text>
      </CustomDialog>
    </>
  );
};

export default DeleteAccountDialog;
