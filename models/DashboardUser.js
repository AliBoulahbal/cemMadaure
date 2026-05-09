const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const dashboardUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { type: String, default: 'viewer' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Méthode pour hasher le mot de passe
dashboardUserSchema.methods.hashPassword = function(password) {
  this.password = bcrypt.hashSync(password, 10);
  return this;
};

// Méthode pour vérifier le mot de passe
dashboardUserSchema.methods.verifyPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

module.exports = mongoose.model('DashboardUser', dashboardUserSchema);