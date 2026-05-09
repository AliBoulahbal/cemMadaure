const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' });

const DashboardUser = require('../models/DashboardUser');

const initAll = async () => {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté à MongoDB\n');
    
    // Supprimer tous les utilisateurs existants
    const deleted = await DashboardUser.deleteMany({});
    console.log(`🗑️ ${deleted.deletedCount} utilisateurs supprimés\n`);
    
    // Créer Super Admin
    const superAdminHash = await bcrypt.hash('superadmin123', 10);
    const superAdmin = await DashboardUser.create({
      username: 'superadmin',
      email: 'superadmin@cem.com',
      password: superAdminHash,
      fullName: 'المدير العام',
      role: 'super_admin',
      isActive: true
    });
    console.log('✅ Super Admin créé:');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    
    // Créer Admin
    const adminHash = await bcrypt.hash('admin123', 10);
    await DashboardUser.create({
      username: 'admin',
      email: 'admin@cem.com',
      password: adminHash,
      fullName: 'مدير النظام',
      role: 'admin',
      isActive: true
    });
    console.log('✅ Admin créé:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    
    // Créer Teacher
    const teacherHash = await bcrypt.hash('teacher123', 10);
    await DashboardUser.create({
      username: 'teacher',
      email: 'teacher@cem.com',
      password: teacherHash,
      fullName: 'أستاذ نموذجي',
      role: 'teacher',
      isActive: true
    });
    console.log('✅ Teacher créé:');
    console.log('   Username: teacher');
    console.log('   Password: teacher123');
    
    // Lister tous les utilisateurs
    const users = await DashboardUser.find().select('-password');
    console.log('\n📋 Liste des utilisateurs:');
    users.forEach(u => {
      console.log(`   ${u.username} - ${u.fullName} - ${u.role}`);
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Initialisation terminée !');
    console.log('\n🔐 Connectez-vous avec:');
    console.log('   http://localhost:3001/login');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initAll();