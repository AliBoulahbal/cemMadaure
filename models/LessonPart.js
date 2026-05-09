const mongoose = require('mongoose');

// ── Sous-schéma pour chaque document (VIDEO / PDF / TEXT / QUIZ) ───────────
const DocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['VIDEO', 'PDF', 'TEXT', 'QUIZ', 'IMAGE'],
    required: true
  },
  title: { type: String, required: true },
  url:   { type: String, default: '' },      // VIDEO ou PDF Wasabi
  content: { type: String, default: '' },    // TEXT ou QUIZ (JSON)
  duration: { type: Number, default: 0 },
  isFree:   { type: Boolean, default: false },
  order:    { type: Number, default: 0 }
}, { timestamps: true });

// ── Schéma principal ───────────────────────────────────────────────────────
const LessonPartSchema = new mongoose.Schema({

  // ── Référence obligatoire ─────────────────────────────────────────────
  lessonId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },

  // ── Références optionnelles — NULL autorisé (pas de required:true) ────
  branchId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Branch',  default: null },
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', default: null },
  unitId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Unit',    default: null },

  // ── Champs texte dénormalisés (pour réponse mobile sans populate) ─────
  lesson:  { type: String, default: '' },
  branch:  { type: String, default: '' },
  subject: { type: String, default: '' },
  unit:    { type: String, default: '' },

  // ── Métadonnées de la partie ──────────────────────────────────────────
  partName:    { type: String, default: '' },
  partOrder:   { type: Number, default: 0 },
  description: { type: String, default: '' },

  // ── NOUVEAU : tableau de documents multiples ──────────────────────────
  documents: { type: [DocumentSchema], default: [] },

  // ── ANCIENS champs conservés pour compatibilité Java/mobile ──────────
  // L'API mobile Java lit : id, branch, branchId, subject, subjectId,
  // unit, unitId, lesson, lessonId, order, title, url, duration, body
  type:     { type: String, enum: ['VIDEO', 'PDF', 'TEXT', 'QUIZ'], default: 'TEXT' },
  title:    { type: String, default: '' },
  url:      { type: String, default: '' },   // URL vidéo principale
  body:     { type: String, default: '' },   // URL PDF ou contenu texte
  duration: { type: Number, default: 0 },
  order:    { type: Number, default: 0 },
  isFree:   { type: Boolean, default: false },

  createdBy: { type: String, default: 'admin' }

}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id.toString();
      delete ret.__v;
    }
  },
  toObject: { virtuals: true }
});

LessonPartSchema.index({ lessonId: 1, partOrder: 1 });
LessonPartSchema.index({ lessonId: 1, order: 1 });

module.exports = mongoose.model('LessonPart', LessonPartSchema);