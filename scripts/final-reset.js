const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const finalReset = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // SUPPRIMER TOUT
    await DashboardUser.deleteMany({});
    console.log('🗑️ Tous les utilisateurs supprimés\n');
    
    // Créer UN SEUL utilisateur super admin avec un mot de passe TRÈS SIMPLE
    const simplePassword = '123456';
    const hash = await bcrypt.hash(simplePassword, 10);
    
    const superAdmin = await DashboardUser.create({
      username: 'admin',
      email: 'admin@cem.com',
      password: hash,
      fullName: 'Administrateur',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('✅ Utilisateur créé:');
    console.log('   Username: admin');
    console.log('   Password: 123456');
    console.log(`   ID: ${superAdmin._id}\n`);
    
    // TEST DIRECT
    const testUser = await DashboardUser.findOne({ username: 'admin' });
    const testMatch = await bcrypt.compare('123456', testUser.password);
    console.log(`🔐 Test direct: ${testMatch ? '✅ VALIDE' : '❌ INVALIDE'}`);
    
    // Afficher le hash stocké
    console.log(`   Hash stocké: ${testUser.password}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Réinitialisation terminée!');
    console.log('\n🔐 Connectez-vous avec:');
    console.log('   http://localhost:3001/login');
    console.log('   Username: admin');
    console.log('   Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

finalReset();