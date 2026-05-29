import mongoose, { Schema } from "mongoose";

const CitiesAndCountriesSchema = new mongoose.Schema({

      name: { type: String, required: true },
      country_name: { type: String, required: true },
      state_name: { type: String, required: true },

})
const CitiesAndCountries = mongoose.model("CitiesAndCountries", CitiesAndCountriesSchema);

export default mongoose.model('CitiesAndCountries', CitiesAndCountriesSchema, 'citiesAndCountries');