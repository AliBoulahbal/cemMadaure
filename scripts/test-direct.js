const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const DashboardUser = require('../models/DashboardUser');

const testDirect = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté\n');
    
    // Supprimer tous
    await DashboardUser.deleteMany({});
    console.log('🗑️ Supprimé\n');
    
    // Créer un utilisateur avec bcrypt DIRECT
    const plainPassword = 'super123';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(plainPassword, salt);
    
    console.log('Plain password:', plainPassword);
    console.log('Generated hash:', hash);
    
    const user = await DashboardUser.create({
      username: 'superadmin',
      email: 'superadmin@cem.com',
      password: hash,
      fullName: 'Super Admin',
      role: 'super_admin',
      isActive: true
    });
    
    console.log('\n✅ Utilisateur créé');
    console.log('   ID:', user._id);
    console.log('   Stored hash:', user.password);
    
    // Test 1: bcrypt.compare DIRECT
    const directCompare = bcrypt.compareSync(plainPassword, user.password);
    console.log('\n🔐 Test 1 (bcrypt.compareSync):', directCompare ? '✅ OK' : '❌ FAIL');
    
    // Test 2: méthode comparePassword
    const methodCompare = user.comparePassword(plainPassword);
    console.log('🔐 Test 2 (user.comparePassword):', methodCompare ? '✅ OK' : '❌ FAIL');
    
    // Test 3: créer un nouveau hash
    const newHash = bcrypt.hashSync(plainPassword, 10);
    const newCompare = bcrypt.compareSync(plainPassword, newHash);
    console.log('🔐 Test 3 (new hash):', newCompare ? '✅ OK' : '❌ FAIL');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

testDirect();