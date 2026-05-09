const express = require('express');
const router = express.Router();
const matiereController = require('../controllers/matiereController');
const { auth, isAdmin } = require('../middleware/auth');

router.get('/', auth, matiereController.list);
router.get('/create', auth, isAdmin, matiereController.createForm);
router.post('/create', auth, isAdmin, matiereController.create);
router.get('/edit/:id', auth, isAdmin, matiereController.editForm);
router.put('/edit/:id', auth, isAdmin, matiereController.update);
router.delete('/delete/:id', auth, isAdmin, matiereController.delete);

module.exports = router;