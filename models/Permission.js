const mongoose = require('mongoose');
const { Schema } = mongoose;

const permissionSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true,
    enum: ['users', 'content', 'academic', 'reports', 'settings', 'system']
  },
  description: {
    type: String,
    default: ''
  },
  defaultRoles: {
    type: [String],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Permission', permissionSchema);