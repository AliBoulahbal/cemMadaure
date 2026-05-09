const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'DashboardUser',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['content_approved', 'content_rejected', 'content_pending', 'content_created', 'unit_approved', 'lesson_approved'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['CONTENT', 'UNIT', 'LESSON', 'SUBJECT'],
    required: true
  },
  entityId: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    default: ''
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isSeen: {
    type: Boolean,
    default: false
  },
  actionUrl: {
    type: String,
    default: ''
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les requêtes
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ isRead: 1, userId: 1 });

module.exports = mongoose.model('Notification', notificationSchema);