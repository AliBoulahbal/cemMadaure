const mongoose = require("mongoose");

const SoldTokenSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  code: { type: String }, // New field for group name
  generatedAt: { type: Date},
  sold: { type: Boolean, default: false },
  consumed: { type: Boolean, default: false },
});

const SoldToken = mongoose.model("SoldToken", SoldTokenSchema);

module.exports = SoldToken;
