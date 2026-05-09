const mongoose = require("mongoose");
const { Schema } = mongoose;

const teacherSchema = new Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    branch: { type: String },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    Annee: { type: String },
    AnneeId: { type: Schema.Types.ObjectId, ref: "Annee" },
    photoUrl: { type: String },
    experienceYear: { type: Number },
    active: { type: Boolean, default: true },
    level: { type: String },
    description: { type: String },
    userId: { type: String },
    createdBy: { type: String },
    _class: { type: String }, // Included since it's in your document
    isFree: { type: Boolean, default: false },
  },
  {
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        if (ret.AnneeId) ret.AnneeId = ret.AnneeId.toString();
        if (ret.branchId) ret.branchId = ret.branchId.toString();
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

module.exports = mongoose.model("Teacher", teacherSchema);
