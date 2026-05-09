const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

// Page principale
router.get('/', auth, notificationController.getNotifications);

// Routes API
router.get('/api/list', auth, notificationController.apiGetNotifications);
router.get('/api/count', auth, notificationController.apiCountUnread);
router.put('/api/read/:id', auth, notificationController.markAsRead);
router.put('/api/read-all', auth, notificationController.markAllAsRead);
router.delete('/api/delete/:id', auth, notificationController.delete);

module.exports = router;