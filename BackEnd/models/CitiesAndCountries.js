import mongoose from "mongoose";

const CitiesAndCountriesSchema = new mongoose.Schema({
      name: { type: String, required: true },
      country_name: { type: String, required: true },
      state_name: { type: String, required: true },
});

export default mongoose.model('CitiesAndCountries', CitiesAndCountriesSchema, 'citiesAndCountries');