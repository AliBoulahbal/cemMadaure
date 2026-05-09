const mongoose = require('mongoose');
require('dotenv').config();

const SoldToken = require('../models/SoldToken');

const generateKeys = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Supprimer les anciennes clés de test (optionnel)
    await SoldToken.deleteMany({ code: 'TEST' });
    
    // Générer 10 clés de test
    const keys = [];
    for (let i = 1; i <= 10; i++) {
      const key = `TEST${String(i).padStart(3, '0')}`;
      keys.push({
        key: key,
        code: 'TEST',
        generatedAt: new Date(),
        sold: false,
        consumed: false
      });
    }
    
    await SoldToken.insertMany(keys);
    
    console.log('✅ Clés générées:');
    keys.forEach(k => console.log(`   - ${k.key}`));
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

generateKeys();