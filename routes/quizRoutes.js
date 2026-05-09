const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { auth, isAdmin } = require('../middleware/auth');
const { uploadQuizImage, uploadQuizVideo, uploadQuizAudio } = require('../middleware/quizUpload');

// ==================== ROUTES PRINCIPALES ====================

// Liste de tous les quiz (page d'accueil des quiz)
router.get('/', auth, quizController.index);

// Quiz par leçon
router.get('/lesson/:lessonId', auth, quizController.listByLesson);

// Création
router.get('/create/:lessonId', auth, isAdmin, quizController.createForm);
router.post('/create', auth, isAdmin, quizController.create);

// Édition et gestion
router.get('/edit/:id', auth, isAdmin, quizController.editForm);
router.put('/update/:id', auth, isAdmin, quizController.update);
router.delete('/delete/:id', auth, isAdmin, quizController.delete);

// ==================== ROUTES API POUR LES MÉDIAS ====================
router.post('/upload/question-media', auth, isAdmin, uploadQuizImage, quizController.uploadQuestionMedia);
router.post('/upload/option-media', auth, isAdmin, uploadQuizImage, quizController.uploadOptionMedia);
router.post('/upload/question-video', auth, isAdmin, uploadQuizVideo, quizController.uploadQuestionMedia);
router.post('/upload/question-audio', auth, isAdmin, uploadQuizAudio, quizController.uploadQuestionMedia);
router.delete('/delete-media', auth, isAdmin, quizController.deleteMedia);

// ==================== ROUTES API MOBILE ====================
router.get('/api/lesson/:lessonId', quizController.getQuizForLesson);
router.post('/api/submit', quizController.submitAnswers);

module.exports = router;