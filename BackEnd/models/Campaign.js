import mongoose, { Schema } from "mongoose";
import PackSchema from "./Packs.js";

const CampaignSchema = new mongoose.Schema({
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  titulo: { type: String, required: true },

  slogan: { type: String },

  descricao: { type: String, required: true },
  
  estado: {
    type: String,
    enum: ["rascunho", "ativa", "em pausa", "expirada"],
    default: "rascunho",
  },

  packs: [PackSchema],

  DataInicio: { 
    type: Date, 
    default: Date.now 
  },

  DataExpiracao: {
    type: Date,
    required: true,
  },

  //Data de inicio da campanha para verificar se a fatura é válida

  //logo e flysheet teram de ser required no futuro

  logo: {
    type: String,
    default: "",
  },

  panfleto: { type: String, default: "" },
  
  normas: { type: String }, 
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente

const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
export default Campaign;
