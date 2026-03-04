import mongoose from 'mongoose'


const BusinessSchema = new mongoose.Schema({

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },

    //Nome do negócio
    name: {
        type:String,
        required: true

    },

    //Categoria do negócio baseado na cidade de Tomar
    category: {
    type: String,
    enum: [
        'Património & Museus', // Para o Convento, Sinagoga, Mata dos Sete Montes
        'Restauração',         // Restaurantes e Tabernas
        'Cafés & Pastelarias', // Essencial para as "Fatias de Tomar"
        'Alojamento',          // Hotéis e ALs
        'Comércio Local',      // Lojas do centro histórico
        'Lazer & Natureza',    // Rio Nabão, Parque do Mouchão
        'Serviços'             // Farmácias, Bancos, etc.
    ],
    required: true
},

    //locatização no mapa (temporário ou definitivo dependendo do mapa que será usado Google Maps ou outro)
    location: {
        lat:Number,
        long:Number
    },

    status: {
        type: String,
        enum: ['pendente', 'aprovado', 'rejeitado'],
        default: 'pendente' 
    }

})

export default mongoose.model('Business', BusinessSchema);