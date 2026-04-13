import mongoose from "mongoose";
import PackSchema from "./Packs.js";

const CampaignSchema = new mongoose.Schema({
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  title: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  packs: [PackSchema],

  expirationDate: {
    type: Date,
    required: true,
  },

  //Data de inicio da campanha para verificar se a fatura é válida

  //logo e flysheet teram de ser required no futuro

  logo: {
    type: String,
    default: "",
  },

  flysheet: {
    type: String,
    default: "",
  },
});

export default mongoose.model("Campaign", CampaignSchema);
