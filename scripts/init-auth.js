const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const initAuth = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté à MongoDB\n');
    
    // Supprimer les anciens utilisateurs
    await DashboardUser.deleteMany({});
    console.log('🗑️ Anciens utilisateurs supprimés\n');
    
    // Créer les utilisateurs avec des hash bcrypt corrects
    const users = [
      {
        username: 'superadmin',
        email: 'superadmin@cem.com',
        password: await bcrypt.hash('superadmin123', 10),
        fullName: 'المدير العام',
        role: 'super_admin',
        isActive: true
      },
      {
        username: 'admin',
        email: 'admin@cem.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'مدير النظام',
        role: 'admin',
        isActive: true
      },
      {
        username: 'teacher',
        email: 'teacher@cem.com',
        password: await bcrypt.hash('teacher123', 10),
        fullName: 'أستاذ',
        role: 'teacher',
        isActive: true
      },
      {
        username: 'viewer',
        email: 'viewer@cem.com',
        password: await bcrypt.hash('viewer123', 10),
        fullName: 'مشاهد',
        role: 'viewer',
        isActive: true
      }
    ];
    
    for (const user of users) {
      await DashboardUser.create(user);
      console.log(`✅ Utilisateur créé: ${user.username} / ${user.username === 'superadmin' ? 'superadmin123' : (user.username === 'admin' ? 'admin123' : (user.username === 'teacher' ? 'teacher123' : 'viewer123'))}`);
    }
    
    // Vérification
    const testUser = await DashboardUser.findOne({ username: 'superadmin' });
    const isValid = await bcrypt.compare('superadmin123', testUser.password);
    console.log(`\n🔐 Test superadmin: ${isValid ? '✅ OK' : '❌ ÉCHEC'}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Initialisation terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

initAuth();