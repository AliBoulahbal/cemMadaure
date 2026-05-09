const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { auth, isAdmin } = require('../middleware/auth');
const { checkPermission, canAccess } = require('../middleware/permissions');


router.get('/', auth, branchController.list);
router.get('/create', auth, isAdmin, branchController.createForm);
router.post('/create', auth, isAdmin, branchController.create);
router.get('/edit/:id', auth, isAdmin, branchController.editForm);
router.put('/edit/:id', auth, isAdmin, branchController.update);
router.delete('/delete/:id', auth, isAdmin, branchController.delete);
router.post('/create', auth, checkPermission('admin'), branchController.create);
router.put('/edit/:id', auth, checkPermission('admin'), branchController.update);
router.delete('/delete/:id', auth, checkPermission('admin'), branchController.delete);

// Tout le monde peut voir
router.get('/', auth, canAccess('academic'), branchController.list);

module.exports = router;