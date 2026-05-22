import mongoose, { Schema } from "mongoose";

const CaeSchema = new mongoose.Schema({

      seccao: { type: String, required: true },
      cae: { type: String, required: true },
      descricao: { type: String, required: true }

})
const Cae = mongoose.model("Cae", CaeSchema);

export default mongoose.model('Cae', CaeSchema, 'caes');