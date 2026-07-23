import mongoose from "mongoose";

// ============================================================================
// Redemption Model (Pack Purchases / Voucher Wallet)
// ============================================================================
// Regista cada compra de um pacote efetuada por um cidadão.
//
// Ciclo de vida de uma redenção:
//   "ativo"    → O cidadão comprou o pacote e ainda não o levantou na Câmara.
//   "entregue" → Um funcionário da Câmara validou o código de levantamento.
//   "expirado" → O prazo de levantamento (campaign.DataExpiracao + 7 dias) passou.
//
// Notas de design:
//   - O campo `pack` é um SNAPSHOT (cópia) da descrição e custo do pacote no
//     momento da compra. Isto garante que, se a Câmara editar a campanha depois,
//     o histórico do cidadão mantém a informação original.
//   - O `pickupCode` é um código aleatório fixo (ex.: "TD-2026-A3F8K2") que o
//     cidadão apresenta presencialmente na Câmara para levantar o prémio.
//   - A expiração é feita de forma lazy (sem cron job): os endpoints
//     /packs/minhas-compras e /packs/validar marcam vouchers expirados antes
//     de retornar dados.
// ============================================================================

const RedemptionSchema = new mongoose.Schema(
  {
    // --- Quem comprou (o cidadão) ---
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // --- De que campanha o pacote foi comprado ---
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },

    // --- Snapshot do pacote no momento da compra ---
    // Cópia imutável para imunizar o histórico a edições futuras da campanha.
    pack: {
      packId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
      },
      rewardDescription: {
        type: String,
        required: true,
      },
      pointsCost: {
        type: Number,
        required: true,
      },
    },

    // --- Código único de levantamento ---
    // Código aleatório fixo que o cidadão apresenta na Câmara Municipal.
    // Formato: "TD-YYYY-XXXXXXXX" (8 caracteres hex maiúsculos).
    // Único e indexado para lookup rápido durante a validação.
    pickupCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // --- Estado do voucher ---
    // "ativo"    → pronto para levantar
    // "entregue" → já levantado na Câmara
    // "expirado" → prazo de levantamento ultrapassado
    status: {
      type: String,
      enum: ["ativo", "entregue", "expirado"],
      default: "ativo",
      index: true,
    },

    // --- Quando o cidadão comprou o pacote (gerou o voucher) ---
    redeemedAt: {
      type: Date,
      default: Date.now,
    },

    // --- Quando o funcionário da Câmara validou o código (entregou o prémio) ---
    validatedAt: {
      type: Date,
      default: null,
    },

    // --- Que funcionário da Câmara validou a entrega ---
    // Importante para auditoria — regista exatamente quem processou a entrega.
    validatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // --- Data de expiração do voucher ---
    // = campaign.DataExpiracao + 7 dias de tolerância para levantamento.
    // Dá ao cidadão uma semana após o fim da campanha para ir à Câmara.
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Índice composto para verificar o limite maxPerUser:
// Conta quantas vezes este utilizador comprou este pacote específico
// nesta campanha (apenas vouchers ativos ou entregues contam — expirados não).
RedemptionSchema.index({ user: 1, campaign: 1, "pack.packId": 1 });

export default mongoose.models.Redemption ||
  mongoose.model("Redemption", RedemptionSchema);
