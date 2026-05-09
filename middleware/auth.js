// middleware/auth.js
const DashboardUser = require('../models/DashboardUser');

const auth = (req, res, next) => {
  console.log('Session user:', req.session?.user); // Debug
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware pour les invités (non connectés)
const guest = (req, res, next) => {
  if (req.session && req.session.user) {
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware pour vérifier si l'utilisateur est admin ou super_admin
const isAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  
  try {
    const user = await DashboardUser.findById(req.session.user.id);
    if (!user || (user.role !== 'super_admin' && user.role !== 'admin')) {
      return res.status(403).render('errors/403', { 
        title: 'غير مصرح',
        message: 'هذه الصفحة متاحة فقط للمديرين'
      });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { error: error.message });
  }
};

// Middleware pour vérifier si l'utilisateur est super_admin seulement
const isSuperAdmin = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  
  try {
    const user = await DashboardUser.findById(req.session.user.id);
    if (!user || user.role !== 'super_admin') {
      return res.status(403).render('errors/403', { 
        title: 'غير مصرح',
        message: 'هذه الصفحة متاحة فقط للمدير العام'
      });
    }
    next();
  } catch (error) {
    console.error(error);
    res.status(500).render('errors/500', { error: error.message });
  }
};

module.exports = { auth, guest, isAdmin, isSuperAdmin };