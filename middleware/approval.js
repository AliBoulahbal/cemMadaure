const Content = require('../models/Content');

// Vérifier si l'utilisateur peut publier
const canPublish = (req, res, next) => {
  const userRole = req.session.user?.role;
  
  if (userRole === 'super_admin' || userRole === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Seul un administrateur peut publier du contenu'
    });
  }
};

// Vérifier si l'utilisateur peut approuver
const canApprove = (req, res, next) => {
  const userRole = req.session.user?.role;
  
  if (userRole === 'super_admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      error: 'Seul le super administrateur peut approuver le contenu'
    });
  }
};

// Middleware pour les contenus en attente
const requireApproval = (req, res, next) => {
  const userRole = req.session.user?.role;
  
  if (userRole === 'super_admin' || userRole === 'admin') {
    // Les admins peuvent voir tout le contenu
    next();
  } else {
    // Les teachers voient seulement leur contenu approuvé
    req.query.status = 'PUBLISHED';
    next();
  }
};

// Approuver un contenu
const approveContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    
    content.status = status;
    if (status === 'APPROVED' || status === 'PUBLISHED') {
      content.approvedBy = req.session.user.id;
      content.approvedAt = new Date();
      content.rejectionReason = '';
    } else if (status === 'REJECTED') {
      content.rejectionReason = rejectionReason || '';
    }
    
    await content.save();
    
    // Enregistrer l'activité
    const activityService = require('../services/activityService');
    await activityService.log(req, {
      action: status === 'PUBLISHED' ? 'PUBLISH' : (status === 'REJECTED' ? 'REJECT' : 'APPROVE'),
      entityType: 'CONTENT',
      entityId: contentId,
      entityName: content.title,
      newData: { status, rejectionReason }
    });
    
    res.json({ success: true, message: 'Contenu mis à jour', content });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtenir les contenus en attente
const getPendingContents = async (req, res) => {
  try {
    const contents = await Content.find({ status: 'PENDING' })
      .populate('lessonId', 'name')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .lean();
    
    res.render('content/pending', {
      title: 'Contenus en attente',
      contents: contents
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { canPublish, canApprove, requireApproval, approveContent, getPendingContents };