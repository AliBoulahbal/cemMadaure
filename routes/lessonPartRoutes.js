const express = require('express');
const router = express.Router();
const lessonPartController = require('../controllers/lessonPartController');
const { auth } = require('../middleware/auth');

router.use(auth);

// Routes principales
router.get('/', lessonPartController.listAll);
router.get('/lesson/:lessonId', lessonPartController.listByLesson);
router.get('/create/:lessonId', lessonPartController.createForm);
router.post('/create', lessonPartController.create);
router.delete('/:id', lessonPartController.delete);
router.delete('/:partId/document/:docId', lessonPartController.deleteDocument);

// Routes d'upload
router.post('/upload/video', lessonPartController.uploadVideo);
router.post('/upload/pdf', lessonPartController.uploadPDF);
router.post('/upload/text', lessonPartController.uploadText);

// Routes API
router.get('/api/parts/:lessonId', lessonPartController.getPartsByLesson);
router.get('/stats', lessonPartController.getStats);

module.exports = router;