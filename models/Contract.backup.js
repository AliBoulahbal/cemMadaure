const mongoose = require("mongoose");
const { Schema } = mongoose;

const contractSchema = new Schema(
  {
    deviceId: {
      type: String,
      required: true,
    },
    soldKey: {
      type: String,
      required: true,
      unique: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    expiringDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "PENDING_DELETION"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.contractId = ret._id.toString();
        if (ret.branchId) ret.branchId = ret.branchId.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model("Contract", contractSchema);
