// Définition des rôles et leurs permissions
const roles = {
  super_admin: {
    name: 'مدير عام',
    permissions: ['all'], // Toutes les permissions
    color: 'danger'
  },
  admin: {
    name: 'مدير',
    nameAr: 'مدير',
    permissions: [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'content.view', 'content.create', 'content.edit', 'content.delete',
      'academic.view', 'academic.create', 'academic.edit', 'academic.delete',
      'reports.view', 'reports.export',
      'settings.view', 'settings.edit'
    ],
    color: 'warning'
  },
  teacher: {
    name: 'أستاذ',
    nameAr: 'أستاذ',
    permissions: [
      'content.view', 'content.create', 'content.edit',
      'academic.view',
      'reports.view'
    ],
    color: 'info'
  },
  viewer: {
    name: 'مشاهد',
    nameAr: 'مشاهد',
    permissions: [
      'content.view',
      'academic.view'
    ],
    color: 'secondary'
  }
};

// Définition des permissions disponibles
const availablePermissions = [
  // Permissions utilisateurs
  { code: 'users.view', name: 'عرض المستخدمين', category: 'users' },
  { code: 'users.create', name: 'إضافة مستخدم', category: 'users' },
  { code: 'users.edit', name: 'تعديل مستخدم', category: 'users' },
  { code: 'users.delete', name: 'حذف مستخدم', category: 'users' },
  
  // Permissions contenu
  { code: 'content.view', name: 'عرض المحتوى', category: 'content' },
  { code: 'content.create', name: 'إضافة محتوى', category: 'content' },
  { code: 'content.edit', name: 'تعديل محتوى', category: 'content' },
  { code: 'content.delete', name: 'حذف محتوى', category: 'content' },
  
  // Permissions académiques
  { code: 'academic.view', name: 'عرض البيانات الأكاديمية', category: 'academic' },
  { code: 'academic.create', name: 'إضافة بيانات أكاديمية', category: 'academic' },
  { code: 'academic.edit', name: 'تعديل بيانات أكاديمية', category: 'academic' },
  { code: 'academic.delete', name: 'حذف بيانات أكاديمية', category: 'academic' },
  
  // Permissions rapports
  { code: 'reports.view', name: 'عرض التقارير', category: 'reports' },
  { code: 'reports.export', name: 'تصدير التقارير', category: 'reports' },
  
  // Permissions paramètres
  { code: 'settings.view', name: 'عرض الإعدادات', category: 'settings' },
  { code: 'settings.edit', name: 'تعديل الإعدادات', category: 'settings' }
];

module.exports = { roles, availablePermissions };