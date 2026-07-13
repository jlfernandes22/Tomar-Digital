import mongoose from "mongoose";

const InvoiceSchema = new mongoose.Schema(
  {
    // Quem leu a fatura?
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // De que loja é a fatura?
    business: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: true,
    },

    // O Código Único da Fatura (Campo H do QR Code)
    ATCUD: {
      type: String,
      required: true,
    },

    // A Assinatura Digital (Campo Q do QR Code)
    hash: {
      type: String,
      required: true,
    },

    // Valor total para efeitos de histórico
    amount: {
      type: Number,
      required: true,
    },

    // Data da compra original (Campo F)
    purchaseDate: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Guarda a data exata em que o QR Code foi lido na app
  },
);

// Criamos um index único para garantir que o MongoDB bloqueia logo faturas repetidas
InvoiceSchema.index({ ATCUD: 1, hash: 1 }, { unique: true });

export default mongoose.model("Invoice", InvoiceSchema);
