const Subject = require('../models/Subject');
const Branch = require('../models/Branch');
const Unit = require('../models/Unit');
const traceabilityService = require('../services/traceabilityService');

const canCreate = (user) => ['super_admin', 'admin', 'teacher'].includes(user?.role);
const canEdit   = (user) => ['super_admin', 'admin', 'teacher'].includes(user?.role);
const canDelete = (user) => ['super_admin', 'admin'].includes(user?.role);
const needsApproval = (user) => user?.role === 'teacher';

exports.list = async (req, res) => {
  try {
    const userRole = req.session.user.role;
    const userId   = req.session.user.id;
    let query = {};
    if (userRole === 'teacher') {
      query = { $or: [{ createdBy: userId }, { status: 'PUBLISHED' }] };
    }
    const subjects = await Subject.find(query)
      .populate('branchId', 'name')
      .sort({ branchId: 1, order: 1, name: 1 })
      .lean();
    const branches = await Branch.find().sort({ name: 1 }).lean();
    res.render('subject/list', { title: 'المواد الدراسية', subjects, branches, userRole });
  } catch (error) {
    res.render('subject/list', { error: error.message, subjects: [], branches: [] });
  }
};

exports.pendingList = async (req, res) => {
  try {
    const subjects = await Subject.find({ status: 'PENDING' })
      .populate('branchId', 'name')
      .populate('createdBy', 'fullName username')
      .sort({ createdAt: -1 })
      .lean();
    res.render('subject/pending', { title: 'المواد قيد المراجعة', subjects });
  } catch (error) {
    res.render('subject/pending', { error: error.message, subjects: [] });
  }
};

exports.createForm = async (req, res) => {
  try {
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء مواد');
      return res.redirect('/subject');
    }
    const branches = await Branch.find().sort({ name: 1 }).lean();
    res.render('subject/create', { title: 'إضافة مادة دراسية', branches });
  } catch (error) {
    res.render('subject/create', { error: error.message, branches: [] });
  }
};

exports.create = async (req, res) => {
  try {
    if (!canCreate(req.session.user)) {
      req.flash('error', 'ليس لديك صلاحية لإنشاء مواد');
      return res.redirect('/subject');
    }
    const { branchId, name, code, order, description, icon, color } = req.body;
    const existing = await Subject.findOne({ branchId, name });
    if (existing) {
      const branches = await Branch.find().lean();
      return res.render('subject/create', { error: 'هذه المادة موجودة بالفعل لهذه السنة', branches, formData: req.body });
    }
    const isPending = needsApproval(req.session.user);
    const newSubject = await Subject.create({
      branchId, name,
      code: code || '',
      order: parseInt(order) || 0,
      description: description || '',
      icon: icon || 'fa-book',
      color: color || 'primary',
      status: isPending ? 'PENDING' : 'PUBLISHED',
      createdBy: req.session.user.id
    });
    if (traceabilityService) await traceabilityService.logCreate(req, 'SUBJECT', newSubject, newSubject.name);
    if (isPending) {
      req.flash('warning', '✅ تم إضافة المادة. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم إضافة المادة بنجاح');
    }
    res.redirect('/subject');
  } catch (error) {
    const branches = await Branch.find().lean();
    res.render('subject/create', { error: error.message, branches });
  }
};

exports.editForm = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('branchId').lean();
    if (!subject) { req.flash('error', 'المادة غير موجودة'); return res.redirect('/subject'); }
    if (!canEdit(req.session.user)) { req.flash('error', 'ليس لديك صلاحية تعديل هذه المادة'); return res.redirect('/subject'); }
    const branches = await Branch.find().sort({ name: 1 }).lean();
    res.render('subject/edit', { title: 'تعديل مادة دراسية', subject, branches });
  } catch (error) { res.redirect('/subject'); }
};

exports.update = async (req, res) => {
  try {
    if (!canEdit(req.session.user)) { req.flash('error', 'ليس لديك صلاحية تعديل هذه المادة'); return res.redirect('/subject'); }
    const oldSubject = await Subject.findById(req.params.id).lean();
    const updateData = { ...req.body };
    if (needsApproval(req.session.user) && oldSubject.status === 'PUBLISHED') updateData.status = 'PENDING';
    await Subject.findByIdAndUpdate(req.params.id, updateData);
    const updatedSubject = await Subject.findById(req.params.id).lean();
    if (traceabilityService) await traceabilityService.logUpdate(req, 'SUBJECT', req.params.id, updatedSubject.name, oldSubject, updatedSubject);
    if (needsApproval(req.session.user) && oldSubject.status === 'PUBLISHED') {
      req.flash('warning', '✅ تم تعديل المادة. في انتظار موافقة المشرف.');
    } else {
      req.flash('success', 'تم تحديث المادة بنجاح');
    }
    res.redirect('/subject');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/subject/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    if (!canDelete(req.session.user)) { req.flash('error', 'ليس لديك صلاحية حذف المواد'); return res.redirect('/subject'); }
    const subject = await Subject.findById(req.params.id);
    if (!subject) { req.flash('error', 'المادة غير موجودة'); return res.redirect('/subject'); }
    const unitsCount = await Unit.countDocuments({ subjectId: req.params.id });
    if (unitsCount > 0) { req.flash('error', `لا يمكن حذف هذه المادة لأنها تحتوي على ${unitsCount} وحدة`); return res.redirect('/subject'); }
    if (traceabilityService) await traceabilityService.logDelete(req, 'SUBJECT', req.params.id, subject.name, subject);
    await Subject.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف المادة بنجاح');
    res.redirect('/subject');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/subject');
  }
};

exports.getByBranch = async (req, res) => {
  try {
    const subjects = await Subject.find({ branchId: req.params.branchId }).sort({ order: 1, name: 1 }).lean();
    res.json(subjects);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
