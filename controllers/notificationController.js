const notificationService = require('../services/notificationService');

// Récupérer les notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const notifications = await notificationService.getUserNotifications(userId, limit, skip);
    const unreadCount = await notificationService.countUnread(userId);
    const total = await require('../models/Notification').countDocuments({ userId });
    
    res.render('notifications/index', {
      title: 'الإشعارات',
      notifications,
      unreadCount,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error(error);
    res.render('notifications/index', { error: error.message, notifications: [] });
  }
};

// API: Récupérer les notifications (AJAX)
exports.apiGetNotifications = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const limit = parseInt(req.query.limit) || 10;
    const notifications = await notificationService.getUserNotifications(userId, limit);
    const unreadCount = await notificationService.countUnread(userId);
    
    res.json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Marquer comme lu
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    await notificationService.markAsRead(id, userId);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/notifications');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Marquer toutes comme lues
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.session.user.id;
    await notificationService.markAllAsRead(userId);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/notifications');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Supprimer une notification
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.user.id;
    
    await notificationService.delete(id, userId);
    
    if (req.xhr || req.headers.accept?.includes('application/json')) {
      res.json({ success: true });
    } else {
      res.redirect('/notifications');
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// API: Compter les notifications non lues
exports.apiCountUnread = async (req, res) => {
  try {
    const userId = req.session.user.id;
    const count = await notificationService.countUnread(userId);
    res.json({ success: true, count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};