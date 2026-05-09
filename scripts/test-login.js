const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const testLogin = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Vérifier les utilisateurs
    const users = await DashboardUser.find();
    console.log(`📊 ${users.length} utilisateur(s) trouvé(s):`);
    users.forEach(u => {
      console.log(`   - ${u.username} (${u.role})`);
    });
    
    if (users.length === 0) {
      console.log('\n⚠️ Aucun utilisateur! Création...');
      
      const hash = await bcrypt.hash('superadmin123', 10);
      await DashboardUser.create({
        username: 'superadmin',
        email: 'superadmin@cem.com',
        password: hash,
        fullName: 'Super Admin',
        role: 'super_admin',
        isActive: true
      });
      console.log('✅ Utilisateur créé: superadmin / superadmin123');
    }
    
    // Tester la comparaison de mot de passe
    const admin = await DashboardUser.findOne({ username: 'superadmin' });
    if (admin) {
      console.log('\n🔐 Test du mot de passe:');
      const isMatch = await admin.comparePassword('superadmin123');
      console.log(`   Mot de passe "superadmin123": ${isMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
      
      // Tester avec bcrypt directement
      const directMatch = await bcrypt.compare('superadmin123', admin.password);
      console.log(`   Vérification directe: ${directMatch ? '✅ CORRECT' : '❌ INCORRECT'}`);
    }
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

testLogin();