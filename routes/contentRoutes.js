const express = require('express');
const router = express.Router();
const contentController = require('../controllers/contentController');
const { auth } = require('../middleware/auth');
const { getPresignedUrl } = require('../config/wasabi');

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
router.post('/upload/video-url', auth, canUpload, contentController.uploadVideoUrl);

router.get('/upload', auth, canUpload, contentController.uploadForm);
router.get('/recent', auth, contentController.recentContent);
router.get('/manage', auth, contentController.manageIndex);
router.get('/manage/:lessonId', auth, contentController.manage);
router.delete('/delete/:id', auth, contentController.delete);
router.put('/reorder', auth, contentController.reorder);
router.put('/update/text', auth, contentController.updateText);

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

router.post('/upload/video', auth, canUpload, contentController.uploadVideo);
router.post('/upload/pdf',   auth, canUpload, contentController.uploadPDF);
router.post('/upload/image', auth, canUpload, contentController.uploadImage);
router.post('/upload/text',  auth, canUpload, contentController.uploadText);
router.post('/upload/quiz',  auth, canUpload, contentController.uploadQuiz);

router.get('/api/contents/:lessonId', auth, contentController.getContentsByLesson);
router.put('/update/:id', auth, canUpload, contentController.updateContent);

router.get('/test', auth, (req, res) => {
  res.json({ message: 'Content routes working!', wasabi: true });
});

module.exports = router;