import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema({
  lojaId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Business', 
    required: true 
  },
  clienteId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    default: null // Fica null até que um cidadão leia o código
  },
  valorOriginal: {
    type: Number, 
    required: true
  },
  saldoGerado: {
    type: Number,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['pendente', 'concluido', 'expirado'],
    default: 'pendente'
  },
  // Este campo faz o MongoDB apagar o registo automaticamente após X segundos
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Apaga o documento da DB após 10 minutos (600 segundos)
  }
});

// Evitar erro de re-compilação do modelo
const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export default Transaction;