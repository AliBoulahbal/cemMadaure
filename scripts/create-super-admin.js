// scripts/create-super-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB');
    
    // Supprimer l'ancien s'il existe
    await DashboardUser.deleteMany({ role: 'super_admin' });
    
    const hashedPassword = await bcrypt.hash('superadmin123', 10);
    
    await DashboardUser.create({
      username: 'superadmin',
      email: 'superadmin@cem.com',
      password: hashedPassword,
      fullName: 'المدير العام',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('✅ Super Admin créé avec succès!');
    console.log('   Username: superadmin');
    console.log('   Password: superadmin123');
    
    // Lister tous les utilisateurs
    const users = await DashboardUser.find().select('-password');
    console.log('\n📋 Utilisateurs:');
    users.forEach(u => {
      console.log(`   ${u.username} - ${u.fullName} - ${u.role}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createSuperAdmin();