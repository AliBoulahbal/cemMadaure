const express = require('express');
const router = express.Router();
const quizAttemptController = require('../controllers/quizAttemptController');
const { auth, isAdmin } = require('../middleware/auth');

// Toutes les routes nécessitent une authentification
router.use(auth);

// Routes principales - VÉRIFIER QUE CHAQUE MÉTHODE EXISTE
router.get('/', quizAttemptController.allAttempts);
router.get('/lesson/:lessonId', quizAttemptController.listByLesson);
router.get('/view/:attemptId', quizAttemptController.viewAttempt);
router.delete('/delete/:id', quizAttemptController.deleteAttempt);

// Routes API
router.post('/api/submit', quizAttemptController.submitAttempt);
router.get('/api/student/:clientId', quizAttemptController.getStudentAttempts);
router.get('/api/student/:clientId/lesson/:lessonId', quizAttemptController.getStudentAttempts);

module.exports = router;