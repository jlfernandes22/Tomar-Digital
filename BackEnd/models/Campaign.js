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

  listaCAES: {type: [String], required: true},

  packs: [PackSchema],

  DataInicio: { 
    type: Date, 
    default: Date.now 
  },

  DataExpiracao: {
    type: Date,
    required: true,
  },


  logo: {
    type: String,
    default: "",
  },

  panfleto: { type: String, default: "" },
  
  normas: { type: String }, 
}, { timestamps: true }); // Adiciona createdAt e updatedAt automaticamente


CampaignSchema.pre('save', function(next) {
  const hoje = new Date();
  if (hoje < this.DataInicio) this.estado = "agendada";
  else if (hoje > this.DataExpiracao) this.estado = "expirada";
  else this.estado = "ativa";
  next();
});

CampaignSchema.set('toJSON', { virtuals: true });
const Campaign = mongoose.models.Campaign || mongoose.model("Campaign", CampaignSchema);
export default Campaign;
