// middleware/auth-dev.js
const DashboardUser = require('../models/DashboardUser');

const auth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const guest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

const isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const isSuperAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

module.exports = { auth, guest, isAdmin, isSuperAdmin };