const mongoose = require('mongoose');
require('dotenv').config();

const Branch = require('../models/Branch');
const { BRANCHES } = require('../config/constants');

const initBranches = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté à MongoDB\n');
    
    // Supprimer les anciennes branches non constantes
    await Branch.deleteMany({ isConstant: false });
    console.log('🗑️ Branches non constantes supprimées\n');
    
    // Créer ou mettre à jour les branches constantes
    for (const branch of BRANCHES) {
      const existing = await Branch.findOne({ name: branch.name });
      
      if (!existing) {
        await Branch.create({
          name: branch.name,
          order: branch.order,
          isConstant: true,
          description: `${branch.name} - ثابتة لا يمكن حذفها`
        });
        console.log(`✅ Créée: ${branch.name}`);
      } else if (!existing.isConstant) {
        // Si elle existe mais n'est pas constante, la mettre à jour
        await Branch.findByIdAndUpdate(existing._id, {
          isConstant: true,
          order: branch.order
        });
        console.log(`🔄 Mise à jour: ${branch.name} (devenue constante)`);
      } else {
        console.log(`⏭️ Existe déjà: ${branch.name}`);
      }
    }
    
    // Afficher toutes les branches
    const branches = await Branch.find().sort({ order: 1 });
    console.log('\n📋 Liste des années scolaires:');
    branches.forEach(b => {
      console.log(`   ${b.name} ${b.isConstant ? '🔒 (constante)' : '(modifiable)'}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Initialisation terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initBranches();