const DashboardUser = require('../models/DashboardUser');

// Vérifier les permissions par rôle
const checkPermission = (requiredRole) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    
    try {
      const user = await DashboardUser.findById(req.session.user.id);
      
      const roleHierarchy = {
        'super_admin': 4,
        'admin': 3,
        'teacher': 2,
        'viewer': 1
      };
      
      const userLevel = roleHierarchy[user.role] || 0;
      const requiredLevel = roleHierarchy[requiredRole] || 0;
      
      if (userLevel >= requiredLevel) {
        return next();
      }
      
      return res.status(403).render('errors/403', {
        title: 'غير مصرح',
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('errors/500', { error: error.message });
    }
  };
};

// Vérifier si l'utilisateur peut accéder à une section
const canAccess = (section) => {
  return async (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }
    
    try {
      const user = await DashboardUser.findById(req.session.user.id);
      
      const sectionPermissions = {
        'super_admin': ['all'],
        'admin': ['dashboard', 'academic', 'content', 'quiz', 'reports', 'users'],
        'teacher': ['dashboard', 'academic', 'content', 'quiz'],
        'viewer': ['dashboard', 'academic']
      };
      
      const userSections = sectionPermissions[user.role] || [];
      
      if (userSections.includes(section) || userSections.includes('all')) {
        return next();
      }
      
      return res.status(403).render('errors/403', {
        title: 'غير مصرح',
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    } catch (error) {
      console.error(error);
      res.status(500).render('errors/500', { error: error.message });
    }
  };
};

module.exports = { checkPermission, canAccess };