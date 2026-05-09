const Branch = require('../models/Branch');
//const Annee = require('../models/Annee');

exports.list = async (req, res) => {
  try {
    const matieres = await Branch.find().populate('AnneeId', 'name').sort({ order: 1, name: 1 });
    const annees = await Annee.find();
    
    res.render('matiere/list', { 
      title: 'Gestion des Matières', 
      matieres, 
      annees 
    });
  } catch (error) {
    console.error(error);
    res.render('matiere/list', { 
      error: error.message, 
      matieres: [] 
    });
  }
};

exports.createForm = async (req, res) => {
  try {
    const annees = await Annee.find().sort({ name: 1 });
    res.render('matiere/create', { 
      title: 'Ajouter une Matière', 
      annees 
    });
  } catch (error) {
    console.error(error);
    res.render('matiere/create', { 
      error: error.message, 
      annees: [] 
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, AnneeId, order, description } = req.body;
    
    // Vérifier si la matière existe déjà
    const existingMatiere = await Branch.findOne({ name, AnneeId });
    if (existingMatiere) {
      const annees = await Annee.find();
      return res.render('matiere/create', { 
        error: 'Cette matière existe déjà pour cette année', 
        annees,
        formData: req.body
      });
    }
    
    await Branch.create({
      name,
      AnneeId,
      order: order || 0,
      description: description || ''
    });
    
    req.flash('success', 'Matière créée avec succès');
    res.redirect('/matiere');
  } catch (error) {
    console.error(error);
    const annees = await Annee.find();
    res.render('matiere/create', { 
      error: error.message, 
      annees,
      formData: req.body
    });
  }
};

exports.editForm = async (req, res) => {
  try {
    const matiere = await Branch.findById(req.params.id);
    if (!matiere) {
      req.flash('error', 'Matière non trouvée');
      return res.redirect('/matiere');
    }
    
    const annees = await Annee.find().sort({ name: 1 });
    
    res.render('matiere/edit', { 
      title: 'Modifier la Matière', 
      matiere, 
      annees 
    });
  } catch (error) {
    console.error(error);
    res.redirect('/matiere');
  }
};

exports.update = async (req, res) => {
  try {
    const { name, AnneeId, order, description } = req.body;
    
    // Vérifier si une autre matière a le même nom pour la même année
    const existingMatiere = await Branch.findOne({ 
      name, 
      AnneeId, 
      _id: { $ne: req.params.id } 
    });
    
    if (existingMatiere) {
      req.flash('error', 'Une autre matière avec ce nom existe déjà pour cette année');
      return res.redirect(`/matiere/edit/${req.params.id}`);
    }
    
    await Branch.findByIdAndUpdate(req.params.id, {
      name,
      AnneeId,
      order: order || 0,
      description: description || ''
    });
    
    req.flash('success', 'Matière mise à jour avec succès');
    res.redirect('/matiere');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/matiere/edit/${req.params.id}`);
  }
};

exports.delete = async (req, res) => {
  try {
    const matiere = await Branch.findById(req.params.id);
    if (!matiere) {
      req.flash('error', 'Matière non trouvée');
      return res.redirect('/matiere');
    }
    
    await Branch.findByIdAndDelete(req.params.id);
    req.flash('success', 'Matière supprimée avec succès');
    res.redirect('/matiere');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/matiere');
  }
};