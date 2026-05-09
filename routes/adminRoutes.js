const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { auth, guest } = require('../middleware/auth');

// Routes publiques (sans authentification)
router.get('/login', guest, adminController.loginForm);
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

// Routes protégées (avec authentification)
router.get('/dashboard', auth, adminController.dashboard);
router.get('/', auth, (req, res) => res.redirect('/dashboard'));

// Routes API
router.get('/api/stats', auth, adminController.getStats);
// Route pour vérifier le rôle (temporaire)
router.get('/check-role', auth, (req, res) => {
  res.json({
    id: req.session.user.id,
    username: req.session.user.username,
    role: req.session.user.role,
    fullName: req.session.user.fullName
  });
});


module.exports = router;