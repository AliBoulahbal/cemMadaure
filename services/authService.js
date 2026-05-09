const DashboardUser = require('../models/DashboardUser');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../config/jwt');

class AuthService {
  // Login
  async login(username, password, req) {
    try {
      // Validation des champs
      if (!username || !password) {
        return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
      }
      
      // Chercher l'utilisateur
      const user = await DashboardUser.findOne({ 
        $or: [{ username }, { email: username }],
        isActive: true
      });
      
      if (!user) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }
      
      // Vérifier le mot de passe
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
      }
      
      // Mettre à jour lastLogin
      await DashboardUser.findByIdAndUpdate(user._id, { lastLogin: new Date() });
      
      // Générer le token JWT
      const token = generateToken(user);
      
      // Stocker dans la session (pour compatibilité)
      req.session.user = {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      };
      
      return { 
        success: true, 
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          role: user.role
        },
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  }
  
  // Logout
  logout(req, res) {
    req.session.destroy();
    res.clearCookie('token');
    res.clearCookie('connect.sid');
    return { success: true };
  }
  
  // Vérifier si l'utilisateur a un rôle
  hasRole(user, allowedRoles) {
    if (!user) return false;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(user.role);
  }
  
  // Vérifier si l'utilisateur a une permission
  hasPermission(user, permission) {
    if (!user) return false;
    
    const permissions = {
      super_admin: ['all'],
      admin: ['users.view', 'users.create', 'users.edit', 'users.delete', 
              'content.view', 'content.create', 'content.edit', 'content.delete',
              'academic.view', 'academic.create', 'academic.edit', 'academic.delete',
              'reports.view', 'reports.export', 'settings.view', 'settings.edit'],
      teacher: ['content.view', 'content.create', 'content.edit',
                'academic.view', 'reports.view'],
      viewer: ['content.view', 'academic.view']
    };
    
    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes('all') || userPermissions.includes(permission);
  }
}

module.exports = new AuthService();