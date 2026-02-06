import mongoose from 'mongoose'


const BusinessSchema = new mongoose.Schema({

    //Nome do negócio
    name: {
        type:String,
        required: true

    },

    //Categoria do negócio
    category: {

        type: String,
        enum: ['Monumento','Restauração','Comércio','Parque','Hotel'],
        required: true
    },

    //locatização no mapa (temporário ou definitivo dependendo do mapa que será usado Google Maps ou outro)
    location: {
        lat:Number,
        long:Number
    }

})

export default mongoose.model('Business', BusinessSchema);