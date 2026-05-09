const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { auth } = require('../middleware/auth');
const { getPresignedUrl } = require('../config/wasabi');

// Middleware upload permission
const canUpload = (req, res, next) => {
  const role = req.session.user?.role;
  if (role === 'super_admin' || role === 'admin' || role === 'teacher') {
    return next();
  }
  return res.status(403).render('errors/403', { 
    title: 'غير مصرح',
    message: 'ليس لديك صلاحية لرفع المحتوى'
  });
};

// ==================== ROUTES SPÉCIFIQUES ====================
router.get('/upload', auth, canUpload, contentController.uploadForm);
router.get('/recent', auth, contentController.recentContent);

// ==================== ROUTES AVEC PARAMÈTRES ====================
router.get('/manage/:lessonId', auth, contentController.manage);

// ==================== ROUTES D'ACTION ====================
router.delete('/delete/:id', auth, contentController.delete);
router.put('/reorder', auth, contentController.reorder);
router.put('/update/text', auth, contentController.updateText);

// ==================== PRESIGN WASABI ====================
// GET /content/presign?type=pdf&ext=pdf
router.get('/presign', auth, canUpload, async (req, res) => {
  try {
    const { type, ext } = req.query;
    if (!type || !ext) return res.status(400).json({ error: 'type et ext sont requis' });
    if (!['video', 'pdf', 'image'].includes(type)) return res.status(400).json({ error: 'type invalide' });
    const { url, key, publicUrl } = await getPresignedUrl(type, ext);
    res.json({ url, key, publicUrl });
  } catch (err) {
    console.error('Presign error:', err);
    res.status(500).json({ error: 'Erreur génération URL Wasabi' });
  }
});

// ==================== ROUTES D'UPLOAD ====================
router.post('/upload/video', auth, canUpload, contentController.uploadVideo);
router.post('/upload/pdf',   auth, canUpload, contentController.uploadPDF);
router.post('/upload/image', auth, canUpload, contentController.uploadImage);
router.post('/upload/text',  auth, canUpload, contentController.uploadText);
router.post('/upload/quiz',  auth, canUpload, contentController.uploadQuiz);

// ⭐ NOUVEAU - Upload par URL (Vimeo/YouTube)
router.post('/upload/video-url', auth, canUpload, contentController.uploadVideoUrl);
// Dans content.routes.js, au début du fichier, ajoutez :
console.log('🔧 Chargement content.routes.js');

// Puis avant la définition des routes, ajoutez :
router.use((req, res, next) => {
  console.log('📡 Content route accessed:', req.method, req.url);
  next();
});

// Et spécifiquement pour video-url :
router.post('/upload/video-url', auth, canUpload, (req, res, next) => {
  console.log('🎯 Route /upload/video-url interceptée');
  next();
}, contentController.uploadVideoUrl);

// ==================== ROUTES API ====================
router.get('/api/contents/:lessonId', auth, contentController.getContentsByLesson);
router.put('/update/:id', auth, canUpload, contentController.updateContent);

// ==================== TEST ====================
router.get('/test', auth, (req, res) => {
  res.json({ message: 'Content routes working!', routes: ['/upload', '/recent', '/manage/:id'] });
});

module.exports = router;