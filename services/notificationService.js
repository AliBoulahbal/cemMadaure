const Notification = require('../models/Notification');
const DashboardUser = require('../models/DashboardUser');

class NotificationService {
  // Créer une notification
  async create(data) {
    try {
      const notification = new Notification(data);
      await notification.save();
      
      // Émettre un événement socket.io si disponible
      if (global.io) {
        global.io.to(`user-${data.userId}`).emit('new-notification', notification);
      }
      
      return notification;
    } catch (error) {
      console.error('Erreur création notification:', error);
      return null;
    }
  }
  
  // Notifier un utilisateur spécifique
  async notifyUser(userId, type, title, message, entityType, entityId, entityName, actionUrl, metadata = {}) {
    return this.create({
      userId,
      type,
      title,
      message,
      entityType,
      entityId,
      entityName,
      actionUrl,
      metadata
    });
  }
  
  // Notifier tous les admins
  async notifyAdmins(type, title, message, entityType, entityId, entityName, actionUrl) {
    const admins = await DashboardUser.find({ role: { $in: ['admin', 'super_admin'] } });
    const notifications = [];
    
    for (const admin of admins) {
      const notif = await this.create({
        userId: admin._id,
        type,
        title,
        message,
        entityType,
        entityId,
        entityName,
        actionUrl
      });
      notifications.push(notif);
    }
    
    return notifications;
  }
  
  // Notifier le créateur d'un contenu
  async notifyCreator(content, type, message, actionUrl) {
    if (content.createdBy) {
      return this.create({
        userId: content.createdBy,
        type,
        title: type === 'content_approved' ? '✅ Contenu approuvé' : '❌ Contenu rejeté',
        message,
        entityType: 'CONTENT',
        entityId: content._id,
        entityName: content.title,
        actionUrl
      });
    }
    return null;
  }
  
  // Récupérer les notifications d'un utilisateur
  async getUserNotifications(userId, limit = 20, skip = 0) {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }
  
  // Compter les notifications non lues
  async countUnread(userId) {
    return await Notification.countDocuments({ userId, isRead: false });
  }
  
  // Marquer comme lu
  async markAsRead(notificationId, userId) {
    return await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, isSeen: true },
      { new: true }
    );
  }
  
  // Marquer toutes comme lues
  async markAllAsRead(userId) {
    return await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true, isSeen: true }
    );
  }
  
  // Supprimer une notification
  async delete(notificationId, userId) {
    return await Notification.findOneAndDelete({ _id: notificationId, userId });
  }
  
  // Supprimer toutes les notifications d'un utilisateur
  async deleteAll(userId) {
    return await Notification.deleteMany({ userId });
  }
}

module.exports = new NotificationService();