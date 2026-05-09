const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const methodOverride = require('method-override');
const exphbs = require('express-handlebars');
const moment = require('moment');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');

dotenv.config();

const app = express();

// Database connection - Appeler après les imports
const connectDB = require('./config/db');

// Handlebars avec helpers pour l'arabe
const hbs = exphbs.create({
  helpers: {
    formatDate: (date) => date ? moment(date).format('DD/MM/YYYY') : '',
    includes: function(array, value) {
      if (!array || !Array.isArray(array)) return false;
      return array.includes(value);
    },
    eq: (a, b) => a == b,
    neq: (a, b) => a != b,
    gt: (a, b) => a > b,
    ne: (a, b) => a != b,
    lt: (a, b) => a < b,
    gte: (a, b) => a >= b,
    lte: (a, b) => a <= b,
    inc: (value) => parseInt(value) + 1,
    addOne: (index) => parseInt(index) + 1,
    json: (context) => JSON.stringify(context, null, 2),
    or: (a, b) => a || b,
    and: (a, b) => a && b,
    toString: (value) => {
      if (!value) return '';
      if (typeof value === 'object' && value._id) return value._id.toString();
      return value.toString();
    },
    inc: (value) => parseInt(value) + 1,
    eq: (a, b) => a === b,
    // Pour les nombres décimaux
    formatDuration: (duration) => {
      if (!duration) return '0';
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      if (minutes > 0) {
        return `${minutes} min ${seconds} sec`;
      }
      return `${seconds} sec`;
    },
    formatDateTimeLocal: (date) => {
    if (!date) return '';
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
},
    hasRole: (userRole, allowedRoles) => {
      if (!allowedRoles) return false;
      const roles = allowedRoles.split(',');
      return roles.includes(userRole);
    },
    canAccess: (userRole, section) => {
      const permissions = {
        'super_admin': ['all'],
        'admin': ['dashboard', 'academic', 'content', 'quiz', 'reports', 'users'],
        'teacher': ['dashboard', 'academic', 'content', 'quiz'],
        'viewer': ['dashboard', 'academic']
      };
      return permissions[userRole]?.includes(section) || permissions[userRole]?.includes('all');
    },
    // Convertit ObjectId en string pour les URLs Handlebars
    toString: (value) => value ? value.toString() : '',
    not: (value) => !value
  },
  defaultLayout: 'main',
  extname: '.handlebars'
});

app.engine('.handlebars', hbs.engine);
app.set('view engine', '.handlebars');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({ 
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/madaureCEM'
  }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: false
  }
}));

// Flash middleware
app.use(flash());

// Routes de debug
app.get('/force-logout', (req, res) => {
  req.session.destroy();
  res.send('Session détruite. <a href="/login">Retour au login</a>');
});

app.get('/debug-session', (req, res) => {
  res.json({
    sessionID: req.sessionID,
    session: req.session,
    hasSession: !!req.session,
    hasUser: !!req.session?.user
  });
});

app.get('/clear-cookie', (req, res) => {
  res.clearCookie('connect.sid');
  res.send('Cookie supprimé. <a href="/login">Retour au login</a>');
});

// Middleware pour activer le lien actif dans le sidebar et compter les notifications
app.use(async (req, res, next) => {
  res.locals.user = req.session?.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.info = req.flash('info');
  res.locals.warning = req.flash('warning');
  
  const currentPath = req.path;
  res.locals.active = {
    dashboard: currentPath === '/dashboard' || currentPath === '/',
    branch: currentPath.startsWith('/branch'),
    subject: currentPath.startsWith('/subject'),
    unit: currentPath.startsWith('/unit'),
    lesson: currentPath.startsWith('/lesson'),
    lessonPart: currentPath.startsWith('/lesson-part'),  // ⭐ AJOUTÉ
    quiz: currentPath.startsWith('/quiz'),
    upload: currentPath.startsWith('/content/upload'),
    recent: currentPath.startsWith('/content/recent'),
    users: currentPath.startsWith('/users'),
    quizAttempt: currentPath.startsWith('/quiz-attempt'),
    activity: currentPath.startsWith('/activity'),
    approval: currentPath.startsWith('/approval'),
    permissions: currentPath.startsWith('/permissions'),
    adminUsers: currentPath.startsWith('/admin-users')
  };
  
  // Compter les éléments en attente pour le badge (admin et super_admin seulement)
  if (req.session?.user && (req.session.user.role === 'admin' || req.session.user.role === 'super_admin')) {
    try {
      const Unit = require('./models/Unit');
      const Lesson = require('./models/Lesson');
      const Subject = require('./models/Subject');
      const Content = require('./models/Content');
      
      const [pendingUnits, pendingLessons, pendingSubjects, pendingContents] = await Promise.all([
        Unit.countDocuments({ status: 'PENDING' }),
        Lesson.countDocuments({ status: 'PENDING' }),
        Subject.countDocuments({ status: 'PENDING' }),
        Content.countDocuments({ status: 'PENDING' })
      ]);
      
      res.locals.pendingCount = pendingUnits + pendingLessons + pendingSubjects + pendingContents;
    } catch (error) {
      console.error('Erreur comptage pending:', error);
      res.locals.pendingCount = 0;
    }
  } else {
    res.locals.pendingCount = 0;
  }
  
  next();
});

// Importer les middlewares après la configuration
const { auth, guest, isAdmin, isSuperAdmin } = require('./middleware/auth-dev');

// Démarrer la connexion DB puis les routes
const startServer = async () => {
  try {
    await connectDB();
    
    // Routes
    app.use('/', require('./routes/adminRoutes'));
    app.use('/subject', require('./routes/subjectRoutes'));
    app.use('/branch', require('./routes/branchRoutes'));
    app.use('/unit', require('./routes/unitRoutes'));
    app.use('/lesson', require('./routes/lessonRoutes'));
    app.use('/content', require('./routes/contentRoutes'));
    app.use('/users', require('./routes/userRoutes'));
    app.use('/quiz', require('./routes/quizRoutes'));
    app.use('/lesson-part', require('./routes/lessonPartRoutes'));
    app.use('/quiz-attempt', require('./routes/quizAttemptRoutes'));
    app.use('/admin-users', require('./routes/adminUserRoutes'));
    app.use('/activity', require('./routes/activityRoutes'));
    app.use('/approval', require('./routes/approvalRoutes'));
    app.use('/permissions', require('./routes/permissionRoutes'));
    app.use('/notifications', require('./routes/notificationRoutes'));
    app.use('/api/mobile', require('./routes/mobileRoutes'));
    app.use('/api/progression', require('./routes/progressionRoutes'));
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
    app.use(express.static('public'));
    app.use('/uploads', express.static('uploads'));
    // Dans la section des routes, ajoutez :
    app.use('/vimeo-code', require('./routes/vimeoCodeRoutes'));
    
    // Error handlers
    app.use((req, res) => {
      res.status(404).render('errors/404', { title: 'الصفحة غير موجودة' });
    });
    
    app.use((err, req, res, next) => {
      console.error(err);
      res.status(500).render('errors/500', { title: 'خطأ في الخادم', error: err.message });
    });
    
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📝 Comptes disponibles:`);
      console.log(`   superadmin / superadmin123`);
      console.log(`   admin / admin123`);
      console.log(`   teacher / teacher123`);
      console.log(`🌐 Interface en arabe RTL`);
    });
  } catch (error) {
    console.error('Erreur au démarrage:', error);
    process.exit(1);
  }
};

startServer();