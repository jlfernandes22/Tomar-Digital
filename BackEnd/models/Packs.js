import mongoose, { Schema } from "mongoose";

const PacksSchema = new mongoose.Schema({
  
  rewardDescription: {
    type: String,
    required: true,
  },


  pointsCost: {
    type: Number,
    required: true,
  },

  

  stock: {
    type: Number,
    required: true,
  },

  currentStock: {
    type: Number, 
    default: function () {
      return this.stock;
    },
  },

  maxPerUser: { type: Number, default: 1 }
});

export default PacksSchema;
