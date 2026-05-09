const mongoose = require("mongoose");
const { Schema } = mongoose;

// Schéma pour les options avec support multimédia
const optionSchema = new Schema({
  _id: { type: String, required: true },
  content: { type: String, required: true },
  isCorrect: { type: Boolean, required: true, default: false },
  mediaType: { 
    type: String, 
    enum: ['text', 'image', 'video', 'audio'],
    default: 'text'
  },
  mediaUrl: { type: String, default: '' }
}, { _id: false });

const quizSchema = new Schema(
  {
    lessonId: {
      type: Schema.Types.ObjectId,
      ref: "Lesson",
      required: true,
      index: true,
    },
    question: { type: String, required: true },
    subQuestion: { type: String }, // Stores the SVG URL or additional content
    questionMediaType: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'none'],
      default: 'text'
    },
    questionMediaUrl: { type: String, default: '' }, // URL for image/video/audio
    options: [optionSchema],
    point: { type: Number, default: 1 },
    typeQuiz: { 
      type: String, 
      enum: ["SINGLESELECT", "MULTISELECT"], 
      default: "SINGLESELECT" 
    },
    explanation: { type: String, default: '' }, // Explanation for the answer
    explanationMediaUrl: { type: String, default: '' }, // Explanation media
    order: { type: Number, default: 0 },
    createdBy: { type: String },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published'
    },
    _class: { type: String, default: "org.madaurecem.backoffice.models.Quiz" }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        return ret;
      },
    },
  }
);

// Index pour les recherches
quizSchema.index({ lessonId: 1, order: 1 });
quizSchema.index({ question: 'text' });

module.exports = mongoose.model("Quiz", quizSchema);