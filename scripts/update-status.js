// update-status.js
const mongoose = require('mongoose');
require('dotenv').config();

const updateAllStatuses = async () => {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/votre_base');
    console.log('✅ Connecté à MongoDB');

    // 1. Mettre à jour les Sujets
    const subjectResult = await mongoose.connection.db.collection('subjects').updateMany(
      {},
      { $set: { status: 'PUBLISHED' } }
    );
    console.log(`✅ Sujets: ${subjectResult.modifiedCount} modifiés`);

    // 2. Mettre à jour les Unités
    const unitResult = await mongoose.connection.db.collection('units').updateMany(
      {},
      { $set: { status: 'PUBLISHED' } }
    );
    console.log(`✅ Unités: ${unitResult.modifiedCount} modifiés`);

    // 3. Mettre à jour les Leçons
    const lessonResult = await mongoose.connection.db.collection('lessons').updateMany(
      {},
      { $set: { status: 'PUBLISHED' } }
    );
    console.log(`✅ Leçons: ${lessonResult.modifiedCount} modifiés`);

    // 4. Mettre à jour le Contenu
    const contentResult = await mongoose.connection.db.collection('contents').updateMany(
      {},
      { $set: { status: 'PUBLISHED' } }
    );
    console.log(`✅ Contenu: ${contentResult.modifiedCount} modifiés`);

    // 5. Mettre à jour les Quiz
    const quizResult = await mongoose.connection.db.collection('quizzes').updateMany(
      {},
      { $set: { status: 'published' } }
    );
    console.log(`✅ Quiz: ${quizResult.modifiedCount} modifiés`);

    console.log('\n🎉 MISE À JOUR TERMINÉE !');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

updateAllStatuses();