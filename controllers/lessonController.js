const Lesson = require('../models/Lesson');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const traceabilityService = require('../services/traceabilityService');

// Vérifier les permissions
const canCreate = (user) => ['super_admin', 'admin', 'teacher'].includes(user?.role);
const canEdit = (user, lesson) => {
  if (['super_admin', 'admin'].includes(user?.role)) return true;
  if (user?.role === 'teacher' && lesson?.createdBy?.toString() === user?.id) return true;
  return false;
};
const canDelete = (user) => ['super_admin', 'admin'].includes(user?.role);
const needsApproval = (user) => user?.role === 'teacher';

// Liste des leçons
exports.list = async (req, res) => {
  try {
    let query = {};
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    
    // Les teachers voient seulement leurs leçons + les leçons publiées
    if (userRole === 'teacher') {
      query = {
        $or: [
          { createdBy: userId },
          { status: 'PUBLISHED' }
        ]
      };
    }
    
    const lessons = await Lesson.find(query)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .sort({ order: 1 })
      .lean();
    
    res.render('lesson/list', { 
      title: 'الدروس', 
      lessons: lessons,
      userRole: userRole
    });
  } catch (error) {
    console.error(error);
    res.render('lesson/list', { error: error.message, lessons: [] });
  }
};

// Formulaire de création
exports.createForm = async (req, res) => {
  try {
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء دروس');
      return res.redirect('/lesson');
    }
    
    const branches = await Branch.find().sort({ name: 1 }).lean();
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    const units = await Unit.find().sort({ name: 1 }).lean();
    
    res.render('lesson/create', { 
      title: 'إضافة درس جديد',
      branches: branches,
      subjects: subjects,
      units: units
    });
  } catch (error) {
    console.error(error);
    res.render('lesson/create', { error: error.message, branches: [], subjects: [], units: [] });
  }
};

// Créer une leçon
exports.create = async (req, res) => {
  try {
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء دروس');
      return res.redirect('/lesson');
    }
    
    const { name, branchId, subjectId, unitId, order, description, isFree, duration, videoUrl } = req.body;
    
    // Déterminer le statut
    const needsPub = needsApproval(req.session.user);
    const status = needsPub ? 'PENDING' : 'PUBLISHED';
    
    const newLesson = await Lesson.create({
      name,
      branchId,
      subjectId,
      unitId,
      order: parseInt(order) || 0,
      description: description || '',
      isFree: isFree === 'on',
      duration: parseInt(duration) || 0,
      videoUrl: videoUrl || '',
      status: status,
      createdBy: req.session.user.id
    });
    
    // Traçabilité
    if (traceabilityService) {
      await traceabilityService.logCreate(req, 'LESSON', newLesson, newLesson.name);
    }
    
    if (needsPub) {
      req.flash('warning', '✅ تم إنشاء الدرس بنجاح. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم إضافة الدرس بنجاح');
    }
    
    res.redirect('/lesson');
  } catch (error) {
    console.error(error);
    const branches = await Branch.find().lean();
    const subjects = await Subject.find().lean();
    const units = await Unit.find().lean();
    res.render('lesson/create', { 
      error: error.message,
      branches, subjects, units,
      formData: req.body
    });
  }
};

// Formulaire d'édition
exports.editForm = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).lean();
    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }
    
    if (!canEdit(req.session.user, lesson)) {
      req.flash('error', 'ليس لديك صلاحية تعديل هذا الدرس');
      return res.redirect('/lesson');
    }
    
    const branches = await Branch.find().lean();
    const subjects = await Subject.find().lean();
    const units = await Unit.find().lean();
    
    res.render('lesson/edit', { 
      title: 'تعديل درس',
      lesson, branches, subjects, units
    });
  } catch (error) {
    console.error(error);
    res.redirect('/lesson');
  }
};

// Mettre à jour
exports.update = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }
    
    if (!canEdit(req.session.user, lesson)) {
      req.flash('error', 'ليس لديك صلاحية تعديل هذا الدرس');
      return res.redirect('/lesson');
    }
    
    const oldLesson = lesson.toObject();
    const { name, branchId, subjectId, unitId, order, description, isFree, duration, videoUrl } = req.body;
    
    // Préparer les données de mise à jour
    const updateData = {
      name,
      branchId,
      subjectId,
      unitId,
      order: parseInt(order) || 0,
      description: description || '',
      isFree: isFree === 'on',
      duration: parseInt(duration) || 0,
      videoUrl: videoUrl || '',
      updatedBy: req.session.user.id
    };
    
    // Si c'est un teacher qui modifie une leçon publiée, repasser en attente
    const needsPub = needsApproval(req.session.user);
    if (needsPub && lesson.status === 'PUBLISHED') {
      updateData.status = 'PENDING';
    }
    
    await Lesson.findByIdAndUpdate(req.params.id, updateData);
    const updatedLesson = await Lesson.findById(req.params.id).lean();
    
    // Traçabilité
    if (traceabilityService) {
      await traceabilityService.logUpdate(req, 'LESSON', req.params.id, updatedLesson.name, oldLesson, updatedLesson);
    }
    
    if (needsPub && lesson.status === 'PUBLISHED') {
      req.flash('warning', '✅ تم تعديل الدرس. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم تحديث الدرس بنجاح');
    }
    
    res.redirect('/lesson');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/lesson/edit/${req.params.id}`);
  }
};

// Supprimer (seulement admin et super admin)
exports.delete = async (req, res) => {
  try {
    if (!canDelete(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية حذف الدروس');
      return res.redirect('/lesson');
    }
    
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }
    
    // Traçabilité
    if (traceabilityService) {
      await traceabilityService.logDelete(req, 'LESSON', req.params.id, lesson.name, lesson);
    }
    
    await Lesson.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الدرس بنجاح');
    res.redirect('/lesson');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// Voir détails
exports.view = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .lean();
    
    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }
    
    // Vérifier si l'utilisateur peut voir (teacher ne voit que ses leçons ou publiées)
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    if (userRole === 'teacher' && lesson.createdBy?.toString() !== userId && lesson.status !== 'PUBLISHED') {
      req.flash('error', 'لا يمكنك عرض هذا الدرس');
      return res.redirect('/lesson');
    }
    
    res.render('lesson/view', { title: lesson.name, lesson });
  } catch (error) {
    console.error(error);
    res.redirect('/lesson');
  }
};

// Approuver une leçon (admin et super admin seulement)
exports.approve = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      return res.status(403).json({ success: false, error: 'غير مصرح' });
    }
    
    const { lessonId } = req.params;
    const { status, rejectionReason } = req.body;
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(404).json({ success: false, error: 'الدرس غير موجود' });
    }
    
    const updateData = { status };
    if (status === 'PUBLISHED') {
      updateData.approvedBy = req.session.user.id;
      updateData.approvedAt = new Date();
      updateData.rejectionReason = '';
    } else if (status === 'REJECTED') {
      updateData.rejectionReason = rejectionReason || '';
    }
    
    await Lesson.findByIdAndUpdate(lessonId, updateData);
    
    // Traçabilité
    if (traceabilityService) {
      await traceabilityService.log(req, {
        action: status === 'PUBLISHED' ? 'APPROVE' : 'REJECT',
        entityType: 'LESSON',
        entityId: lessonId,
        entityName: lesson.name,
        newData: { status, rejectionReason }
      });
    }
    
    res.json({ success: true, message: status === 'PUBLISHED' ? 'تم نشر الدرس' : 'تم رفض الدرس' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Liste des leçons en attente (admin et super admin)
exports.pendingLessons = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    if (!['super_admin', 'admin'].includes(userRole)) {
      req.flash('error', 'غير مصرح');
      return res.redirect('/lesson');
    }
    
    const lessons = await Lesson.find({ status: 'PENDING' })
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 })
      .lean();
    
    res.render('lesson/pending', {
      title: 'الدروس قيد المراجعة',
      lessons: lessons
    });
  } catch (error) {
    console.error(error);
    res.render('lesson/pending', { error: error.message, lessons: [] });
  }
};