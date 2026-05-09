const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const DashboardUser = require('../models/DashboardUser');

const initDB = async () => {
  try {
    // Connexion
    await mongoose.connect('mongodb://localhost:27017/madaureCEM');
    console.log('✅ Connecté à MongoDB\n');
    
    // Supprimer tous les utilisateurs
    await DashboardUser.deleteMany({});
    console.log('🗑️ Anciens utilisateurs supprimés\n');
    
    // Créer les utilisateurs avec bcrypt DIRECT
    const users = [
      { username: 'superadmin', password: 'superadmin123', role: 'super_admin', fullName: 'مدير عام' },
      { username: 'admin', password: 'admin123', role: 'admin', fullName: 'مدير النظام' },
      { username: 'teacher', password: 'teacher123', role: 'teacher', fullName: 'أستاذ' },
      { username: 'viewer', password: 'viewer123', role: 'viewer', fullName: 'مشاهد' }
    ];
    
    for (const userData of users) {
      const hash = bcrypt.hashSync(userData.password, 10);
      const user = new DashboardUser({
        username: userData.username,
        email: `${userData.username}@cem.com`,
        password: hash,
        fullName: userData.fullName,
        role: userData.role,
        isActive: true
      });
      await user.save();
      console.log(`✅ ${userData.username} - ${userData.password}`);
    }
    
    // Vérification
    console.log('\n🔐 Vérification:');
    const testUser = await DashboardUser.findOne({ username: 'admin' });
    const testMatch = bcrypt.compareSync('admin123', testUser.password);
    console.log(`   admin / admin123: ${testMatch ? '✅ OK' : '❌ FAIL'}`);
    
    await mongoose.disconnect();
    console.log('\n✅ Initialisation terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};

initDB();