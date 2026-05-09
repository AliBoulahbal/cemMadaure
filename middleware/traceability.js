const activityService = require('../services/activityService');

// Tracer la consultation
const traceView = (entityType) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalSend = res.send;
    
    res.json = function(data) {
      if (req.params.id || req.query.id) {
        activityService.log(req, {
          action: 'VIEW',
          entityType: entityType,
          entityId: req.params.id || req.query.id,
          entityName: data?.name || data?.title || ''
        });
      }
      return originalJson.call(this, data);
    };
    
    res.send = function(data) {
      if (req.params.id || req.query.id) {
        activityService.log(req, {
          action: 'VIEW',
          entityType: entityType,
          entityId: req.params.id || req.query.id
        });
      }
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Tracer la création
const traceCreate = (entityType, getEntityName) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    const originalRedirect = res.redirect;
    
    res.json = function(data) {
      if (data && data._id) {
        activityService.log(req, {
          action: 'CREATE',
          entityType: entityType,
          entityId: data._id,
          entityName: getEntityName ? getEntityName(data) : (data.name || data.title),
          newData: req.body
        });
      }
      return originalJson.call(this, data);
    };
    
    res.redirect = function(url) {
      activityService.log(req, {
        action: 'CREATE',
        entityType: entityType,
        entityId: req.body._id || Date.now().toString(),
        entityName: getEntityName ? getEntityName(req.body) : (req.body.name || req.body.title),
        newData: req.body
      });
      return originalRedirect.call(this, url);
    };
    
    next();
  };
};

// Tracer la modification
const traceUpdate = (entityType, getEntityName) => {
  return async (req, res, next) => {
    const Model = require(`../models/${entityType}`);
    const oldData = await Model.findById(req.params.id).lean();
    
    const originalRedirect = res.redirect;
    const originalJson = res.json;
    
    res.json = function(data) {
      activityService.log(req, {
        action: 'UPDATE',
        entityType: entityType,
        entityId: req.params.id,
        entityName: getEntityName ? getEntityName(oldData) : (oldData?.name || oldData?.title),
        oldData: oldData,
        newData: req.body
      });
      return originalJson.call(this, data);
    };
    
    res.redirect = function(url) {
      activityService.log(req, {
        action: 'UPDATE',
        entityType: entityType,
        entityId: req.params.id,
        entityName: getEntityName ? getEntityName(oldData) : (oldData?.name || oldData?.title),
        oldData: oldData,
        newData: req.body
      });
      return originalRedirect.call(this, url);
    };
    
    next();
  };
};

// Tracer la suppression
const traceDelete = (entityType, getEntityName) => {
  return async (req, res, next) => {
    const Model = require(`../models/${entityType}`);
    const oldData = await Model.findById(req.params.id).lean();
    
    const originalRedirect = res.redirect;
    
    res.redirect = function(url) {
      activityService.log(req, {
        action: 'DELETE',
        entityType: entityType,
        entityId: req.params.id,
        entityName: getEntityName ? getEntityName(oldData) : (oldData?.name || oldData?.title),
        oldData: oldData
      });
      return originalRedirect.call(this, url);
    };
    
    next();
  };
};

module.exports = { traceView, traceCreate, traceUpdate, traceDelete };