const mongoose = require("mongoose");
const { Schema } = mongoose;

const vimeoCodeSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    user: {
      type: String,
      required: true,
      default: "education",
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "USED", "EXPIRED"],
      default: "PENDING",
    },
    videoUrl: {
      type: String,
      default: "",
    },
    videoTitle: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    order: {                    // ⭐ AJOUTER CE CHAMP
      type: Number,
      default: 0,
      index: true
    },
    usedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model("VimeoCode", vimeoCodeSchema);