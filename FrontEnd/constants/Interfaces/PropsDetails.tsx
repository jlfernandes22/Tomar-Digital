export default interface DetalhesProps {
  visible: boolean;
  campaign: any;
  onClose: () => void;
  /**
   * Optional callback to show a SUCCESS snackbar in the parent component.
   *
   * Used ONLY for success messages (e.g. "Candidatura enviada com sucesso!").
   * Success messages are short-lived and non-blocking, so a snackbar is ideal.
   *
   * The snackbar lives in the parent (not the modal) so it persists after
   * the modal closes and renders above the modal overlay.
   */
  onSnackbar?: (message: string) => void;
  /**
   * Optional callback to show an ERROR/WARNING dialog in the parent component.
   *
   * Used for errors and warnings (e.g. "Pontos insuficientes", "Pacote esgotado",
   * "Erro de conexão"). Errors require user acknowledgement, so a dialog is
   * more appropriate than a snackbar.
   *
   * The dialog lives in the parent (not the modal) so it renders above the
   * modal overlay and persists if the modal closes.
   */
  onError?: (title: string, message: string) => void;
  /**
   * Optional callback fired after a successful pack purchase.
   * The parent can use this to refresh its campaign list so the stock
   * counts stay in sync.
   */
  onPurchaseSuccess?: () => void;
}
