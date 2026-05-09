const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { auth } = require('../middleware/auth');

// Route pour accéder à la liste des utilisateurs
router.get('/', auth, userController.list);
router.get('/create', auth, userController.createForm);
router.post('/create', auth, userController.create);
router.get('/edit/:id', auth, userController.editForm);
router.put('/edit/:id', auth, userController.update);
router.delete('/delete/:id', auth, userController.delete);
router.get('/view/:id', auth, userController.view);
router.get('/change-password/:id', auth, userController.changePasswordForm);
router.post('/change-password/:id', auth, userController.changePassword);

module.exports = router;