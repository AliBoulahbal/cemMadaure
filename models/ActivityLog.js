const mongoose = require('mongoose');
const { Schema } = mongoose;

const activityLogSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'DashboardUser',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['super_admin', 'admin', 'teacher', 'viewer'],
    required: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'PUBLISH', 'UNPUBLISH', 'APPROVE', 'REJECT'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['USER', 'BRANCH', 'SUBJECT', 'UNIT', 'LESSON', 'LESSON_PART', 'CONTENT', 'QUIZ', 'QUIZ_ATTEMPT'],
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
  oldData: {
    type: Schema.Types.Mixed,
    default: null
  },
  newData: {
    type: Schema.Types.Mixed,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'APPROVED'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour les recherches
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ entityType: 1 });
activityLogSchema.index({ status: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);