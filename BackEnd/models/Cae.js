import mongoose from "mongoose";

const CaeSchema = new mongoose.Schema({
      seccao: { type: String, required: true },
      cae: { type: String, required: true },
      descricao: { type: String, required: true }
});

export default mongoose.model('Cae', CaeSchema, 'caes');