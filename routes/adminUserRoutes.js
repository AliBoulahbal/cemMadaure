const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { auth, isAdmin } = require('../middleware/auth');  // Utiliser isAdmin au lieu de isSuperAdmin

// Permettre à admin et super_admin d'accéder
router.use(auth);
router.use(isAdmin);  // isAdmin autorise admin et super_admin

router.get('/', adminUserController.list);
router.get('/create', adminUserController.createForm);
router.post('/create', adminUserController.create);
router.get('/edit/:id', adminUserController.editForm);
router.put('/edit/:id', adminUserController.update);
router.delete('/delete/:id', adminUserController.delete);
router.get('/view/:id', adminUserController.view);
router.get('/change-password/:id', adminUserController.changePasswordForm);
router.post('/change-password/:id', adminUserController.changePassword);

// Toggle actif/غير نشط
router.put('/toggle-status/:id', adminUserController.toggleStatus);

module.exports = router;