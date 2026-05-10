const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { auth, isAdmin } = require('../middleware/auth');

// ==================== ROUTES PRINCIPALES ====================
router.get('/', auth, quizController.index);
router.get('/lesson/:lessonId', auth, quizController.listByLesson);
router.get('/create/:lessonId', auth, isAdmin, quizController.createForm);
router.post('/create', auth, isAdmin, quizController.create);
router.get('/edit/:id', auth, isAdmin, quizController.editForm);
router.put('/update/:id', auth, isAdmin, quizController.update);
router.delete('/delete/:id', auth, isAdmin, quizController.delete);

// ==================== UPLOAD WASABI (URL présignée) ====================
// Le navigateur appelle GET /quiz/upload/presign?type=image&ext=jpg
// Le serveur retourne { uploadUrl, publicUrl } — aucun fichier ne transite par le serveur
router.get('/upload/presign', auth, isAdmin, quizController.getPresignUrl);

// ==================== ROUTES API MOBILE ====================
router.get('/api/lesson/:lessonId', quizController.getQuizForLesson);
router.post('/api/submit', quizController.submitAnswers);

module.exports = router;
