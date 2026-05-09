const express = require('express');
const router = express.Router();
const mobileController = require('../controllers/mobileController');
const jwt = require('jsonwebtoken');

// ─────────────────────────────────────────────────────────────────────────────
// Middleware JWT mobile
// Décode le token Bearer et met req.user = { clientId, deviceId, signed, ... }
// Ne bloque PAS la requête si le token est absent ou invalide (permissif)
// — les routes publiques continuent, les routes FULL auront req.user = null
// ─────────────────────────────────────────────────────────────────────────────
function decodeMobileToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'] || req.headers['Authorization'];
    if (!authHeader) return next();

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : authHeader;

    if (!token) return next();

    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'secret-key');
    req.user = decoded; // { clientId, deviceId, signed, contractId, ... }
  } catch (e) {
    // token invalide ou expiré — on continue sans req.user
  }
  next();
}

// Appliquer le middleware JWT à toutes les routes mobiles
router.use(decodeMobileToken);

// ==================== AUTHENTIFICATION ====================
router.get('/v1/token/:deviceId', mobileController.getToken);

// ==================== CLIENT ====================
router.post('/v1/client', mobileController.createClient);
router.get('/v1/client/:clientId', mobileController.getClient);
router.put('/v1/client/:clientId', mobileController.updateClient);

// ==================== BRANCHES ====================
router.get('/v1/branches', mobileController.getBranches);

// ==================== SUBJECTS ====================
router.get('/v1/subject/by-branch/:branchId', mobileController.getSubjectsByBranch);
router.get('/v1/subject/all', mobileController.getAllSubjects);
router.get('/v1/subject/grouped', mobileController.getSubjectsGroupedByBranch);

// ==================== UNITS ====================
router.get('/v1/units/:subjectId', mobileController.getUnitsBySubjectId);

// ==================== LESSONS ====================
router.get('/v1/lesson/:subjectId', mobileController.getLessonsBySubjectId);
router.get('/v1/lesson/ordered/:subjectId', mobileController.getLessonsBySubjectIdOrderedByUnitOrder);
router.get('/v1/lesson/unit/:subjectId', mobileController.getLessonsBySubjectIdOrderByCreateDate);
router.get('/v1/lesson/free/:subjectId', mobileController.getLessonsBySubjectIdForFree);
router.get('/v1/lesson/details/:lessonId', mobileController.getLessonDetails);
router.get('/v1/content/by-lesson/:lessonId', mobileController.getLessonPartsByLessonId);

// ==================== LESSON PARTS (LessonPart Model) ====================
router.get('/v1/lesson-part/by-lesson/:lessonId', mobileController.getLessonPartsByLessonId);
router.get('/v1/lesson-part/:partId', mobileController.getLessonPartById);

// ==================== QUIZ ====================
router.get('/v1/quiz/:lessonId', mobileController.getQuizByLesson);
router.get('/v1/quiz/:lessonId/:clientId', mobileController.getQuizListByLessonId);
router.post('/v1/quiz', mobileController.submitQuizAttempt);
router.put('/v1/quiz', mobileController.updateQuizAttempt);
// Ajoutez ces routes à votre fichier mobileRoutes.js

// Routes Quiz History
router.get('/v1/quiz/history/:clientId/:lessonId', mobileController.getQuizHistory);

// ==================== TEACHERS ====================
router.get('/v1/prof', mobileController.getFreeTeachers);
router.get('/v1/prof/branch/:branchId', mobileController.getTeachersByBranch);

// ==================== PROGRESSION ====================
router.post('/v1/progression', mobileController.saveProgression);
router.get('/v1/progression', mobileController.getAllProgressions);
router.get('/v1/progression/:clientId/:lessonId', mobileController.getProgression);

// ==================== KEY & CONTRACT ====================
router.post('/v1/key/:key', mobileController.checkKeyValidation);
router.post('/v1/contract', mobileController.createNewContract);
router.delete('/v1/contract', mobileController.deleteContract);

// ==================== OTP ====================
router.post('/v1/otp', mobileController.requestOtp);

// ==================== VIMEO ====================
router.get('/v1/vimeo', mobileController.getVimeoIds);

// ==================== REELS (Section Shorts) ====================
router.get('/v1/reels', mobileController.getReels);
router.get('/v1/reels/page/:page', mobileController.getReelsPaginated);
router.get('/v1/reels/next/:currentId', mobileController.getNextReel);
router.get('/v1/reels/ids', mobileController.getReelIds);
router.get('/v1/reels/code/:code', mobileController.getReelByCode);

// ==================== VIMEO CODE ====================
router.get('/v1/vimeo-code/verify/:code', mobileController.verifyVimeoCode);
router.post('/v1/vimeo-code/use', mobileController.useVimeoCode);
router.get('/v1/vimeo-code/video/:code', mobileController.getVideoByVimeoCode);
router.get('/v1/vimeo-code/active', mobileController.getActiveVimeoCodes);

// ==================== STATS ====================
router.get('/v1/stats', mobileController.getStats);

// ==================== PROXY WASABI ====================
router.get('/v1/proxy', mobileController.proxyWasabi);


module.exports = router;