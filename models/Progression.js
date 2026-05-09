const mongoose = require('mongoose');
const { Schema } = mongoose;

// ─────────────────────────────────────────────────────────────────────────────
// Sous-schéma pour chaque partie de leçon
// Correspond à ProgressionPartRequest.java Android :
//   { "id": "lessonPartId", "percentage": 25 }
// Et au screenshot MongoDB :
//   progressionsPart: [{ _id: ObjectId, percentage: 25 }, ...]
// ─────────────────────────────────────────────────────────────────────────────
const progressionPartSchema = new Schema(
  {
    _id: {
      type: Schema.Types.ObjectId,
      required: true
    },
    percentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  { _id: false }
);

// ─────────────────────────────────────────────────────────────────────────────
// Schéma principal Progression
// Correspond au screenshot MongoDB :
//   clientId, unitId, lessonId, progressionsPart[], createdAt, updatedAt, _class
// ─────────────────────────────────────────────────────────────────────────────
const progressionSchema = new Schema(
  {
    clientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    unitId: {
      type: Schema.Types.ObjectId,
      ref: 'Unit',
      required: true
    },
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
      index: true
    },
    progressionsPart: [progressionPartSchema],
    _class: {
      type: String,
      default: 'org.madaure.backoffice.models.Progression'
    }
  },
  {
    timestamps: true,       // createdAt + updatedAt automatiques
    collection: 'progression'
  }
);

// Index composé pour lookup rapide clientId + lessonId
progressionSchema.index({ clientId: 1, lessonId: 1 }, { unique: true });

// ─────────────────────────────────────────────────────────────────────────────
// Méthode virtuelle : calcule le pourcentage global de la leçon
// Somme de tous les percentages des parties (déjà pondérés par Android)
// ─────────────────────────────────────────────────────────────────────────────
progressionSchema.virtual('overallPercentage').get(function () {
  if (!this.progressionsPart || this.progressionsPart.length === 0) return 0;
  const sum = this.progressionsPart.reduce((acc, p) => acc + (p.percentage || 0), 0);
  return Math.min(Math.round(sum), 100);
});

module.exports = mongoose.model('Progression', progressionSchema);