const Unit = require('../models/Unit');
const Lesson = require('../models/Lesson');
const Subject = require('../models/Subject');
const Content = require('../models/Content');

// Tableau de bord d'approbation unifié
exports.dashboard = async (req, res) => {
  try {
    const stats = {
      pendingUnits: await Unit.countDocuments({ status: 'PENDING' }),
      pendingLessons: await Lesson.countDocuments({ status: 'PENDING' }),
      pendingSubjects: await Subject.countDocuments({ status: 'PENDING' }),
      pendingContents: await Content.countDocuments({ status: 'PENDING' })
    };
    
    // Récupérer les 5 derniers éléments en attente
    const recentPending = [];
    
    // Unités en attente
    const units = await Unit.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    units.forEach(u => recentPending.push({ ...u, type: 'unit', typeName: 'وحدة' }));
    
    // Leçons en attente
    const lessons = await Lesson.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    lessons.forEach(l => recentPending.push({ ...l, type: 'lesson', typeName: 'درس' }));
    
    // Matières en attente
    const subjects = await Subject.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    subjects.forEach(s => recentPending.push({ ...s, type: 'subject', typeName: 'مادة' }));
    
    // Contenus en attente
    const contents = await Content.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    contents.forEach(c => recentPending.push({ ...c, type: 'content', typeName: 'محتوى' }));
    
    // Trier par date
    recentPending.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.render('approval/dashboard', {
      title: 'لوحة المراجعة',
      stats: stats,
      pendingItems: recentPending.slice(0, 10)
    });
  } catch (error) {
    console.error(error);
    res.render('approval/dashboard', { error: error.message, stats: {}, pendingItems: [] });
  }
};