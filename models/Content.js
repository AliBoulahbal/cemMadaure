const mongoose = require('mongoose');
const { Schema } = mongoose;

const BaseContentSchema = new Schema({
  lessonId: {
    type: Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['video', 'text', 'image', 'pdf', 'word', 'quiz'],
    index: true,
    discriminatorKey: 'type'
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  title: {
    type: String,
    required: true
  },
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
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  discriminatorKey: 'type',
});

const Content = mongoose.model('Content', BaseContentSchema);

// Discriminators (vidéo, PDF, texte, etc.)
const VideoContentSchema = new Schema({
  data: {
    url: { type: String, required: true },
    fileKey: { type: String, default: '' },
    duration: { type: Number },
    thumbnailUrl: { type: String }
  }
});

const TextContentSchema = new Schema({
  data: {
    body: { type: String, required: true }
  }
});

const ImageContentSchema = new Schema({
  data: {
    url: { type: String, required: true },
    fileKey: { type: String, default: '' }
  }
});

const FileContentSchema = new Schema({
  data: {
    url: { type: String, required: true },
    fileKey: { type: String, default: '' },
    fileSize: { type: Number }
  }
});

const QuizOptionSchema = new Schema({
  text: { type: String, required: true },
  isCorrect: { type: Boolean, required: true }
}, { _id: false });

const QuizQuestionSchema = new Schema({
  questionText: { type: String, required: true },
  options: { type: [QuizOptionSchema], required: true },
  explanation: { type: String }
}, { _id: false });

const QuizContentSchema = new Schema({
  data: {
    questions: { type: [QuizQuestionSchema], required: true }
  }
});

Content.discriminator('video', VideoContentSchema);
Content.discriminator('text', TextContentSchema);
Content.discriminator('image', ImageContentSchema);
Content.discriminator('pdf', FileContentSchema);
Content.discriminator('word', FileContentSchema);
Content.discriminator('quiz', QuizContentSchema);

module.exports = Content;