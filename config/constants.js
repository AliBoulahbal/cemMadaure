// config/constants.js
// Années scolaires constantes (non modifiables)
const BRANCHES = [
  { id: 1, name: 'السنة الأولى متوسط', order: 1, isConstant: true },
  { id: 2, name: 'السنة الثانية متوسط', order: 2, isConstant: true },
  { id: 3, name: 'السنة الثالثة متوسط', order: 3, isConstant: true },
  { id: 4, name: 'السنة الرابعة متوسط', order: 4, isConstant: true }
];

// Matières (modifiables)
const SUBJECTS = [
  { id: 1, name: 'الرياضيات', icon: 'fa-calculator', color: 'primary' },
  { id: 2, name: 'اللغة العربية', icon: 'fa-language', color: 'success' },
  { id: 3, name: 'اللغة الفرنسية', icon: 'fa-language', color: 'info' },
  { id: 4, name: 'اللغة الإنجليزية', icon: 'fa-language', color: 'warning' },
  { id: 5, name: 'العلوم الطبيعية', icon: 'fa-leaf', color: 'success' },
  { id: 6, name: 'العلوم الفيزيائية', icon: 'fa-flask', color: 'danger' },
  { id: 7, name: 'التاريخ والجغرافيا', icon: 'fa-landmark', color: 'secondary' },
  { id: 8, name: 'التربية الإسلامية', icon: 'fa-mosque', color: 'info' },
  { id: 9, name: 'التربية المدنية', icon: 'fa-gavel', color: 'primary' },
  { id: 10, name: 'التربية البدنية', icon: 'fa-futbol', color: 'success' }
];

module.exports = { BRANCHES, SUBJECTS };