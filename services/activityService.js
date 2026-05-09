const ActivityLog = require('../models/ActivityLog');

class ActivityService {
  // Enregistrer une activité
  async log(req, data) {
    try {
      const log = new ActivityLog({
        userId: req.session.user.id,
        username: req.session.user.username,
        userRole: req.session.user.role,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        entityName: data.entityName || '',
        oldData: data.oldData || null,
        newData: data.newData || null,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'] || '',
        status: data.status || 'APPROVED'
      });
      
      await log.save();
      return log;
    } catch (error) {
      console.error('Activity log error:', error);
      return null;
    }
  }
  
  // Récupérer les activités d'un utilisateur
  async getUserActivities(userId, limit = 50) {
    return await ActivityLog.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
  
  // Récupérer les activités par entité
  async getEntityActivities(entityType, entityId, limit = 50) {
    return await ActivityLog.find({ entityType, entityId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
  
  // Récupérer toutes les activités (admin)
  async getAllActivities(page = 1, limit = 50, filters = {}) {
    const query = {};
    if (filters.action) query.action = filters.action;
    if (filters.entityType) query.entityType = filters.entityType;
    if (filters.userId) query.userId = filters.userId;
    
    const activities = await ActivityLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    const total = await ActivityLog.countDocuments(query);
    
    return {
      activities,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }
}

module.exports = new ActivityService();