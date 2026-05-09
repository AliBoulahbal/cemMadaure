const Branch = require('../models/Branch');
const { BRANCHES } = require('../config/constants');

// Liste des années (lecture seule pour les constantes)
exports.list = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ order: 1 }).lean();
    
    res.render('branch/list', {
      title: 'السنوات الدراسية',
      branches: branches,
      isEditable: false // Les années sont en lecture seule
    });
  } catch (error) {
    console.error(error);
    res.render('branch/list', { error: error.message, branches: [] });
  }
};

// Formulaire de création - DÉSACTIVÉ pour les constantes
exports.createForm = (req, res) => {
  req.flash('error', 'لا يمكن إضافة سنوات دراسية جديدة. هذه قائمة ثابتة.');
  res.redirect('/branch');
};

// Création - DÉSACTIVÉE
exports.create = async (req, res) => {
  req.flash('error', 'لا يمكن إضافة سنوات دراسية جديدة. هذه قائمة ثابتة.');
  res.redirect('/branch');
};

// Formulaire d'édition - DÉSACTIVÉ pour les constantes
exports.editForm = async (req, res) => {
  const branch = await Branch.findById(req.params.id).lean();
  
  if (branch && branch.isConstant) {
    req.flash('error', 'لا يمكن تعديل السنوات الدراسية الثابتة');
    return res.redirect('/branch');
  }
  
  res.redirect('/branch');
};

// Mise à jour - DÉSACTIVÉE pour les constantes
exports.update = async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  
  if (branch && branch.isConstant) {
    req.flash('error', 'لا يمكن تعديل السنوات الدراسية الثابتة');
    return res.redirect('/branch');
  }
  
  res.redirect('/branch');
};

// Suppression - DÉSACTIVÉE pour les constantes
exports.delete = async (req, res) => {
  const branch = await Branch.findById(req.params.id);
  
  if (branch && branch.isConstant) {
    req.flash('error', 'لا يمكن حذف السنوات الدراسية الثابتة');
    return res.redirect('/branch');
  }
  
  await Branch.findByIdAndDelete(req.params.id);
  req.flash('success', 'تم الحذف بنجاح');
  res.redirect('/branch');
};

// API: Récupérer les années (pour les sélecteurs)
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ order: 1 }).lean();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};