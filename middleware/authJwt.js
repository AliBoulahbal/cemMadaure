const DashboardUser = require('../models/DashboardUser');
const authService = require('../services/authService');

// Middleware d'authentification
const auth = async (req, res, next) => {
  // Vérifier d'abord la session (compatibilité)
  if (req.session?.user) {
    req.user = req.session.user;
    return next();
  }
  
  // Vérifier le token JWT dans les cookies
  const token = req.cookies?.token;
  if (token) {
    const jwt = require('jsonwebtoken');
    const { JWT_SECRET } = require('../config/jwt');
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      req.session.user = decoded;
      return next();
    } catch (error) {
      res.clearCookie('token');
    }
  }
  
  return res.redirect('/login');
};

// Middleware pour les invités
const guest = (req, res, next) => {
  if (req.session?.user || req.cookies?.token) {
    return res.redirect('/dashboard');
  }
  next();
};

// Middleware pour vérifier le rôle
const requireRole = (...roles) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    
    if (!authService.hasRole(req.user, roles)) {
      return res.status(403).render('errors/403', {
        title: 'غير مصرح',
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    }
    next();
  };
};

// Middleware pour vérifier la permission
const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.redirect('/login');
    }
    
    if (!authService.hasPermission(req.user, permission)) {
      return res.status(403).render('errors/403', {
        title: 'غير مصرح',
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    }
    next();
  };
};

module.exports = { auth, guest, requireRole, requirePermission };