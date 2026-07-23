import mongoose from "mongoose";

//Tabela dos utilizadores
const UserSchema = new mongoose.Schema({
  //Nome do utilizador
  name: {
    type: String,
    required: false,
  },

  //Email
  email: {
    type: String,
    required: true,
  },

  //Password
  password: {
    type: String,
    required: true,
  },

  //Cidade
  city: {
    type: String,
    required: false,
  },

  role: {
    type: String,
    enum: ["cidadao", "comerciante", "camara"],
    default: "cidadao",
  },

  Points: {
    type: Number,
    default: 0,
  },

  NIF: {
    type: Number,
    default: null,
  },

  Avatar: {
    type: String,
    required: false,
  },
  acceptedInvoiceTerms: {
    type: Boolean,
    default: false,
  },

  codigoValidar: {type: String},

  isVerified: {type: Boolean, required:true},

  codigoResetPassword: { type: String, default: null },
  
  codigoResetExpira: { type: Date, default: null },
});

export default mongoose.model("User", UserSchema);
