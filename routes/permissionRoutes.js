const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { auth, isSuperAdmin } = require('../middleware/auth');

// Toutes les routes nécessitent authentification et super admin
router.use(auth);
router.use(isSuperAdmin);

router.get('/', permissionController.list);
router.get('/create', permissionController.createForm);
router.post('/create', permissionController.create);
router.get('/edit/:id', permissionController.editForm);
router.put('/edit/:id', permissionController.update);
router.delete('/delete/:id', permissionController.delete);
router.get('/user/:id', permissionController.userPermissions);
router.put('/user/:id', permissionController.updateUserPermissions);
router.get('/api/by-role/:role', permissionController.getByRole);

module.exports = router;