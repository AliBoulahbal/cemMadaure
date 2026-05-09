const express = require('express');
const router = express.Router();
const vimeoCodeController = require('../controllers/vimeoCodeController');
const { auth, isAdmin } = require('../middleware/auth');

// ==================== ROUTES PRINCIPALES ====================
router.get('/', auth, isAdmin, vimeoCodeController.list);
router.get('/create', auth, isAdmin, vimeoCodeController.createForm);
router.post('/create', auth, isAdmin, vimeoCodeController.create);
router.get('/edit/:id', auth, isAdmin, vimeoCodeController.editForm);
router.put('/update/:id', auth, isAdmin, vimeoCodeController.update);
router.delete('/delete/:id', auth, isAdmin, vimeoCodeController.delete);

// ==================== ACTIONS SPÉCIALES ====================
router.post('/generate', auth, isAdmin, vimeoCodeController.generate);
router.post('/mark-used/:id', auth, isAdmin, vimeoCodeController.markAsUsed);
router.post('/mark-active/:id', auth, isAdmin, vimeoCodeController.markAsActive);

// ==================== REELS (Section vidéos courtes) ====================
router.get('/reel/create', auth, isAdmin, vimeoCodeController.createReelForm);
router.post('/reel/create', auth, isAdmin, vimeoCodeController.createReel);

// ==================== API REELS ====================
router.get('/api/reels', auth, vimeoCodeController.getReels);
router.get('/api/reels/ids', auth, vimeoCodeController.getReelIds);
router.get('/api/reels/:code', auth, vimeoCodeController.getReelByCode);
router.put('/api/reels/:code', auth, isAdmin, vimeoCodeController.updateReel);
router.delete('/api/reels/:code', auth, isAdmin, vimeoCodeController.deleteReel);

// ==================== API POUR APPLICATION MOBILE ====================
router.get('/api/verify/:code', auth, vimeoCodeController.verifyVimeoCode);
router.post('/api/use', auth, vimeoCodeController.useVimeoCode);
router.get('/api/video/:code', auth, vimeoCodeController.getVideoByVimeoCode);
router.get('/api/active', auth, vimeoCodeController.getActiveVimeoCodes);
// ==================== UPLOAD REELS (comme content) ====================
router.get('/upload', auth, isAdmin, vimeoCodeController.uploadForm);
router.post('/upload/url', auth, isAdmin, vimeoCodeController.uploadReelByUrl);
router.post('/upload/file', auth, isAdmin, vimeoCodeController.uploadReelByFile);

module.exports = router;