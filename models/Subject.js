const mongoose = require("mongoose");
const { Schema } = mongoose;

const subjectSchema = new Schema(
  {
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      default: ''
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: ''
    },
    icon: {
      type: String,
      default: 'fa-book'
    },
    color: {
      type: String,
      default: 'primary'
    },
    // Nouveaux champs pour le workflow
    status: {
      type: String,
      enum: ['PENDING', 'PUBLISHED', 'REJECTED'],
      default: 'PUBLISHED'
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'DashboardUser',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'DashboardUser',
      default: null
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'DashboardUser',
      default: null
    },
    approvedAt: {
      type: Date,
      default: null
    },
    rejectionReason: {
      type: String,
      default: ''
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

module.exports = mongoose.model("Subject", subjectSchema);