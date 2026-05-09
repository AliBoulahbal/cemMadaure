// models/User.js - POUR L'APPLICATION MOBILE SEULEMENT
const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
      unique: true
    },
    firstName: {
      type: String,
      default: ''
    },
    lastName: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    branches: [{
      type: Schema.Types.ObjectId,
      ref: "Branch",
    }],
    userType: {
      type: Number,
      default: 2, // 2 = étudiant
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'blocked'],
      default: 'active'
    },
    contractId: {
      type: Schema.Types.ObjectId,
      ref: "Contract"
    }
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

module.exports = mongoose.model("User", userSchema);