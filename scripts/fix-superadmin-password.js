const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const fixPassword = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Voir l'utilisateur actuel
    const user = await DashboardUser.findOne({ username: 'superadmin' });
    if (user) {
      console.log('📋 Utilisateur trouvé:');
      console.log(`   Username: ${user.username}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Password hash: ${user.password.substring(0, 30)}...`);
      
      // Créer un nouveau mot de passe
      const newPassword = 'superadmin123';
      const newHash = await bcrypt.hash(newPassword, 10);
      
      // Mettre à jour
      user.password = newHash;
      await user.save();
      
      console.log('\n✅ Mot de passe réinitialisé!');
      console.log(`   Nouveau hash: ${user.password.substring(0, 30)}...`);
      
      // Tester
      const testMatch = await bcrypt.compare(newPassword, user.password);
      console.log(`\n🔐 Test du nouveau mot de passe: ${testMatch ? '✅ OK' : '❌ ÉCHEC'}`);
    } else {
      console.log('❌ Utilisateur superadmin non trouvé');
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

fixPassword();