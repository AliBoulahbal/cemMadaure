const mongoose = require('mongoose');
require('dotenv').config();

const Teacher = require('../models/Teacher');
const Branch = require('../models/Branch');  // Branch = années scolaires
const Subject = require('../models/Subject'); // Subject = matières

const createTeachers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connecté à MongoDB\n');
    
    // Récupérer les années (Branch)
    const branches = await Branch.find();
    console.log('📚 Années scolaires disponibles:');
    branches.forEach(b => console.log(`   - ${b.name} (${b._id})`));
    
    // Récupérer les matières (Subject)
    const subjects = await Subject.find();
    console.log('\n📖 Matières disponibles:');
    subjects.forEach(s => console.log(`   - ${s.name} (${s._id})`));
    
    if (branches.length === 0) {
      console.log('❌ Aucune année trouvée. Créez d\'abord des années scolaires.');
      process.exit(1);
    }
    
    if (subjects.length === 0) {
      console.log('❌ Aucune matière trouvée. Créez d\'abord des matières.');
      process.exit(1);
    }
    
    // Supprimer les anciens professeurs
    const deleted = await Teacher.deleteMany({});
    if (deleted.deletedCount > 0) {
      console.log(`\n🗑️ ${deleted.deletedCount} anciens professeurs supprimés`);
    }
    
    const teachersData = [];
    
    // Créer des professeurs pour chaque matière et chaque année
    for (const branch of branches) {
      for (const subject of subjects) {
        teachersData.push({
          fullName: `أستاذ ${subject.name} - ${branch.name}`,
          email: `teacher.${subject.name.toLowerCase()}.${branch.name.toLowerCase()}@cem.com`,
          phone: `0555${Math.floor(Math.random() * 9000000 + 1000000)}`,
          branch: branch.name,           // Nom de l'année
          branchId: branch._id,          // ID de l'année
          photoUrl: '',
          experienceYear: Math.floor(Math.random() * 15) + 3,
          active: true,
          level: ['أستاذ رئيسي', 'أستاذ مكون', 'أستاذ', 'أستاذ مساعد'][Math.floor(Math.random() * 4)],
          description: `أستاذ متخصص في تدريس ${subject.name} - ${branch.name}`,
          isFree: Math.random() > 0.5,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
    
    for (const teacherData of teachersData) {
      const existing = await Teacher.findOne({ email: teacherData.email });
      if (!existing) {
        const teacher = await Teacher.create(teacherData);
        console.log(`✅ Professeur créé: ${teacher.fullName}`);
      } else {
        console.log(`⚠️ Professeur existe déjà: ${teacherData.fullName}`);
      }
    }
    
    // Afficher la liste des professeurs
    const teachers = await Teacher.find();
    console.log(`\n📊 Total: ${teachers.length} professeurs`);
    teachers.forEach(t => {
      console.log(`   - ${t.fullName} (${t.branch}) - ${t.isFree ? 'Gratuit' : 'Payant'}`);
    });
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
};

createTeachers();