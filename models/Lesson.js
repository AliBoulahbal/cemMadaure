const mongoose = require("mongoose");
const { Schema } = mongoose;

const lessonSchema = new Schema(
  {
    unitId: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
      required: true,
    },
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
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    duration: {
      type: Number,
      default: 0,
    },
    videoUrl: {
      type: String,
      default: '',
    },
    // Nouveaux champs pour le workflow
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'ARCHIVED'],
      default: 'DRAFT'
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

module.exports = mongoose.model("Lesson", lessonSchema);