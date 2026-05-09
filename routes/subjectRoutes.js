const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const { auth, isAdmin } = require('../middleware/auth');

// Middleware teacher ou admin
const canManage = (req, res, next) => {
  const role = req.session.user?.role;
  if (['super_admin', 'admin', 'teacher'].includes(role)) return next();
  return res.status(403).render('errors/403', {
    title: 'غير مصرح',
    message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
  });
};

// Lecture — tout le monde
router.get('/', auth, subjectController.list);
router.get('/by-branch/:branchId', auth, subjectController.getByBranch);

// Création — teacher, admin, super_admin
router.get('/create', auth, canManage, subjectController.createForm);
router.post('/create', auth, canManage, subjectController.create);

// Édition — teacher, admin, super_admin
router.get('/edit/:id', auth, canManage, subjectController.editForm);
router.put('/edit/:id', auth, canManage, subjectController.update);

// Suppression — admin, super_admin seulement
router.delete('/delete/:id', auth, isAdmin, subjectController.delete);

// Page des matières en attente — admin seulement
router.get('/pending', auth, isAdmin, subjectController.pendingList);

module.exports = router;
