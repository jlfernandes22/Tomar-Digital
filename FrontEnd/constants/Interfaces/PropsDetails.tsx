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
  /**
   * Optional flag to control whether the merchant "join campaign" flow
   * (the multi-step business selection + confirmation) is shown inside
   * the modal.
   *
   * - `true` (default): the join flow is shown for comerciantes. Use this
   *   when the modal is opened from the "Aderir a Campanhas" screen.
   * - `false`: the join flow is HIDDEN even for comerciantes. Use this
   *   when the modal is opened from the "Ver Campanhas" screen, where
   *   the merchant is acting as a customer (browsing + buying packs)
   *   and shouldn't be prompted to candidate a business.
   *
   * The pack-purchase section (visible to cidadao + comerciante) is NOT
   * affected by this flag — it is controlled by `canBuyPacks` instead.
   */
  showJoinFlow?: boolean;
}
