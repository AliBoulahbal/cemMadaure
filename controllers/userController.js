const DashboardUser = require('../models/DashboardUser');
const bcrypt = require('bcryptjs');

// Liste des utilisateurs
exports.list = async (req, res) => {
  try {
    // Vérifier si l'utilisateur a le droit
    if (req.session.user.role !== 'super_admin' && req.session.user.role !== 'admin') {
      return res.status(403).render('errors/403', {
        title: 'غير مصرح',
        message: 'ليس لديك صلاحية للوصول إلى هذه الصفحة'
      });
    }
    
    const users = await DashboardUser.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    const stats = {
      total: users.length,
      super_admin: users.filter(u => u.role === 'super_admin').length,
      admin: users.filter(u => u.role === 'admin').length,
      teacher: users.filter(u => u.role === 'teacher').length,
      viewer: users.filter(u => u.role === 'viewer').length,
      active: users.filter(u => u.isActive).length
    };
    
    res.render('users/list', {
      title: 'المستخدمون',
      users: users,
      stats: stats,
      currentUserId: req.session.user.id
    });
  } catch (error) {
    console.error(error);
    res.render('users/list', { error: error.message, users: [] });
  }
};

// Formulaire de création
exports.createForm = async (req, res) => {
  try {
    if (req.session.user.role !== 'super_admin' && req.session.user.role !== 'admin') {
      return res.status(403).render('errors/403', { title: 'غير مصرح' });
    }
    
    res.render('users/create', { title: 'إضافة مستخدم جديد' });
  } catch (error) {
    res.render('users/create', { error: error.message });
  }
};

// Créer un utilisateur
exports.create = async (req, res) => {
  try {
    if (req.session.user.role !== 'super_admin' && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    const { username, email, password, fullName, role, phone, isActive } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.render('users/create', { error: 'جميع الحقول المطلوبة يجب تعبئتها' });
    }
    
    // Vérifier si l'utilisateur existe
    const existing = await DashboardUser.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.render('users/create', { error: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const newUser = await DashboardUser.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'viewer',
      phone: phone || '',
      isActive: isActive === 'on'
    });
    
    req.flash('success', 'تم إضافة المستخدم بنجاح');
    res.redirect('/users');
  } catch (error) {
    console.error(error);
    res.render('users/create', { error: error.message });
  }
};

// Formulaire d'édition
exports.editForm = async (req, res) => {
  try {
    if (req.session.user.role !== 'super_admin' && req.session.user.role !== 'admin') {
      return res.status(403).render('errors/403', { title: 'غير مصرح' });
    }
    
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    if (!user) {
      req.flash('error', 'المستخدم غير موجود');
      return res.redirect('/users');
    }
    
    res.render('users/edit', { title: 'تعديل مستخدم', user: user });
  } catch (error) {
    console.error(error);
    res.redirect('/users');
  }
};

// Mettre à jour
exports.update = async (req, res) => {
  try {
    if (req.session.user.role !== 'super_admin' && req.session.user.role !== 'admin') {
      return res.status(403).json({ error: 'Non autorisé' });
    }
    
    const { fullName, role, phone, isActive } = req.body;
    
    await DashboardUser.findByIdAndUpdate(req.params.id, {
      fullName,
      role,
      phone,
      isActive: isActive === 'on',
      updatedAt: new Date()
    });
    
    req.flash('success', 'تم تحديث المستخدم بنجاح');
    res.redirect('/users');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/users/edit/${req.params.id}`);
  }
};

// Supprimer
// Supprimer
// Supprimer une unité
exports.delete = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    
    if (!unit) {
      req.flash('error', 'الوحدة غير موجودة');
      return res.redirect('/unit');
    }
    
    // Vérifier si des leçons utilisent cette unité
    const lessonsCount = await Lesson.countDocuments({ unitId: req.params.id });
    
    if (lessonsCount > 0) {
      req.flash('error', `لا يمكن حذف هذه الوحدة لأنها تحتوي على ${lessonsCount} درس/دروس. قم بحذف الدروس المرتبطة أولاً.`);
      return res.redirect('/unit');
    }
    
    await Unit.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف الوحدة بنجاح');
    res.redirect('/unit');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/unit');
  }
};
// Voir détails
exports.view = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    if (!user) {
      req.flash('error', 'المستخدم غير موجود');
      return res.redirect('/users');
    }
    
    res.render('users/view', { title: 'ملف المستخدم', user: user });
  } catch (error) {
    console.error(error);
    res.redirect('/users');
  }
};

// Changer mot de passe
exports.changePasswordForm = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    res.render('users/change-password', { title: 'تغيير كلمة المرور', user: user });
  } catch (error) {
    res.redirect('/users');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      req.flash('error', 'كلمة المرور غير متطابقة');
      return res.redirect(`/users/change-password/${req.params.id}`);
    }
    
    if (newPassword.length < 6) {
      req.flash('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return res.redirect(`/users/change-password/${req.params.id}`);
    }
    
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await DashboardUser.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    
    req.flash('success', 'تم تغيير كلمة المرور بنجاح');
    res.redirect('/users');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/users/change-password/${req.params.id}`);
  }
};