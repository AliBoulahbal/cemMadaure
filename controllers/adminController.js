const DashboardUser = require('../models/DashboardUser');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const Lesson = require('../models/Lesson');
const Content = require('../models/Content');
const Unit = require('../models/Unit');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

// Formulaire de login
exports.loginForm = (req, res) => {
  res.render('auth/login', { title: 'تسجيل الدخول', layout: false });
};

// Connexion
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const admin = await DashboardUser.findOne({ 
      $or: [{ username }, { email: username }] 
    });
    
    if (!admin) {
      return res.render('auth/login', { 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة', 
        title: 'تسجيل الدخول', 
        layout: false 
      });
    }
    
    const bcrypt = require('bcryptjs');
    const isMatch = bcrypt.compareSync(password, admin.password);
    
    if (!isMatch) {
      return res.render('auth/login', { 
        error: 'اسم المستخدم أو كلمة المرور غير صحيحة', 
        title: 'تسجيل الدخول', 
        layout: false 
      });
    }
    
    req.session.user = {
      id: admin._id,
      username: admin.username,
      fullName: admin.fullName,
      email: admin.email,
      role: admin.role
    };
    
    res.redirect('/dashboard');
  } catch (error) {
    console.error(error);
    res.render('auth/login', { 
      error: error.message, 
      title: 'تسجيل الدخول', 
      layout: false 
    });
  }
};

// Déconnexion
exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect('/login');
};

// Dashboard
exports.dashboard = async (req, res) => {
  try {
    const stats = {
      totalBranches: await Branch.countDocuments(),
      totalSubjects: await Subject.countDocuments(),
      totalUnits: await Unit.countDocuments(),
      totalLessons: await Lesson.countDocuments(),
      totalContents: await Content.countDocuments(),
      totalVideos: await Content.countDocuments({ type: 'video' }),
      totalPdfs: await Content.countDocuments({ type: 'pdf' }),
      totalTexts: await Content.countDocuments({ type: 'text' }),
      totalQuizzes: await Content.countDocuments({ type: 'quiz' }),
      totalImages: await Content.countDocuments({ type: 'image' }),
      totalQuestions: await Quiz.countDocuments(),
      totalAttempts: await QuizAttempt.countDocuments(),
      totalUsers: await User.countDocuments(),
      totalAdmins: await DashboardUser.countDocuments()
    };
    
    const recentLessons = await Lesson.find()
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    res.render('dashboard', { 
      title: 'لوحة التحكم', 
      stats, 
      recentLessons
    });
  } catch (error) {
    console.error(error);
    res.render('dashboard', { 
      title: 'لوحة التحكم', 
      error: error.message,
      stats: {},
      recentLessons: []
    });
  }
};

// API Statistiques
exports.getStats = async (req, res) => {
  try {
    const stats = {
      branches: await Branch.countDocuments(),
      subjects: await Subject.countDocuments(),
      units: await Unit.countDocuments(),
      lessons: await Lesson.countDocuments(),
      videos: await Content.countDocuments({ type: 'video' }),
      pdfs: await Content.countDocuments({ type: 'pdf' }),
      quizzes: await Content.countDocuments({ type: 'quiz' }),
      users: await User.countDocuments(),
      admins: await DashboardUser.countDocuments()
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};