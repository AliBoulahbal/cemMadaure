const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');

// Middleware pour vérifier que l'utilisateur est admin
router.use(auth);
router.use(isAdmin);

// Route pour le dashboard d'approbation
router.get('/dashboard', (req, res) => {
  res.redirect('/approval');
});

router.get('/', async (req, res) => {
  try {
    const Unit = require('../models/Unit');
    const Lesson = require('../models/Lesson');
    const Subject = require('../models/Subject');
    const Content = require('../models/Content');
    
    const stats = {
      pendingUnits: await Unit.countDocuments({ status: 'PENDING' }),
      pendingLessons: await Lesson.countDocuments({ status: 'PENDING' }),
      pendingSubjects: await Subject.countDocuments({ status: 'PENDING' }),
      pendingContents: await Content.countDocuments({ status: 'PENDING' })
    };
    
    // Récupérer les éléments récents
    const pendingItems = [];
    
    const units = await Unit.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    units.forEach(u => pendingItems.push({ ...u, type: 'unit', typeName: 'وحدة' }));
    
    const lessons = await Lesson.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    lessons.forEach(l => pendingItems.push({ ...l, type: 'lesson', typeName: 'درس' }));
    
    const subjects = await Subject.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    subjects.forEach(s => pendingItems.push({ ...s, type: 'subject', typeName: 'مادة' }));
    
    const contents = await Content.find({ status: 'PENDING' })
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    contents.forEach(c => pendingItems.push({ ...c, type: 'content', typeName: 'محتوى' }));
    
    pendingItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.render('approval/dashboard', {
      title: 'لوحة المراجعة',
      stats: stats,
      pendingItems: pendingItems.slice(0, 10)
    });
  } catch (error) {
    console.error(error);
    res.render('approval/dashboard', { 
      error: error.message, 
      stats: {}, 
      pendingItems: [] 
    });
  }
});

// Route pour les contenus en attente (garde pour compatibilité)
router.get('/pending', async (req, res) => {
  try {
    const Content = require('../models/Content');
    const contents = await Content.find({ status: 'PENDING' })
      .populate('lessonId', 'name')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .lean();
    
    res.render('content/pending', {
      title: 'المحتوى قيد المراجعة',
      contents: contents,
      stats: { pending: contents.length }
    });
  } catch (error) {
    res.render('content/pending', { error: error.message, contents: [] });
  }
});

// Route API pour le comptage
router.get('/api/pending-count', async (req, res) => {
  try {
    const Content = require('../models/Content');
    const count = await Content.countDocuments({ status: 'PENDING' });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approuver un contenu
router.put('/content/:contentId', async (req, res) => {
  try {
    const Content = require('../models/Content');
    const { contentId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    
    content.status = status;
    if (status === 'PUBLISHED') {
      content.approvedBy = req.session.user.id;
      content.approvedAt = new Date();
      content.rejectionReason = '';
    } else if (status === 'REJECTED') {
      content.rejectionReason = rejectionReason || '';
    }
    
    await content.save();
    res.json({ success: true, message: status === 'PUBLISHED' ? 'Contenu publié' : 'Contenu rejeté' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approuver une matière (Subject)
router.put('/subject/:subjectId', async (req, res) => {
  try {
    const Subject = require('../models/Subject');
    const { subjectId } = req.params;
    const { status, rejectionReason } = req.body;

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ success: false, error: 'المادة غير موجودة' });
    }

    subject.status = status;
    if (status === 'PUBLISHED') {
      subject.approvedBy = req.session.user.id;
      subject.approvedAt = new Date();
      subject.rejectionReason = '';
    } else if (status === 'REJECTED') {
      subject.rejectionReason = rejectionReason || '';
    }

    await subject.save();
    res.json({ success: true, message: status === 'PUBLISHED' ? 'تم نشر المادة' : 'تم رفض المادة' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approuver une leçon (Lesson)
router.put('/lesson/:lessonId', async (req, res) => {
  try {
    const Lesson = require('../models/Lesson');
    const { lessonId } = req.params;
    const { status, rejectionReason } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'الدرس غير موجود' });
    }

    lesson.status = status;
    if (status === 'PUBLISHED') {
      lesson.approvedBy = req.session.user.id;
      lesson.approvedAt = new Date();
      lesson.rejectionReason = '';
    } else if (status === 'REJECTED') {
      lesson.rejectionReason = rejectionReason || '';
    }

    await lesson.save();
    res.json({ success: true, message: status === 'PUBLISHED' ? 'تم نشر الدرس' : 'تم رفض الدرس' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Approuver une unité (Unit)
router.put('/unit/:unitId', async (req, res) => {
  try {
    const Unit = require('../models/Unit');
    const { unitId } = req.params;
    const { status, rejectionReason } = req.body;

    const unit = await Unit.findById(unitId);
    if (!unit) {
      return res.status(404).json({ success: false, error: 'الوحدة غير موجودة' });
    }

    unit.status = status;
    if (status === 'PUBLISHED') {
      unit.approvedBy = req.session.user.id;
      unit.approvedAt = new Date();
      unit.rejectionReason = '';
    } else if (status === 'REJECTED') {
      unit.rejectionReason = rejectionReason || '';
    }

    await unit.save();
    res.json({ success: true, message: status === 'PUBLISHED' ? 'تم نشر الوحدة' : 'تم رفض الوحدة' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;