const ActivityLog = require('../models/ActivityLog');

class TraceabilityService {
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
        ipAddress: req.ip || req.connection?.remoteAddress,
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
  
  async logCreate(req, entityType, entity, entityName) {
    return this.log(req, {
      action: 'CREATE',
      entityType: entityType,
      entityId: entity._id.toString(),
      entityName: entityName,
      newData: entity
    });
  }
  
  async logUpdate(req, entityType, entityId, entityName, oldData, newData) {
    return this.log(req, {
      action: 'UPDATE',
      entityType: entityType,
      entityId: entityId,
      entityName: entityName,
      oldData: oldData,
      newData: newData
    });
  }
  
  async logDelete(req, entityType, entityId, entityName, oldData) {
    return this.log(req, {
      action: 'DELETE',
      entityType: entityType,
      entityId: entityId,
      entityName: entityName,
      oldData: oldData
    });
  }
}

module.exports = new TraceabilityService();