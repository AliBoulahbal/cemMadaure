const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const createSimple = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Supprimer tous
    await DashboardUser.deleteMany({});
    console.log('🗑️ Supprimé\n');
    
    // Mot de passe simple
    const password = '123456';
    const hash = bcrypt.hashSync(password, 10);
    
    console.log('Password:', password);
    console.log('Hash:', hash);
    
    const user = await DashboardUser.create({
      username: 'admin',
      email: 'admin@cem.com',
      password: hash,
      fullName: 'Administrateur',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('\n✅ Utilisateur créé');
    
    // Vérification
    const isMatch = bcrypt.compareSync(password, user.password);
    console.log('Vérification:', isMatch ? '✅ OK' : '❌ FAIL');
    
    await mongoose.disconnect();
    console.log('\n✅ Connectez-vous avec:');
    console.log('   Username: admin');
    console.log('   Password: 123456');
    
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

createSimple();