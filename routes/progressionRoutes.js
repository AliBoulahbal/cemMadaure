const express = require('express');
const router = express.Router();
const progressionController = require('../controllers/progressionController');

// Routes API pour la progression
router.post('/save', progressionController.saveProgression);
router.get('/:clientId/:lessonId', progressionController.getProgression);
router.get('/unit/:clientId/:unitId', progressionController.getUnitProgression);
router.get('/global/:clientId', progressionController.getGlobalProgression);

module.exports = router;