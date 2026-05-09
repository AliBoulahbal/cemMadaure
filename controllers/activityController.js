const activityService = require('../services/activityService');
const DashboardUser = require('../models/DashboardUser');

// Afficher le journal d'activité
exports.showActivityLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const filters = {
      action: req.query.action,
      entityType: req.query.entityType,
      userId: req.query.userId
    };
    
    const result = await activityService.getAllActivities(page, 50, filters);
    const users = await DashboardUser.find().select('username fullName role').lean();
    
    res.render('activity/log', {
      title: 'Journal d\'activité',
      activities: result.activities,
      pagination: {
        current: result.page,
        total: result.pages,
        hasNext: result.page < result.pages,
        hasPrev: result.page > 1
      },
      filters,
      users
    });
  } catch (error) {
    console.error(error);
    res.render('activity/log', { error: error.message, activities: [] });
  }
};

// API: Obtenir les activités d'une entité
exports.getEntityActivities = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const activities = await activityService.getEntityActivities(entityType, entityId, 20);
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// API: Obtenir les activités d'un utilisateur
exports.getUserActivities = async (req, res) => {
  try {
    const { userId } = req.params;
    const activities = await activityService.getUserActivities(userId, 20);
    res.json({ success: true, activities });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};