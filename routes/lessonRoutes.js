const express = require('express');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const { auth } = require('../middleware/auth');

// Routes accessibles à tous
router.get('/', auth, lessonController.list);
router.get('/view/:id', auth, lessonController.view);

// Routes pour les enseignants et admins
router.get('/create', auth, lessonController.createForm);
router.post('/create', auth, lessonController.create);
router.get('/edit/:id', auth, lessonController.editForm);
router.put('/edit/:id', auth, lessonController.update);
router.delete('/delete/:id', auth, lessonController.delete);

// Routes pour les admins (approbation)
router.get('/pending', auth, lessonController.pendingLessons);
router.put('/approve/:lessonId', auth, lessonController.approve);

module.exports = router;