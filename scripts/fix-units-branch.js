const mongoose = require('mongoose');
require('dotenv').config();

const Unit = require('../models/Unit');
const Subject = require('../models/Subject');
const Branch = require('../models/Branch');

const fixUnitsBranch = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    const units = await Unit.find();
    console.log(`📊 ${units.length} unités trouvées\n`);
    
    for (const unit of units) {
      // Récupérer la matière pour obtenir la branche
      const subject = await Subject.findById(unit.subjectId);
      if (subject && subject.branchId && !unit.branchId) {
        unit.branchId = subject.branchId;
        await unit.save();
        console.log(`✅ Unité "${unit.name}" mise à jour avec branchId: ${subject.branchId}`);
      } else if (!unit.branchId) {
        console.log(`⚠️ Unité "${unit.name}" - matière non trouvée ou sans branchId`);
      }
    }
    
    const updatedUnits = await Unit.find().populate('branchId', 'name');
    console.log('\n📋 Unités après mise à jour:');
    updatedUnits.forEach(u => {
      console.log(`   - ${u.name} (Branche: ${u.branchId?.name || 'Non définie'})`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixUnitsBranch();