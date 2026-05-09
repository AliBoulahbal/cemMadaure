const DashboardUser = require('../models/DashboardUser');
const bcrypt = require('bcryptjs');

// Afficher formulaire de login
exports.loginForm = (req, res) => {
  res.render('auth/login', { 
    title: 'تسجيل الدخول', 
    layout: false,
    error: null 
  });
};

// Traiter la connexion - VERSION ULTRA SIMPLE
exports.login = async (req, res) => {
  const { username, password } = req.body;
  
  try {
    // Chercher l'utilisateur
    const user = await DashboardUser.findOne({ username });
    
    if (!user) {
      return res.render('auth/login', { 
        error: 'Identifiants incorrects', 
        title: 'تسجيل الدخول', 
        layout: false 
      });
    }
    
    // Vérifier le mot de passe avec bcrypt DIRECT
    const isMatch = bcrypt.compareSync(password, user.password);
    
    if (!isMatch) {
      return res.render('auth/login', { 
        error: 'Identifiants incorrects', 
        title: 'تسجيل الدخول', 
        layout: false 
      });
    }
    
    // Créer la session
    req.session.user = {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role
    };
    
    res.redirect('/dashboard');
    
  } catch (error) {
    console.error(error);
    res.render('auth/login', { 
      error: 'Erreur serveur', 
      title: 'تسجيل الدخول', 
      layout: false 
    });
  }
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};