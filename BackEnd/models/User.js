import mongoose from "mongoose";

//Tabela dos utilizadores
const UserSchema = new mongoose.Schema({
  //Nome do utilizador
  name: {
    type: String,
    required: true,
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

  saldo: {
    type: Number,
    default: 0,
  },

  NIF: {
    type: Number,
    default: null,
  },
});

export default mongoose.model("User", UserSchema);
