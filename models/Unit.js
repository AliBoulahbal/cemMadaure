const mongoose = require("mongoose");
const { Schema } = mongoose;

const unitSchema = new Schema(
  {
    subjectId: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    description: {
      type: String,
      default: ''
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
    },
    url: {
      type: String,
      default: ''
    },
    image: {
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

module.exports = mongoose.model("Unit", unitSchema);