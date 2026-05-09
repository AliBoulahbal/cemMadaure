const DashboardUser = require('../models/DashboardUser');
const bcrypt = require('bcryptjs');

// Liste des utilisateurs
exports.list = async (req, res) => {
  try {
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
    
    res.render('admin-users/list', {
      title: 'المشرفون',
      users: users,
      stats: stats,
      currentUserId: req.session.user.id
    });
  } catch (error) {
    console.error(error);
    res.render('admin-users/list', { error: error.message, users: [] });
  }
};

// Formulaire de création
exports.createForm = (req, res) => {
  res.render('admin-users/create', { title: 'إضافة مشرف جديد' });
};

// Créer un utilisateur
exports.create = async (req, res) => {
  try {
    const { username, email, password, fullName, role, phone, isActive } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.render('admin-users/create', { 
        error: 'جميع الحقول المطلوبة يجب تعبئتها'
      });
    }
    
    // Vérifier si l'utilisateur existe déjà
    const existing = await DashboardUser.findOne({ $or: [{ username }, { email }] });
    if (existing) {
      return res.render('admin-users/create', { 
        error: 'اسم المستخدم أو البريد الإلكتروني موجود بالفعل'
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await DashboardUser.create({
      username,
      email,
      password: hashedPassword,
      fullName,
      role: role || 'viewer',
      phone: phone || '',
      isActive: isActive === 'on'
    });
    
    req.flash('success', 'تم إضافة المشرف بنجاح');
    res.redirect('/admin-users');
  } catch (error) {
    console.error('Erreur create:', error);
    res.render('admin-users/create', { error: error.message });
  }
};

// Formulaire d'édition
exports.editForm = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    if (!user) {
      req.flash('error', 'المشرف غير موجود');
      return res.redirect('/admin-users');
    }
    
    res.render('admin-users/edit', { 
      title: 'تعديل مشرف',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin-users');
  }
};

// Mettre à jour
exports.update = async (req, res) => {
  try {
    const { fullName, role, phone, isActive } = req.body;
    
    await DashboardUser.findByIdAndUpdate(req.params.id, {
      fullName,
      role,
      phone,
      isActive: isActive === 'on',
      updatedAt: new Date()
    });
    
    req.flash('success', 'تم تحديث المشرف بنجاح');
    res.redirect('/admin-users');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/admin-users/edit/${req.params.id}`);
  }
};

// Supprimer
exports.delete = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id);
    
    if (!user) {
      req.flash('error', 'المشرف غير موجود');
      return res.redirect('/admin-users');
    }
    
    // Empêcher la suppression de son propre compte
    if (user._id.toString() === req.session.user.id) {
      req.flash('error', 'لا يمكنك حذف حسابك الخاص');
      return res.redirect('/admin-users');
    }
    
    await DashboardUser.findByIdAndDelete(req.params.id);
    req.flash('success', 'تم حذف المشرف بنجاح');
    res.redirect('/admin-users');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/admin-users');
  }
};

// Voir détails
exports.view = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    if (!user) {
      req.flash('error', 'المشرف غير موجود');
      return res.redirect('/admin-users');
    }
    
    res.render('admin-users/view', { 
      title: 'ملف المشرف',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin-users');
  }
};

// Changer mot de passe - Formulaire
exports.changePasswordForm = async (req, res) => {
  try {
    const user = await DashboardUser.findById(req.params.id).select('-password').lean();
    if (!user) {
      req.flash('error', 'المشرف غير موجود');
      return res.redirect('/admin-users');
    }
    
    res.render('admin-users/change-password', { 
      title: 'تغيير كلمة المرور',
      user: user
    });
  } catch (error) {
    console.error(error);
    res.redirect('/admin-users');
  }
};

// Changer mot de passe - Action
exports.changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    
    if (!newPassword || newPassword.length < 6) {
      req.flash('error', 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return res.redirect(`/admin-users/change-password/${req.params.id}`);
    }
    
    if (newPassword !== confirmPassword) {
      req.flash('error', 'كلمة المرور غير متطابقة');
      return res.redirect(`/admin-users/change-password/${req.params.id}`);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await DashboardUser.findByIdAndUpdate(req.params.id, { password: hashedPassword });
    
    req.flash('success', 'تم تغيير كلمة المرور بنجاح');
    res.redirect('/admin-users');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/admin-users/change-password/${req.params.id}`);
  }
};
exports.toggleStatus = async (req, res) => {
  try {
    const DashboardUser = require('../models/DashboardUser');
    const user = await DashboardUser.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'المستخدم غير موجود' });
    if (req.params.id === req.session.user.id) return res.status(400).json({ success: false, error: 'لا يمكنك تعطيل حسابك الخاص' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive, message: user.isActive ? 'تم تفعيل الحساب' : 'تم تعطيل الحساب' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
