const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { auth, isAdmin } = require('../middleware/auth');

// Journal d'activité (admin et super_admin)
router.get('/', auth, isAdmin, activityController.showActivityLog);
router.get('/api/entity/:entityType/:entityId', auth, activityController.getEntityActivities);
router.get('/api/user/:userId', auth, activityController.getUserActivities);

module.exports = router;