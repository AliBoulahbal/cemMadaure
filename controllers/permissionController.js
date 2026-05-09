const DashboardUser = require('../models/DashboardUser');
const Permission = require('../models/Permission');

// Liste des permissions
exports.list = async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ category: 1, name: 1 }).lean();
    const users = await DashboardUser.find().select('username fullName role').lean();
    
    // Grouper par catégorie
    const groupedPermissions = {};
    permissions.forEach(p => {
      if (!groupedPermissions[p.category]) {
        groupedPermissions[p.category] = [];
      }
      groupedPermissions[p.category].push(p);
    });
    
    res.render('permissions/list', {
      title: 'الصلاحيات',
      permissions: groupedPermissions,
      users: users
    });
  } catch (error) {
    console.error(error);
    res.render('permissions/list', { error: error.message, permissions: {} });
  }
};

// Formulaire de création
exports.createForm = (req, res) => {
  res.render('permissions/create', { title: 'إضافة صلاحية جديدة' });
};

// Créer une permission
exports.create = async (req, res) => {
  try {
    const { name, code, category, description, defaultRoles } = req.body;
    
    const existing = await Permission.findOne({ $or: [{ name }, { code }] });
    if (existing) {
      return res.render('permissions/create', { 
        error: 'هذه الصلاحية موجودة بالفعل',
        formData: req.body
      });
    }
    
    await Permission.create({
      name,
      code,
      category,
      description: description || '',
      defaultRoles: defaultRoles || []
    });
    
    req.flash('success', 'تم إضافة الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    res.render('permissions/create', { error: error.message });
  }
};

// Formulaire d'édition
exports.editForm = async (req, res) => {
  try {
    const permission = await Permission.findById(req.params.id).lean();
    if (!permission) {
      req.flash('error', 'الصلاحية غير موجودة');
      return res.redirect('/permissions');
    }
    res.render('permissions/edit', { title: 'تعديل صلاحية', permission });
  } catch (error) {
    res.redirect('/permissions');
  }
};

// Mettre à jour
exports.update = async (req, res) => {
  try {
    await Permission.findByIdAndUpdate(req.params.id, req.body);
    req.flash('success', 'تم تحديث الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/permissions/edit/${req.params.id}`);
  }
};

// Supprimer
exports.delete = async (req, res) => {
  try {
    await Permission.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الصلاحية بنجاح');
    res.redirect('/permissions');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect('/permissions');
  }
};

// Gérer les permissions d'un utilisateur
exports.userPermissions = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).lean();
    if (!user) {
      req.flash('error', 'المستخدم غير موجود');
      return res.redirect('/users');
    }
    
    const allPermissions = await Permission.find().lean();
    const userPermissions = user.permissions || [];
    
    res.render('permissions/user', {
      title: `صلاحيات المستخدم: ${user.fullName}`,
      user: user,
      allPermissions: allPermissions,
      userPermissions: userPermissions
    });
  } catch (error) {
    res.redirect('/users');
  }
};

// Mettre à jour les permissions d'un utilisateur
exports.updateUserPermissions = async (req, res) => {
  try {
    const { permissions } = req.body;
    await DashboardUser.findByIdAndUpdate(req.params.id, { 
      permissions: permissions || []
    });
    
    req.flash('success', 'تم تحديث صلاحيات المستخدم بنجاح');
    res.redirect('/users');
  } catch (error) {
    req.flash('error', error.message);
    res.redirect(`/permissions/user/${req.params.id}`);
  }
};

// API: Obtenir les permissions par rôle
exports.getByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const permissions = await Permission.find({ defaultRoles: role }).lean();
    res.json({ permissions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};