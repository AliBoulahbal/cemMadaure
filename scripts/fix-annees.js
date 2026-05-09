const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const Annee = require('../models/Annee');

const fixAnnees = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Voir toutes les années actuelles
    const existingAnnees = await Annee.find();
    console.log(`📊 Années actuelles: ${existingAnnees.length}`);
    
    if (existingAnnees.length > 0) {
      console.log('\n📋 Liste des années actuelles:');
      existingAnnees.forEach(annee => {
        console.log(`   ID: ${annee._id}, Nom: "${annee.name}"`);
      });
    }
    
    // Supprimer toutes les années existantes
    if (existingAnnees.length > 0) {
      console.log('\n🗑️ Suppression des anciennes années...');
      await Annee.deleteMany({});
      console.log('✅ Anciennes années supprimées');
    }
    
    // Créer les bonnes années
    const correctAnnees = [
        { name: '1ère Année Moyenne' },
        { name: '2ème Année Moyenne' },
        { name: '3ème Année Moyenne' }
    ];
    
    console.log('\n📝 Création des nouvelles années...');
    for (const annee of correctAnnees) {
        const newAnnee = await Annee.create(annee);
        console.log(`✅ Créée: "${newAnnee.name}" (ID: ${newAnnee._id})`);
    }
    
    // Vérifier le résultat
    const finalAnnees = await Annee.find();
    console.log(`\n📊 Maintenant ${finalAnnees.length} année(s):`);
    finalAnnees.forEach(annee => {
        console.log(`   - ${annee.name} (${annee._id})`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Correction terminée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixAnnees();