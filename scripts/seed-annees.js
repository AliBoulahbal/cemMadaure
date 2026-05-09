const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Annee = require('../models/Annee');

const seedAnnees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const annees = [
      { name: '1ère Année Moyenne' },
      { name: '2ème Année Moyenne' },
      { name: '3ème Année Moyenne' }
    ];
    
    for (const annee of annees) {
      const exists = await Annee.findOne({ name: annee.name });
      if (!exists) {
        await Annee.create(annee);
        console.log(`✅ Année créée: ${annee.name}`);
      } else {
        console.log(`⚠️ Année existe déjà: ${annee.name}`);
      }
    }
    
    console.log('✅ Années initialisées avec succès');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

seedAnnees();