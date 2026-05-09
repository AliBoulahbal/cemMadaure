const Unit = require('../models/Unit');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');
const Lesson = require('../models/Lesson');
const traceabilityService = require('../services/traceabilityService');

// Vérifier les permissions
const canCreate = (user) => ['super_admin', 'admin', 'teacher'].includes(user?.role);
const canEdit = (user) => ['super_admin', 'admin', 'teacher'].includes(user?.role);
const canDelete = (user) => ['super_admin', 'admin'].includes(user?.role);
const needsApproval = (user) => user?.role === 'teacher';

// Liste des unités
exports.list = async (req, res) => {
  try {
    let query = {};
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    
    // Les teachers voient seulement leurs unités + les unités publiées
    if (userRole === 'teacher') {
      query = {
        $or: [
          { createdBy: userId },
          { status: 'PUBLISHED' }
        ]
      };
    }
    
    const units = await Unit.find(query)
      .populate('subjectId', 'name')
      .populate('branchId', 'name')
      .sort({ branchId: 1, order: 1 })
      .lean();
    
    const unitsWithNames = units.map(unit => ({
      ...unit,
      anneeNom: unit.branchId?.name || 'غير محدد',
      matiereNom: unit.subjectId?.name || 'غير محدد'
    }));
    
    res.render('unit/list', { 
      title: 'الوحدات', 
      units: unitsWithNames,
      userRole: userRole
    });
  } catch (error) {
    console.error(error);
    res.render('unit/list', { error: error.message, units: [] });
  }
};

// Formulaire de création - ACCESSIBLE AUX TEACHERS
exports.createForm = async (req, res) => {
  try {
    console.log('createForm - User role:', req.session.user?.role);
    
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء وحدات');
      return res.redirect('/unit');
    }
    
    const branches = await Branch.find().sort({ name: 1 }).lean();
    const subjects = await Subject.find().sort({ name: 1 }).lean();
    const lastUnit = await Unit.findOne().sort({ order: -1 });
    const nextOrder = lastUnit ? lastUnit.order + 1 : 1;
    
    console.log('Branches:', branches.length, 'Subjects:', subjects.length);
    
    res.render('unit/create', { 
      title: 'إضافة وحدة جديدة',
      branches: branches,
      subjects: subjects,
      nextOrder: nextOrder
    });
  } catch (error) {
    console.error('Erreur createForm:', error);
    res.render('unit/create', { 
      error: error.message, 
      branches: [], 
      subjects: [] 
    });
  }
};

// Créer une unité - ACCESSIBLE AUX TEACHERS
exports.create = async (req, res) => {
  try {
    console.log('create - User role:', req.session.user?.role);
    
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء وحدات');
      return res.redirect('/unit');
    }
    
    const { name, branchId, subjectId, order, description } = req.body;
    
    if (!name || !branchId || !subjectId) {
      const branches = await Branch.find().lean();
      const subjects = await Subject.find().lean();
      return res.render('unit/create', { 
        error: 'جميع الحقول المطلوبة يجب تعبئتها',
        branches, subjects
      });
    }
    
    const needsPub = needsApproval(req.session.user);
    const status = needsPub ? 'PENDING' : 'PUBLISHED';
    
    const newUnit = await Unit.create({
      name: name.trim(),
      branchId,
      subjectId,
      order: parseInt(order) || 0,
      description: description || '',
      status: status,
      createdBy: req.session.user.id
    });
    
    if (traceabilityService) {
      await traceabilityService.logCreate(req, 'UNIT', newUnit, newUnit.name);
    }
    
    if (needsPub) {
      req.flash('warning', '✅ تم إضافة الوحدة. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم إضافة الوحدة بنجاح');
    }
    
    res.redirect('/unit');
  } catch (error) {
    console.error('Erreur create:', error);
    const branches = await Branch.find().lean();
    const subjects = await Subject.find().lean();
    res.render('unit/create', { error: error.message, branches, subjects });
  }
};

