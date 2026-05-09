const Progression = require('../models/Progression');
const Lesson = require('../models/Lesson');

// Sauvegarder la progression d'un utilisateur
exports.saveProgression = async (req, res) => {
  try {
    const { clientId, unitId, lessonId, progressionsPart } = req.body;
    
    console.log('📊 Sauvegarde progression:', { clientId, unitId, lessonId });
    
    if (!clientId || !lessonId || !progressionsPart) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données incomplètes' 
      });
    }
    
    // Vérifier si la progression existe déjà
    let progression = await Progression.findOne({ clientId, lessonId });
    
    if (!progression) {
      progression = new Progression({
        clientId,
        lessonId,
        unitId,
        progressionsPart: []
      });
    }
    
    // Mettre à jour ou ajouter les parties
    for (const part of progressionsPart) {
      const existingPart = progression.progressionsPart.find(p => 
        p._id?.toString() === part.id || p.partId === part.id
      );
      
      if (existingPart) {
        existingPart.percentage = part.percentage;
        existingPart.lastUpdated = new Date();
        if (part.percentage >= 100) {
          existingPart.completedAt = new Date();
        }
      } else {
        progression.progressionsPart.push({
          _id: part.id,
          partId: part.id,
          percentage: part.percentage,
          lastUpdated: new Date(),
          completedAt: part.percentage >= 100 ? new Date() : null
        });
      }
    }
    
    // Calculer le pourcentage global
    const totalPercentage = progression.progressionsPart.reduce((sum, p) => sum + (p.percentage || 0), 0);
    const overallPercentage = progression.progressionsPart.length > 0 
      ? Math.min(Math.round(totalPercentage / progression.progressionsPart.length), 100) 
      : 0;
    
    progression.overallPercentage = overallPercentage;
    progression.lastAccessed = new Date();
    
    if (overallPercentage >= 100) {
      progression.completedAt = new Date();
    }
    
    await progression.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Progression sauvegardée',
      overallPercentage: overallPercentage
    });
  } catch (error) {
    console.error('Erreur saveProgression:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer la progression d'un utilisateur pour une leçon
exports.getProgression = async (req, res) => {
  try {
    const { clientId, lessonId } = req.params;
    
    const progression = await Progression.findOne({ clientId, lessonId }).lean();
    
    if (!progression) {
      return res.json({
        success: true,
        overallPercentage: 0,
        progressionsPart: []
      });
    }
    
    res.json({
      success: true,
      overallPercentage: progression.overallPercentage || 0,
      progressionsPart: progression.progressionsPart.map(p => ({
        id: p._id?.toString() || p.partId,
        percentage: p.percentage,
        completedAt: p.completedAt,
        lastUpdated: p.lastUpdated
      })),
      lastAccessed: progression.lastAccessed,
      completedAt: progression.completedAt
    });
  } catch (error) {
    console.error('Erreur getProgression:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer la progression d'un utilisateur pour une unité
exports.getUnitProgression = async (req, res) => {
  try {
    const { clientId, unitId } = req.params;
    
    const progressions = await Progression.find({ clientId, unitId })
      .populate('lessonId', 'name order')
      .lean();
    
    const lessonsProgress = progressions.map(p => ({
      lessonId: p.lessonId?._id || p.lessonId,
      lessonName: p.lessonId?.name || '',
      lessonOrder: p.lessonId?.order || 0,
      overallPercentage: p.overallPercentage || 0,
      completedAt: p.completedAt,
      lastAccessed: p.lastAccessed
    }));
    
    const totalLessons = lessonsProgress.length;
    const totalPercentage = lessonsProgress.reduce((sum, l) => sum + l.overallPercentage, 0);
    const unitPercentage = totalLessons > 0 ? Math.round(totalPercentage / totalLessons) : 0;
    
    res.json({
      success: true,
      unitPercentage: unitPercentage,
      lessons: lessonsProgress
    });
  } catch (error) {
    console.error('Erreur getUnitProgression:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Récupérer la progression globale d'un utilisateur
exports.getGlobalProgression = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const progressions = await Progression.find({ clientId })
      .populate('lessonId', 'name subjectId branchId')
      .populate('unitId', 'name')
      .lean();
    
    const stats = {
      totalLessons: progressions.length,
      completedLessons: progressions.filter(p => p.overallPercentage >= 100).length,
      averagePercentage: progressions.length > 0 
        ? Math.round(progressions.reduce((sum, p) => sum + p.overallPercentage, 0) / progressions.length)
        : 0,
      lessons: progressions.map(p => ({
        lessonId: p.lessonId?._id || p.lessonId,
        lessonName: p.lessonId?.name || '',
        unitName: p.unitId?.name || '',
        percentage: p.overallPercentage || 0,
        completedAt: p.completedAt
      }))
    };
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Erreur getGlobalProgression:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};