const mongoose = require('mongoose');
require('dotenv').config();

const Permission = require('../models/Permission');

const permissions = [
  { name: 'عرض المستخدمين', code: 'users.view', category: 'users', description: 'السماح بعرض قائمة المستخدمين', defaultRoles: ['admin', 'super_admin'] },
  { name: 'إضافة مستخدم', code: 'users.create', category: 'users', description: 'السماح بإضافة مستخدمين جدد', defaultRoles: ['admin', 'super_admin'] },
  { name: 'تعديل مستخدم', code: 'users.edit', category: 'users', description: 'السماح بتعديل بيانات المستخدمين', defaultRoles: ['admin', 'super_admin'] },
  { name: 'حذف مستخدم', code: 'users.delete', category: 'users', description: 'السماح بحذف المستخدمين', defaultRoles: ['super_admin'] },
  { name: 'عرض المحتوى', code: 'content.view', category: 'content', description: 'السماح بعرض المحتوى', defaultRoles: ['admin', 'teacher', 'super_admin'] },
  { name: 'إضافة محتوى', code: 'content.create', category: 'content', description: 'السماح بإضافة محتوى جديد', defaultRoles: ['admin', 'teacher', 'super_admin'] },
  { name: 'تعديل محتوى', code: 'content.edit', category: 'content', description: 'السماح بتعديل المحتوى', defaultRoles: ['admin', 'teacher', 'super_admin'] },
  { name: 'حذف محتوى', code: 'content.delete', category: 'content', description: 'السماح بحذف المحتوى', defaultRoles: ['admin', 'super_admin'] },
  { name: 'الموافقة على المحتوى', code: 'content.approve', category: 'content', description: 'السماح بنشر المحتوى بعد المراجعة', defaultRoles: ['admin', 'super_admin'] },
  { name: 'عرض المواد', code: 'academic.view', category: 'academic', description: 'السماح بعرض المواد الدراسية', defaultRoles: ['admin', 'teacher', 'super_admin'] },
  { name: 'إضافة مادة', code: 'academic.create', category: 'academic', description: 'السماح بإضافة مواد دراسية', defaultRoles: ['admin', 'super_admin'] },
  { name: 'تعديل مادة', code: 'academic.edit', category: 'academic', description: 'السماح بتعديل المواد الدراسية', defaultRoles: ['admin', 'super_admin'] },
  { name: 'حذف مادة', code: 'academic.delete', category: 'academic', description: 'السماح بحذف المواد الدراسية', defaultRoles: ['super_admin'] },
  { name: 'عرض التقارير', code: 'reports.view', category: 'reports', description: 'السماح بعرض التقارير', defaultRoles: ['admin', 'super_admin'] },
  { name: 'تصدير التقارير', code: 'reports.export', category: 'reports', description: 'السماح بتصدير التقارير', defaultRoles: ['admin', 'super_admin'] },
  { name: 'عرض الإعدادات', code: 'settings.view', category: 'settings', description: 'السماح بعرض الإعدادات', defaultRoles: ['admin', 'super_admin'] },
  { name: 'تعديل الإعدادات', code: 'settings.edit', category: 'settings', description: 'السماح بتعديل الإعدادات', defaultRoles: ['super_admin'] }
];

const initPermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    await Permission.deleteMany({});
    console.log('🗑️ Anciennes permissions supprimées');
    
    for (const perm of permissions) {
      await Permission.create(perm);
      console.log(`✅ ${perm.name} (${perm.code})`);
    }
    
    console.log(`\n✅ ${permissions.length} permissions créées`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

initPermissions();