// Formulaire d'édition
exports.editForm = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id).lean();
    if (!unit) {
      req.flash('error', 'الوحدة غير موجودة');
      return res.redirect('/unit');
    }
    
    if (!canEdit(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية تعديل هذه الوحدة');
      return res.redirect('/unit');
    }
    
    const branches = await Branch.find().lean();
    const subjects = await Subject.find().lean();
    
    res.render('unit/edit', { 
      title: 'تعديل وحدة', 
      unit, 
      branches, 
      subjects 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/unit');
  }
};

// Mettre à jour
exports.update = async (req, res) => {
  try {
    if (!canEdit(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية تعديل هذه الوحدة');
      return res.redirect('/unit');
    }
    
    const { name, branchId, subjectId, order, description } = req.body;
    const oldUnit = await Unit.findById(req.params.id).lean();
    
    const updateData = {
      name: name.trim(),
      branchId,
      subjectId,
      order: parseInt(order) || 0,
      description: description || ''
    };
    
    const needsPub = needsApproval(req.session.user);
    if (needsPub && oldUnit.status === 'PUBLISHED') {
      updateData.status = 'PENDING';
    }
    
    await Unit.findByIdAndUpdate(req.params.id, updateData);
    const updatedUnit = await Unit.findById(req.params.id).lean();
    
    if (traceabilityService) {
      await traceabilityService.logUpdate(req, 'UNIT', req.params.id, updatedUnit.name, oldUnit, updatedUnit);
    }
    
    if (needsPub && oldUnit.status === 'PUBLISHED') {
      req.flash('warning', '✅ تم تعديل الوحدة. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم تحديث الوحدة بنجاح');
    }
    
    res.redirect('/unit');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/unit/edit/${req.params.id}`);
  }
};

// Supprimer (seulement admin et super_admin)
exports.delete = async (req, res) => {
  try {
    if (!canDelete(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية حذف الوحدات');
      return res.redirect('/unit');
    }
    
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      req.flash('error', 'الوحدة غير موجودة');
      return res.redirect('/unit');
    }
    
    const lessonsCount = await Lesson.countDocuments({ unitId: req.params.id });
    
    if (lessonsCount > 0) {
      req.flash('error', `لا يمكن حذف هذه الوحدة لأنها تحتوي على ${lessonsCount} درس/دروس. قم بحذف الدروس المرتبطة أولاً.`);
      return res.redirect('/unit');
    }
    
    if (traceabilityService) {
      await traceabilityService.logDelete(req, 'UNIT', req.params.id, unit.name, unit);
    }
    
    await Unit.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الوحدة بنجاح');
    res.redirect('/unit');
  } catch (error) {
    console.error(error);
    req.flash('error', 'حدث خطأ أثناء محاولة حذف الوحدة');
    res.redirect('/unit');
  }
};

// ==================== MÉTHODES D'APPROBATION (ADMIN) ====================

// Liste des unités en attente (pour admin)
exports.pendingUnits = async (req, res) => {
  try {
    const units = await Unit.find({ status: 'PENDING' })
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('createdBy', 'username fullName')
      .sort({ createdAt: -1 })
      .lean();
    
    const stats = {
      pending: units.length,
      total: await Unit.countDocuments()
    };
    
    res.render('unit/pending', {
      title: 'الوحدات قيد المراجعة',
      units: units,
      stats: stats
    });
  } catch (error) {
    console.error('Erreur pendingUnits:', error);
    res.render('unit/pending', { 
      error: error.message, 
      units: [],
      stats: { pending: 0, total: 0 }
    });
  }
};

// Approuver une unité
exports.approveUnit = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, error: 'الوحدة غير موجودة' });
    }
    
    const oldStatus = unit.status;
    unit.status = 'PUBLISHED';
    unit.approvedBy = req.session.user.id;
    unit.approvedAt = new Date();
    await unit.save();
    
    // Traçabilité
    await traceabilityService.log(req, {
      action: 'APPROVE',
      entityType: 'UNIT',
      entityId: unit._id,
      entityName: unit.name,
      oldData: { status: oldStatus },
      newData: { status: 'PUBLISHED' }
    });
    
    res.json({ success: true, message: 'تم نشر الوحدة بنجاح' });
  } catch (error) {
    console.error('Erreur approveUnit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Rejeter une unité
exports.rejectUnit = async (req, res) => {
  try {
    const { rejectionReason } = req.body;
    const unit = await Unit.findById(req.params.id);
    if (!unit) {
      return res.status(404).json({ success: false, error: 'الوحدة غير موجودة' });
    }
    
    const oldStatus = unit.status;
    unit.status = 'REJECTED';
    unit.rejectionReason = rejectionReason || '';
    unit.approvedBy = req.session.user.id;
    unit.approvedAt = new Date();
    await unit.save();
    
    // Traçabilité
    await traceabilityService.log(req, {
      action: 'REJECT',
      entityType: 'UNIT',
      entityId: unit._id,
      entityName: unit.name,
      oldData: { status: oldStatus },
      newData: { status: 'REJECTED', rejectionReason }
    });
    
    res.json({ success: true, message: 'تم رفض الوحدة' });
  } catch (error) {
    console.error('Erreur rejectUnit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// API: Récupérer les unités par matière (pour le formulaire de création de leçon)
exports.getUnitsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    if (!subjectId) {
      return res.status(400).json({ error: 'subjectId requis' });
    }
    
    const units = await Unit.find({ subjectId: subjectId })
      .sort({ order: 1 })
      .lean();
    
    res.json(units);
  } catch (error) {
    console.error('Erreur getUnitsBySubject:', error);
    res.status(500).json({ error: error.message });
  }
};

// Voir détails
exports.view = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .lean();
    
    if (!unit) {
      req.flash('error', 'الوحدة غير موجودة');
      return res.redirect('/unit');
    }
    
    const userRole = req.session.user.role;
    const userId = req.session.user.id;
    
    // Teacher ne voit que ses unités ou publiées
    if (userRole === 'teacher' && unit.createdBy?.toString() !== userId && unit.status !== 'PUBLISHED') {
      req.flash('error', 'لا يمكنك عرض هذه الوحدة');
      return res.redirect('/unit');
    }
    
    const lessons = await Lesson.find({ unitId: req.params.id })
      .populate('subjectId', 'name')
      .sort({ order: 1 })
      .lean();
    
    res.render('unit/view', { 
      title: unit.name, 
      unit, 
      lessons 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/unit');
  }
};