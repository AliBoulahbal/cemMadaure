const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');
const { auth, isAdmin } = require('../middleware/auth');

// Middleware pour vérifier si l'utilisateur peut gérer les unités
const canManageUnits = (req, res, next) => {
  const role = req.session.user?.role;
  // Autoriser super_admin, admin et teacher
  if (role === 'super_admin' || role === 'admin' || role === 'teacher') {
    return next();
  }
  return res.status(403).render('errors/403', { 
    title: 'غير مصرح',
    message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
  });
};

// Routes accessibles à tous (y compris viewer)
router.get('/', auth, unitController.list);
router.get('/view/:id', auth, unitController.view);

// Routes pour créer/modifier (teacher, admin, super_admin)
router.get('/create', auth, canManageUnits, unitController.createForm);
router.post('/create', auth, canManageUnits, unitController.create);
router.get('/edit/:id', auth, canManageUnits, unitController.editForm);
router.put('/edit/:id', auth, canManageUnits, unitController.update);
router.delete('/delete/:id', auth, canManageUnits, unitController.delete);
// Routes d'approbation (admin et super_admin seulement)
router.get('/pending', auth, isAdmin, unitController.pendingUnits);
router.put('/approve/:id', auth, isAdmin, unitController.approveUnit);
router.put('/reject/:id', auth, isAdmin, unitController.rejectUnit);
router.get('/api/by-subject/:subjectId', auth, unitController.getUnitsBySubject);


module.exports = router;