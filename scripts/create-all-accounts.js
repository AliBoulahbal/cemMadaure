const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const createAllAccounts = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Supprimer tous les anciens comptes
    await DashboardUser.deleteMany({});
    console.log('🗑️ Anciens comptes supprimés\n');
    
    // Liste des comptes avec mots de passe SIMPLES
    const accounts = [
      {
        username: 'superadmin',
        email: 'superadmin@cem.com',
        password: 'super123',
        fullName: 'Super Administrateur',
        role: 'super_admin'
      },
      {
        username: 'admin',
        email: 'admin@cem.com',
        password: 'admin123',
        fullName: 'Administrateur',
        role: 'admin'
      },
      {
        username: 'teacher',
        email: 'teacher@cem.com',
        password: 'teacher123',
        fullName: 'Professeur',
        role: 'teacher'
      },
      {
        username: 'viewer',
        email: 'viewer@cem.com',
        password: 'viewer123',
        fullName: 'Observateur',
        role: 'viewer'
      }
    ];
    
    for (const acc of accounts) {
      const hash = await bcrypt.hash(acc.password, 10);
      await DashboardUser.create({
        username: acc.username,
        email: acc.email,
        password: hash,
        fullName: acc.fullName,
        role: acc.role,
        isActive: true
      });
      console.log(`✅ ${acc.username} / ${acc.password} (${acc.role})`);
    }
    
    // Vérification
    console.log('\n🔐 Vérification des mots de passe:');
    for (const acc of accounts) {
      const user = await DashboardUser.findOne({ username: acc.username });
      const isValid = await bcrypt.compare(acc.password, user.password);
      console.log(`   ${acc.username}: ${isValid ? '✅ OK' : '❌ ÉCHEC'}`);
    }
    
    await mongoose.disconnect();
    console.log('\n✅ Tous les comptes sont prêts!');
    console.log('\n🔐 Pour vous connecter:');
    console.log('   http://localhost:3001/login');
    console.log('   superadmin / super123');
    console.log('   admin / admin123');
    console.log('   teacher / teacher123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createAllAccounts();