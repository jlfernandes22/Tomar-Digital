import mongoose, { Schema } from "mongoose";

const PedidosComercianteSchema = new mongoose.Schema({

    tituloComercio : {type: String, required: true },
    donoComercio : {type:String, required: true},
    emailDono : {type: String, required: true},
    telefoneDono : {type: String, required: true},
    documentoPdfUrl : {type: String, required: true},

});
const PedidosComerciante = mongoose.models.PedidosComerciante || mongoose.model("PedidosComerciante", PedidosComercianteSchema);
export default PedidosComerciante;
