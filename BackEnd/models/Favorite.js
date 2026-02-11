import mongoose from 'mongoose'

const FavoriteSchema = new mongoose.Schema({
  // Referência ao modelo de User
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  // Referência ao modelo de Business (Negócio)
  businessId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true 
  },
  createdAt: { type: Date, default: Date.now }
});

// Criar o modelo baseado no Schema
const Favorite = mongoose.model('Favorite', FavoriteSchema);

export default mongoose.model('Favorite', FavoriteSchema);