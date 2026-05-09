const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const cleanAndCreate = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Supprimer TOUS les utilisateurs
    const deleted = await DashboardUser.deleteMany({});
    console.log(`🗑️ ${deleted.deletedCount} utilisateur(s) supprimé(s)\n`);
    
    // Créer superadmin avec mot de passe connu
    const superHash = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await DashboardUser.create({
      username: 'superadmin',
      email: 'superadmin@cem.com',
      password: superHash,
      fullName: 'المدير العام',
      role: 'super_admin',
      isActive: true
    });
    console.log('✅ Super Admin créé:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    
    // Créer admin
    const adminHash = await bcrypt.hash('admin123', 10);
    await DashboardUser.create({
      username: 'admin',
      email: 'admin@cem.com',
      password: adminHash,
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin créé: admin / admin123');
    
    // Créer teacher
    const teacherHash = await bcrypt.hash('teacher123', 10);
    await DashboardUser.create({
      username: 'teacher',
      email: 'teacher@cem.com',
      password: teacherHash,
      fullName: 'أستاذ',
      role: 'teacher',
      isActive: true
    });
    console.log('✅ Teacher créé: teacher / teacher123');
    
    // Tester superadmin
    const testUser = await DashboardUser.findOne({ username: 'superadmin' });
    const testMatch = await bcrypt.compare('superadmin123', testUser.password);
    console.log(`\n🔐 Test superadmin: ${testMatch ? '✅ OK' : '❌ ÉCHEC'}`);
    
    // Lister tous les utilisateurs
    const users = await DashboardUser.find().select('-password');
    console.log('\n📋 Utilisateurs:');
    users.forEach(u => {
      console.log(`   ${u.username} - ${u.role}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Prêt! Connectez-vous avec superadmin / superadmin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

cleanAndCreate();