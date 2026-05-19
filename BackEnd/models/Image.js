import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  nomeOriginal: String,
  dados: Buffer,          // Os bytes da imagem WebP
  contentType: String,    // Será 'image/webp'
  criadoEm: { type: Date, default: Date.now }
});

export default mongoose.model('Image', ImageSchema);