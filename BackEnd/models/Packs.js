import mongoose, { Schema } from "mongoose";

const PacksSchema = new mongoose.Schema({
  pointsCost: {
    type: Number,
    required: true,
  },

  rewardDescription: {
    type: String,
    required: true,
  },

  stock: {
    type: Number,
    required: true,
  },
});

export default PacksSchema;
