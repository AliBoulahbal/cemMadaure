const jwt = require('jsonwebtoken');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const Lesson = require('../models/Lesson');
const Content = require('../models/Content');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Contract = require('../models/Contract');
const SoldToken = require('../models/SoldToken');
const User = require('../models/User');
const Teacher = require('../models/Teacher');
const OTP = require('../models/OTP');
const Progression = require('../models/Progression');
const LessonPart = require('../models/LessonPart');
const VimeoCode = require('../models/VimeoCode');

// ==================== AUTHENTIFICATION ====================
exports.getToken = async (req, res) => {
  try {
    const { deviceId } = req.params;
    
    if (!deviceId || deviceId.trim() === "") {
      const unsignedToken = jwt.sign(
        { deviceId: "", signed: false },
        process.env.SECRET_KEY || 'secret-key',
        { expiresIn: "365d" }
      );
      return res.send(unsignedToken);
    }
    
    const contract = await Contract.findOne({ 
      deviceId: deviceId, 
      status: 'ACTIVE',
      expiringDate: { $gt: new Date() }
    });
    
    if (contract) {
      const user = await User.findOne({ deviceId: deviceId });
      
      const signedPayload = {
        deviceId: deviceId,
        contractId: contract._id.toString(),
        key: contract.soldKey,
        clientId: user ? user._id.toString() : null,
        signed: true,
        deleted: false
      };
      
      const signedToken = jwt.sign(
        signedPayload,
        process.env.SECRET_KEY || 'secret-key',
        { expiresIn: "365d" }
      );
      
      return res.send(signedToken);
    }
    
    const unsignedPayload = {
      deviceId: deviceId,
      signed: false
    };
    
    const unsignedToken = jwt.sign(
      unsignedPayload,
      process.env.SECRET_KEY || 'secret-key',
      { expiresIn: "365d" }
    );
    
    res.send(unsignedToken);
  } catch (error) {
    console.error('Erreur getToken:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== CLIENT ====================
exports.createClient = async (req, res) => {
  try {
    const { deviceId, firstName, lastName, email, phone, branchId } = req.body;
    
    let user = await User.findOne({ deviceId });
    
    if (!user) {
      user = await User.create({
        deviceId,
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        phone: phone || "",
        branches: branchId ? [branchId] : [],
        userType: 2
      });
    }
    
    const contract = await Contract.findOne({ 
      deviceId: deviceId, 
      status: 'ACTIVE',
      expiringDate: { $gt: new Date() }
    });
    
    res.json({
      id: user._id,
      deviceId: user.deviceId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      contractId: contract?._id || null,
      userType: user.userType
    });
  } catch (error) {
    console.error('Erreur createClient:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    
    const user = await User.findById(clientId)
      .populate('branches', 'name')
      .lean();
    
    if (!user) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    
    const contract = await Contract.findOne({ 
      deviceId: user.deviceId, 
      status: 'ACTIVE',
      expiringDate: { $gt: new Date() }
    });
    
    res.json({
      id: user._id,
      deviceId: user.deviceId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      branches: user.branches,
      contractId: contract?._id || null,
      userType: user.userType
    });
  } catch (error) {
    console.error('Erreur getClient:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateClient = async (req, res) => {
  try {
    const { clientId } = req.params;
    const { firstName, lastName, email, phone, branchId } = req.body;
    
    const user = await User.findById(clientId);
    if (!user) {
      return res.status(404).json({ error: "Client non trouvé" });
    }
    
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (branchId && !user.branches.includes(branchId)) {
      user.branches.push(branchId);
    }
    
    await user.save();
    
    res.json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      branches: user.branches
    });
  } catch (error) {
    console.error('Erreur updateClient:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== BRANCHES ====================
exports.getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ order: 1 }).lean();
    
    const formattedBranches = branches.map(branch => ({
      id: branch._id,
      name: branch.name,
      order: branch.order
    }));
    
    res.json(formattedBranches);
  } catch (error) {
    console.error('Erreur getBranches:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== SUBJECTS ====================
exports.getSubjectsByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    
    const subjects = await Subject.find({ branchId })
      .sort({ order: 1, name: 1 })
      .lean();
    
    const formattedSubjects = subjects.map(subject => ({
      id: subject._id,
      name: subject.name,
      branchId: subject.branchId,
      order: subject.order,
      icon: subject.icon || 'fa-book',
      color: subject.color || 'primary'
    }));
    
    res.json(formattedSubjects);
  } catch (error) {
    console.error('Erreur getSubjectsByBranch:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find()
      .sort({ name: 1 })
      .lean();
    
    const formattedSubjects = subjects.map(subject => ({
      id: subject._id,
      name: subject.name,
      branchId: subject.branchId,
      order: subject.order,
      icon: subject.icon || 'fa-book',
      color: subject.color || 'primary'
    }));
    
    res.json(formattedSubjects);
  } catch (error) {
    console.error('Erreur getAllSubjects:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getSubjectsGroupedByBranch = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ order: 1 }).lean();
    const allSubjects = await Subject.find().lean();
    
    const result = branches.map(branch => ({
      branch: {
        id: branch._id,
        name: branch.name,
        order: branch.order
      },
      subjects: allSubjects
        .filter(s => s.branchId && s.branchId.toString() === branch._id.toString())
        .map(s => ({
          id: s._id,
          name: s.name,
          order: s.order,
          icon: s.icon || 'fa-book',
          color: s.color || 'primary'
        }))
        .sort((a, b) => a.order - b.order)
    })).filter(b => b.subjects.length > 0);
    
    res.json(result);
  } catch (error) {
    console.error('Erreur getSubjectsGroupedByBranch:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== UNITS ====================
exports.getUnitsBySubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const units = await Unit.find({ subjectId })
      .sort({ order: 1 })
      .lean();
    
    const formattedUnits = units.map(unit => ({
      id: unit._id,
      name: unit.name,
      subject: unit.subjectId,
      branch: unit.branchId,
      order: unit.order,
      description: unit.description || '',
      url: unit.url || '',
      image: unit.image || '',
      status: unit.status
    }));
    
    res.json(formattedUnits);
  } catch (error) {
    console.error('Erreur getUnitsBySubjectId:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== LESSONS ====================
exports.getLessonsBySubjectId = async (req, res) => {
  try {
    const { subjectId } = req.params;
    // clientId depuis JWT (middleware) ou query param fallback
    const clientId = req.user?.clientId || req.user?.id || req.query.clientId;

    const lessons = await Lesson.find({
      subjectId,
      status: { $in: ['PUBLISHED', 'PENDING'] }
    })
      .populate('unitId', 'name order')
      .sort({ order: 1 })
      .lean();

    // Charger toutes les progressions du client en une seule requête
    let progressionMap = {};
    if (clientId) {
      const lessonIds = lessons.map(l => l._id);
      const progressions = await Progression.find({
        clientId,
        lessonId: { $in: lessonIds }
      }).lean();

      for (const prog of progressions) {
        const sum = (prog.progressionsPart || []).reduce((acc, p) => acc + (p.percentage || 0), 0);
        progressionMap[prog.lessonId.toString()] = Math.min(Math.round(sum), 100);
      }
    }

    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      name: lesson.name,
      description: lesson.description || '',
      order: lesson.order,
      unit: lesson.unitId?.name || '',
      unitId: lesson.unitId?._id || lesson.unitId,
      branch: lesson.branchId || '',
      subject: lesson.subjectId || '',
      isFree: lesson.isFree || false,
      duration: lesson.duration || 0,
      quiz: lesson.quiz || 0,
      remarque: lesson.remarque || '',
      createdBy: lesson.createdBy || '',
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      percentage: progressionMap[lesson._id.toString()] ?? 0
    }));

    return res.json(formattedLessons);
  } catch (error) {
    console.error('Erreur getLessonsBySubjectId:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getLessonsBySubjectIdOrderedByUnitOrder = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const clientId = req.user?.clientId || req.user?.id || req.query.clientId;

    const lessons = await Lesson.find({ subjectId, status: 'PUBLISHED' })
      .populate('unitId', 'name order')
      .sort({ 'unitId.order': 1, order: 1 })
      .lean();

    let progressionMap = {};
    if (clientId) {
      const lessonIds = lessons.map(l => l._id);
      const progressions = await Progression.find({
        clientId,
        lessonId: { $in: lessonIds }
      }).lean();
      for (const prog of progressions) {
        const sum = (prog.progressionsPart || []).reduce((acc, p) => acc + (p.percentage || 0), 0);
        progressionMap[prog.lessonId.toString()] = Math.min(Math.round(sum), 100);
      }
    }

    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      name: lesson.name,
      description: lesson.description || '',
      order: lesson.order,
      unit: lesson.unitId?.name || '',
      unitId: lesson.unitId?._id || lesson.unitId,
      unitOrder: lesson.unitId?.order || 0,
      branch: lesson.branchId || '',
      subject: lesson.subjectId || '',
      isFree: lesson.isFree || false,
      duration: lesson.duration || 0,
      quiz: lesson.quiz || 0,
      remarque: lesson.remarque || '',
      createdBy: lesson.createdBy || '',
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      percentage: progressionMap[lesson._id.toString()] ?? 0
    }));

    return res.json(formattedLessons);
  } catch (error) {
    console.error('Erreur getLessonsBySubjectIdOrderedByUnitOrder:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getLessonsBySubjectIdOrderByCreateDate = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const clientId = req.user?.clientId || req.user?.id || req.query.clientId;

    const lessons = await Lesson.find({ subjectId, status: 'PUBLISHED' })
      .populate('unitId', 'name order')
      .sort({ createdAt: -1 })
      .lean();

    let progressionMap = {};
    if (clientId) {
      const lessonIds = lessons.map(l => l._id);
      const progressions = await Progression.find({
        clientId,
        lessonId: { $in: lessonIds }
      }).lean();
      for (const prog of progressions) {
        const sum = (prog.progressionsPart || []).reduce((acc, p) => acc + (p.percentage || 0), 0);
        progressionMap[prog.lessonId.toString()] = Math.min(Math.round(sum), 100);
      }
    }

    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      name: lesson.name,
      description: lesson.description || '',
      order: lesson.order,
      unit: lesson.unitId?.name || '',
      unitId: lesson.unitId?._id || lesson.unitId,
      branch: lesson.branchId || '',
      subject: lesson.subjectId || '',
      isFree: lesson.isFree || false,
      duration: lesson.duration || 0,
      quiz: lesson.quiz || 0,
      remarque: lesson.remarque || '',
      createdBy: lesson.createdBy || '',
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt,
      percentage: progressionMap[lesson._id.toString()] ?? 0
    }));

    return res.json(formattedLessons);
  } catch (error) {
    console.error('Erreur getLessonsBySubjectIdOrderByCreateDate:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.getLessonsBySubjectIdForFree = async (req, res) => {
  try {
    const { subjectId } = req.params;
    
    const lessons = await Lesson.find({ 
      subjectId: subjectId,
      status: 'PUBLISHED',
      isFree: true
    })
      .sort({ order: 1 })
      .lean();
    
    const formattedLessons = lessons.map(lesson => ({
      id: lesson._id,
      name: lesson.name,
      description: lesson.description || '',
      order: lesson.order,
      duration: lesson.duration || 0,
      quiz: lesson.quiz || 0
    }));
    
    res.json(formattedLessons);
  } catch (error) {
    console.error('Erreur getLessonsBySubjectIdForFree:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getLessonDetails = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const lesson = await Lesson.findOne({
      _id: lessonId,
      status: 'PUBLISHED'
    })
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .lean();
    
    if (!lesson) {
      return res.status(404).json({ error: "Leçon non trouvée" });
    }
    
    res.json({
      id: lesson._id,
      name: lesson.name,
      description: lesson.description,
      order: lesson.order,
      isFree: lesson.isFree,
      duration: lesson.duration,
      branch: lesson.branchId?.name,
      branchId: lesson.branchId?._id,
      subject: lesson.subjectId?.name,
      subjectId: lesson.subjectId?._id,
      unit: lesson.unitId?.name,
      unitId: lesson.unitId?._id,
      createdAt: lesson.createdAt,
      updatedAt: lesson.updatedAt
    });
  } catch (error) {
    console.error('Erreur getLessonDetails:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== CONTENT (Ancien modèle) ====================
// ==================== LESSON PARTS — Format LessonPartDto Java ====================
// Retourne List<LessonPartDto> exactement comme attendu par l'app mobile Java.
// Chaque document dans documents[] devient un LessonPartDto séparé.
// Fallback sur les anciens champs url/body si documents[] est vide.
exports.getLessonPartsByLessonId = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lesson = await Lesson.findById(lessonId).lean();
    if (!lesson) {
      return res.status(404).json({ error: 'Lecon non trouvee' });
    }

    const lessonParts = await LessonPart.find({ lessonId })
      .sort({ partOrder: 1, order: 1 })
      .lean();

    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;

    const proxify = (url) => {
      if (url && url.includes('wasabisys.com')) {
        return `${baseUrl}/api/mobile/v1/proxy?url=${encodeURIComponent(url)}`;
      }
      return url || '';
    };

    const result = [];

    for (const part of lessonParts) {
      const base = {
        lessonId:  part.lessonId?.toString()  || '',
        lesson:    part.lesson   || '',
        branchId:  part.branchId?.toString()  || '',
        branch:    part.branch   || '',
        subjectId: part.subjectId?.toString() || '',
        subject:   part.subject  || '',
        unitId:    part.unitId?.toString()    || '',
        unit:      part.unit     || '',
        isFree:    part.isFree   || false,
        createdBy: part.createdBy || '',
        createdAt: part.createdAt ? part.createdAt.toISOString() : '',
        updatedAt: part.updatedAt ? part.updatedAt.toISOString() : ''
      };

      const docs = part.documents || [];

      if (docs.length > 0) {
        // Nouvelle structure : un LessonPartDto par document
        // Chaque document devient un objet séparé avec url (VIDEO) ou body (PDF/TEXT)
        docs
          .slice()
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach((doc, idx) => {
            result.push({
              ...base,
              id:       part._id.toString(),
              order:    (part.partOrder || part.order || 0) * 100 + idx,
              title:    doc.title || part.title || '',
              // VIDEO → url rempli, body vide
              // PDF   → url vide, body = URL Wasabi proxifiée
              // TEXT/QUIZ → url vide, body = contenu texte
              url:      doc.type === 'VIDEO' ? proxify(doc.url) : '',
              body:     doc.type === 'PDF'   ? proxify(doc.url)
                      : doc.type === 'TEXT' || doc.type === 'QUIZ' ? (doc.content || '')
                      : '',
              duration: doc.duration || part.duration || 0,
              type:     doc.type
            });
          });
      } else {
        // Fallback anciens champs url / body (données avant migration)
        result.push({
          ...base,
          id:       part._id.toString(),
          order:    part.order || 0,
          title:    part.title || '',
          url:      proxify(part.url),
          body:     proxify(part.body),
          duration: part.duration || 0,
          type:     part.type || 'TEXT'
        });
      }
    }

    result.sort((a, b) => a.order - b.order);

    res.json(result);

  } catch (error) {
    console.error('Erreur getLessonPartsByLessonId:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== QUIZ ====================
exports.getQuizByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    const quizzes = await Quiz.find({ 
      lessonId: lessonId,
      status: 'published'
    })
      .sort({ order: 1 })
      .lean();
    
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz._id,
      lessonId: quiz.lessonId,
      question: quiz.question,
      subQuestion: quiz.subQuestion || '',
      typeQuiz: quiz.typeQuiz,
      point: quiz.point,
      options: quiz.options.map(opt => ({
        id: opt._id,
        content: opt.content,
        isCorrect: opt.isCorrect
      })),
      explanation: quiz.explanation || ''
    }));
    
    res.json(formattedQuizzes);
  } catch (error) {
    console.error('Erreur getQuizByLesson:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getQuizListByLessonId = async (req, res) => {
  try {
    const { lessonId, clientId } = req.params;

    const quizzes = await Quiz.find({ lessonId, status: 'published' })
      .sort({ order: 1 })
      .lean();

    // Dernière tentative du client pour cette leçon
    const lastAttempt = await QuizAttempt.findOne({ lessonId, clientId })
      .sort({ createdAt: -1 })
      .lean();

    // Map quizId → soumission pour accès O(1)
    const submissionMap = {};
    if (lastAttempt && lastAttempt.submittedAnswers) {
      for (const s of lastAttempt.submittedAnswers) {
        submissionMap[s.quizId] = s;
      }
    }

    const formattedQuizzes = quizzes.map(quiz => {
      const quizIdStr = quiz._id.toString();
      const submission = submissionMap[quizIdStr] || null;

      let resultDto = null;

      if (submission) {
        const savedAnswers = submission.submittedAnswers || [];

        // Vérifier si les réponses sauvegardées sont déjà au format lettre (A/B/C/D)
        const hasLetterFormat = savedAnswers.some(
          a => /^[A-Da-d]$/.test((a || '').toString().trim())
        );

        let enrichedAnswers = [...savedAnswers];

        // Si les réponses sont des IDs d'options (pas des lettres),
        // les convertir en lettre + contenu pour que Android puisse les afficher
        if (!hasLetterFormat && quiz.options && quiz.options.length > 0) {
          enrichedAnswers = [];
          for (const savedAns of savedAnswers) {
            const idx = quiz.options.findIndex(
              o => o._id && o._id.toString() === savedAns.toString()
            );
            if (idx !== -1) {
              enrichedAnswers.push(String.fromCharCode(65 + idx)); // 0→A, 1→B...
              if (quiz.options[idx].content) {
                enrichedAnswers.push(quiz.options[idx].content);
              }
            } else {
              enrichedAnswers.push(savedAns);
            }
          }
        }

        resultDto = {
          submittedAnswers: enrichedAnswers,
          score: submission.score || 0
        };
      }

      return {
        id: quizIdStr,
        lessonId: quiz.lessonId,
        question: quiz.question,
        subQuestion: quiz.subQuestion || '',
        typeQuiz: quiz.typeQuiz,
        point: quiz.point,
        options: quiz.options.map(opt => ({
          id: opt._id,
          content: opt.content,
          isCorrect: opt.isCorrect
        })),
        explanation: quiz.explanation || '',
        resultDto
      };
    });

    return res.json(formattedQuizzes);
  } catch (error) {
    console.error('Erreur getQuizListByLessonId:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : résoudre les réponses Android vers les index d'options
//
// L'app Android envoie dans submittedAnswers un tableau qui peut contenir :
//   - Une lettre          : "A", "B", "C", "D"
//   - Le contenu textuel  : "الشعر الوحداني"
//   - L'ID de l'option    : "opt_abc123"  (cas futur)
//
// Cette fonction retourne l'index (0-3) de l'option correspondante dans quiz.options
// ─────────────────────────────────────────────────────────────────────────────
function resolveSelectedIndices(userAnswers, quizOptions) {
  const indices = [];
  if (!userAnswers || !quizOptions || quizOptions.length === 0) return indices;

  for (const token of userAnswers) {
    if (token == null) continue;
    const t = token.toString().trim();
    if (t === '') continue;

    // 1) Lettre A-D → index direct
    if (/^[A-Da-d]$/.test(t)) {
      const idx = t.toUpperCase().charCodeAt(0) - 65; // A=0, B=1...
      if (idx >= 0 && idx < quizOptions.length && !indices.includes(idx)) {
        indices.push(idx);
      }
      continue;
    }

    // 2) ID exact de l'option
    const byId = quizOptions.findIndex(
      o => o._id && o._id.toString() === t
    );
    if (byId !== -1 && !indices.includes(byId)) {
      indices.push(byId);
      continue;
    }

    // 3) Contenu textuel (insensible à la casse et espaces)
    const normalize = s => (s || '').toString().trim().replace(/\s+/g, ' ').toLowerCase();
    const tNorm = normalize(t);
    const byContent = quizOptions.findIndex(
      o => normalize(o.content) === tNorm
    );
    if (byContent !== -1 && !indices.includes(byContent)) {
      indices.push(byContent);
    }
  }

  return indices;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : calculer le score d'une réponse
// ─────────────────────────────────────────────────────────────────────────────
function calcScore(quiz, userAnswers) {
  const opts = quiz.options || [];

  // Index corrects selon la DB
  const correctIndices = opts
    .map((o, i) => (o.isCorrect ? i : -1))
    .filter(i => i !== -1);

  // Index soumis par l'Android
  const selectedIndices = resolveSelectedIndices(userAnswers, opts);

  let isCorrect = false;

  if (quiz.typeQuiz === 'SINGLESELECT') {
    isCorrect =
      selectedIndices.length === 1 &&
      correctIndices.length >= 1 &&
      selectedIndices[0] === correctIndices[0];
  } else {
    // MULTISELECT : même ensemble
    isCorrect =
      selectedIndices.length === correctIndices.length &&
      correctIndices.every(i => selectedIndices.includes(i));
  }

  return isCorrect ? (quiz.point || 0) : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : transformer une liste de réponses en submittedAnswers scorés
// ─────────────────────────────────────────────────────────────────────────────
function processAnswers(answers, quizzes) {
  let totalScore = 0;
  const submittedAnswers = [];

  for (const answer of answers) {
    const quiz = quizzes.find(q => q._id.toString() === answer.quizId);
    const userAnswers = answer.submittedAnswers || [];

    if (!quiz) {
      submittedAnswers.push({
        quizId: answer.quizId,
        submittedAnswers: userAnswers,
        score: 0
      });
      continue;
    }

    const score = calcScore(quiz, userAnswers);
    totalScore += score;

    submittedAnswers.push({
      quizId: answer.quizId,
      submittedAnswers: userAnswers,
      score: score
    });
  }

  return { totalScore, submittedAnswers };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /v1/quiz — soumettre une nouvelle tentative
// ─────────────────────────────────────────────────────────────────────────────
exports.submitQuizAttempt = async (req, res) => {
  try {
    const { lessonId, clientId, answers } = req.body;

    if (!lessonId || !clientId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Données incomplètes' });
    }

    const quizzes = await Quiz.find({ lessonId }).lean();

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'Aucun quiz trouvé pour ce cours' });
    }

    const { totalScore, submittedAnswers } = processAnswers(answers, quizzes);

    const attempt = await QuizAttempt.create({
      lessonId,
      clientId,
      score: totalScore,
      submittedAnswers
    });

    // Format QuizAttempt complet — attendu par QuizAttemptResponse.java Android
    return res.status(200).json({
      id: attempt._id.toString(),
      lessonId: attempt.lessonId.toString(),
      clientId: attempt.clientId.toString(),
      score: attempt.score,
      submittedAnswers: attempt.submittedAnswers.map(s => ({
        quizId: s.quizId,
        submittedAnswers: s.submittedAnswers || [],
        score: s.score
      })),
      createdAt: attempt.createdAt,
      updatedAt: attempt.updatedAt,
      _class: 'org.madaurecem.backoffice.models.QuizAttempt'
    });
  } catch (error) {
    console.error('Erreur submitQuizAttempt:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /v1/quiz — mettre à jour la tentative la plus récente
// ─────────────────────────────────────────────────────────────────────────────
exports.updateQuizAttempt = async (req, res) => {
  try {
    const { lessonId, clientId, answers } = req.body;

    if (!lessonId || !clientId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'Données incomplètes' });
    }

    const quizzes = await Quiz.find({ lessonId }).lean();
    const { totalScore, submittedAnswers } = processAnswers(answers, quizzes);

    const updated = await QuizAttempt.findOneAndUpdate(
      { lessonId, clientId },
      { score: totalScore, submittedAnswers },
      { sort: { createdAt: -1 }, new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Tentative introuvable' });
    }

    return res.status(204).send();
  } catch (error) {
    console.error('Erreur updateQuizAttempt:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ==================== TEACHERS ====================
exports.getFreeTeachers = async (req, res) => {
  try {
    const teachers = await Teacher.find({ isFree: true, active: true }).lean();
    res.json(teachers);
  } catch (error) {
    console.error('Erreur getFreeTeachers:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTeachersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const teachers = await Teacher.find({ branchId: branchId, active: true }).lean();
    res.json(teachers);
  } catch (error) {
    console.error('Erreur getTeachersByBranch:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== PROGRESSION ====================
// ─────────────────────────────────────────────────────────────────────────────
// POST /api/mobile/v1/progression
// Enregistre ou met à jour la progression d'une leçon
//
// Body Android (RequestProgression.java) :
// {
//   "clientId":  "698df80fd3c6c74540ea7e11",
//   "unitId":    "6993375080a037fd2dda4479",
//   "lessonId":  "6993383780a037fd2dda4481",
//   "progressionsPart": [
//     { "id": "6995bda4837f665393bb12ce", "percentage": 25 },
//     { "id": "6995be0a837f665393bb12d0", "percentage": 25 },
//     ...
//   ]
// }
//
// Réponse : 200 OK (sans body) — comme la doc API
// ─────────────────────────────────────────────────────────────────────────────
exports.saveProgression = async (req, res) => {
  try {
    const { clientId, unitId, lessonId, progressionsPart } = req.body;

    if (!clientId || !lessonId || !progressionsPart || !Array.isArray(progressionsPart)) {
      return res.status(400).json({ error: 'Données incomplètes' });
    }

    // Convertir les parties au format MongoDB (champ _id = ObjectId)
    const parts = progressionsPart
      .filter(p => p && p.id)
      .map(p => ({
        _id: p.id,
        percentage: typeof p.percentage === 'number' ? p.percentage : 0
      }));

    // Upsert : créer si inexistant, mettre à jour sinon
    await Progression.findOneAndUpdate(
      { clientId, lessonId },
      {
        $set: {
          clientId,
          unitId: unitId || null,
          lessonId,
          progressionsPart: parts,
          _class: 'org.madaure.backoffice.models.Progression'
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).send();
  } catch (error) {
    console.error('Erreur saveProgression:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mobile/v1/progression
// Retourne la liste des progressions du client courant
// clientId est extrait du JWT (comme spécifié dans la doc API)
//
// Réponse : List<ProgressionLesson>
// [{ "lessonId": "...", "percentage": 75 }]
// ─────────────────────────────────────────────────────────────────────────────
exports.getAllProgressions = async (req, res) => {
  try {
    // clientId extrait du JWT décodé (middleware auth doit le mettre dans req.user)
    const clientId = req.user?.clientId || req.user?.id || req.query.clientId;

    if (!clientId) {
      return res.status(400).json({ error: 'clientId introuvable dans le token' });
    }

    const progressions = await Progression.find({ clientId }).lean();

    // Format ProgressionLesson attendu par l'app mobile
    const result = progressions.map(prog => {
      const parts = prog.progressionsPart || [];
      const sum = parts.reduce((acc, p) => acc + (p.percentage || 0), 0);
      const percentage = Math.min(Math.round(sum), 100);

      return {
        lessonId: prog.lessonId.toString(),
        percentage
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('Erreur getAllProgressions:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/mobile/v1/progression/:clientId/:lessonId
// Ancienne route — conservée pour compatibilité
// ─────────────────────────────────────────────────────────────────────────────
exports.getProgression = async (req, res) => {
  try {
    const { clientId, lessonId } = req.params;
    const progression = await Progression.findOne({ clientId, lessonId }).lean();

    if (!progression) {
      return res.json({ lessonId, percentage: 0, progressionsPart: [] });
    }

    const parts = progression.progressionsPart || [];
    const sum = parts.reduce((acc, p) => acc + (p.percentage || 0), 0);
    const percentage = Math.min(Math.round(sum), 100);

    return res.json({
      lessonId: progression.lessonId.toString(),
      percentage,
      progressionsPart: parts.map(p => ({
        id: p._id.toString(),
        percentage: p.percentage
      }))
    });
  } catch (error) {
    console.error('Erreur getProgression:', error);
    return res.status(500).json({ error: error.message });
  }
};

// ==================== KEY & CONTRACT ====================
exports.checkKeyValidation = async (req, res) => {
  try {
    const { key } = req.params;
    const soldToken = await SoldToken.findOne({ key: key.toUpperCase() });
    
    if (!soldToken) {
      return res.status(422).json({ error: "KEY_INVALID", message: "Clé invalide" });
    }
    if (soldToken.consumed) {
      return res.status(422).json({ error: "KEY_ALREADY_USED", message: "Clé déjà utilisée" });
    }
    res.send("true");
  } catch (error) {
    console.error('Erreur checkKeyValidation:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.createNewContract = async (req, res) => {
  try {
    const { client, key } = req.body;
    const upperKey = key.toUpperCase();
    const soldToken = await SoldToken.findOne({ key: upperKey });
    
    if (!soldToken || soldToken.consumed) {
      return res.status(400).json({ error: "Invalid or already consumed activation key" });
    }
    
    const existingContract = await Contract.findOne({
      deviceId: client.deviceId,
      status: 'ACTIVE',
      expiringDate: { $gt: new Date() }
    });
    
    if (existingContract) {
      return res.status(409).json({ error: "Active contract already exists" });
    }
    
    const newContract = await Contract.create({
      deviceId: client.deviceId,
      soldKey: upperKey,
      branchId: client.branchId,
      startDate: new Date(),
      expiringDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      status: "ACTIVE"
    });
    
    soldToken.consumed = true;
    await soldToken.save();
    
    let user = await User.findOne({ deviceId: client.deviceId });
    if (!user) {
      user = await User.create({
        deviceId: client.deviceId,
        firstName: client.firstName || "",
        lastName: client.lastName || "",
        email: client.email || "",
        phone: client.phone || "",
        branches: [client.branchId],
        userType: 2
      });
    }
    
    res.json({ status: "CREATED", contractId: newContract._id });
  } catch (error) {
    console.error('Erreur createNewContract:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteContract = async (req, res) => {
  try {
    const { contractId } = req.body;
    const deviceId = req.headers['x-device-id'];
    
    const contract = await Contract.findById(contractId);
    if (!contract || contract.deviceId !== deviceId) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const soldToken = await SoldToken.findOne({ key: contract.soldKey });
    if (soldToken) {
      soldToken.consumed = false;
      await soldToken.save();
    }
    
    await Contract.findByIdAndDelete(contractId);
    res.status(200).send();
  } catch (error) {
    console.error('Erreur deleteContract:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== OTP ====================
exports.requestOtp = async (req, res) => {
  try {
    const { contractId, channel, target } = req.body;
    
    const recentOTP = await OTP.findOne({
      contractId,
      createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) }
    });
    
    if (recentOTP) {
      return res.status(429).json({ error: "Please wait before requesting another OTP" });
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.create({
      contractId,
      otp: otpCode,
      channel,
      target,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    
    console.log(`OTP for contract ${contractId}: ${otpCode} via ${channel} to ${target}`);
    res.status(200).send();
  } catch (error) {
    console.error('Erreur requestOtp:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== VIMEO ====================
exports.getVimeoIds = async (req, res) => {
  try {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const vimeoIds = [];

    // 1. IDs depuis Content (vidéos des leçons)
    const videos = await Content.find({ type: 'video', status: 'PUBLISHED' }).lean();
    for (const video of videos) {
      if (video.data?.url) {
        const match = video.data.url.match(vimeoRegex);
        if (match && match[1]) vimeoIds.push(match[1]);
      }
    }

    // 2. IDs depuis VimeoCode ACTIVE (Reels spéciaux)
    const activeCodes = await VimeoCode.find({ status: 'ACTIVE' }).lean();
    for (const vc of activeCodes) {
      if (vc.videoUrl) {
        const match = vc.videoUrl.match(vimeoRegex);
        if (match && match[1]) vimeoIds.push(match[1]);
      }
    }

    res.json([...new Set(vimeoIds)]);
  } catch (error) {
    console.error('Erreur getVimeoIds:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== REELS (Section Shorts) ====================

/**
 * Récupérer tous les Reels pour l'application mobile
 * GET /api/mobile/v1/reels
 */
exports.getReels = async (req, res) => {
  try {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    
    // 🔥 Correction cruciale : Tri par le champ 'order' explicitement
    const activeCodes = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    const reels = [];
    let playlistIndex = 0;
    
    for (const vc of activeCodes) {
      let videoId = null;
      
      if (vc.videoUrl) {
        const match = vc.videoUrl.match(vimeoRegex);
        if (match && match[1]) {
          videoId = match[1];
        }
      }
      
      if (videoId) {
        reels.push({
          id: videoId,
          order: vc.order || 0,
          playlistPosition: playlistIndex++, // Aide le lecteur mobile à stabiliser l'index
          videoUrl: vc.videoUrl,
          title: vc.videoTitle || 'Vidéo sans titre',
          description: vc.description || '',
          userName: vc.user || 'Éducation CEM',
          userPhotoUrl: vc.userPhotoUrl || '',
          thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
          code: vc.code,
          createdAt: vc.createdAt
        });
      }
    }
    
    res.json({
      success: true,
      reels: reels,
      count: reels.length
    });
  } catch (error) {
    console.error('Erreur getReels:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
/**
 * Récupérer les Reels avec pagination (scroll infini)
 * GET /api/mobile/v1/reels/page/:page
 */
exports.getReelsPaginated = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    
    const total = await VimeoCode.countDocuments({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    });
    
    const activeCodes = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    })
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const reels = [];
    
    for (const vc of activeCodes) {
      let videoId = null;
      
      if (vc.videoUrl) {
        const match = vc.videoUrl.match(vimeoRegex);
        if (match && match[1]) {
          videoId = match[1];
        }
      }
      
      if (videoId) {
        reels.push({
          id: videoId,
          videoUrl: vc.videoUrl,
          title: vc.videoTitle || 'Vidéo sans titre',
          description: vc.description || '',
          userName: vc.user || 'Éducation CEM',
          userPhotoUrl: vc.userPhotoUrl || '',
          thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
          status: vc.status,
          code: vc.code,
          createdAt: vc.createdAt
        });
      }
    }
    
    res.json({
      success: true,
      reels: reels,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Erreur getReelsPaginated:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
/**
 * Récupérer le Reel suivant par rapport à un ID
 * GET /api/mobile/v1/reels/next/:currentId
 */
exports.getNextReel = async (req, res) => {
  try {
    const { currentId } = req.params;
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    
    // Trouver tous les Reels actifs
    const allReels = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    // Trouver l'index du Reel actuel
    let currentIndex = -1;
    for (let i = 0; i < allReels.length; i++) {
      const match = allReels[i].videoUrl.match(vimeoRegex);
      if (match && match[1] === currentId) {
        currentIndex = i;
        break;
      }
    }
    
    // Si c'est le dernier, retourner au premier (boucle)
    let nextIndex = (currentIndex + 1) % allReels.length;
    const nextReel = allReels[nextIndex];
    
    if (!nextReel) {
      return res.json({ success: true, hasNext: false });
    }
    
    const match = nextReel.videoUrl.match(vimeoRegex);
    const videoId = match ? match[1] : null;
    
    res.json({
      success: true,
      hasNext: true,
      nextReel: {
        id: videoId,
        videoUrl: nextReel.videoUrl,
        title: nextReel.videoTitle,
        description: nextReel.description,
        userName: nextReel.user,
        userPhotoUrl: nextReel.userPhotoUrl,
        thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`
      }
    });
  } catch (error) {
    console.error('Erreur getNextReel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupérer les IDs Vimeo des Reels uniquement
 * GET /api/mobile/v1/reels/ids
 */
exports.getReelIds = async (req, res) => {
  try {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const ids = [];

    const activeReels = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    })
    .sort({ order: 1, createdAt: -1 })
    .lean();

    for (const reel of activeReels) {
      if (reel.videoUrl) {
        const match = reel.videoUrl.match(vimeoRegex);
        if (match && match[1]) {
          ids.push(match[1]);
        }
      }
    }

    res.json(ids);
  } catch (error) {
    console.error('Erreur getReelIds:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Récupérer un Reel spécifique par son code
 * GET /api/mobile/v1/reels/code/:code
 */
exports.getReelByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    
    const reel = await VimeoCode.findOne({ code }).lean();
    
    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel non trouvé" });
    }
    
    const match = reel.videoUrl.match(vimeoRegex);
    const videoId = match ? match[1] : null;
    
    res.json({
      success: true,
      reel: {
        id: videoId,
        code: reel.code,
        videoUrl: reel.videoUrl,
        title: reel.videoTitle,
        description: reel.description,
        userName: reel.user,
        userPhotoUrl: reel.userPhotoUrl,
        thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
        status: reel.status
      }
    });
  } catch (error) {
    console.error('Erreur getReelByCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== VIMEO CODE ====================
exports.verifyVimeoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const vimeoCode = await VimeoCode.findOne({ code });
    
    if (!vimeoCode) {
      return res.status(404).json({ success: false, message: "Code invalide" });
    }
    if (vimeoCode.status === 'USED') {
      return res.status(400).json({ success: false, message: "Code déjà utilisé" });
    }
    if (vimeoCode.status === 'EXPIRED' || (vimeoCode.expiresAt && new Date() > vimeoCode.expiresAt)) {
      return res.status(400).json({ success: false, message: "Code expiré" });
    }
    
    res.json({
      success: true,
      code: {
        id: vimeoCode._id,
        code: vimeoCode.code,
        status: vimeoCode.status,
        videoUrl: vimeoCode.videoUrl,
        videoTitle: vimeoCode.videoTitle
      }
    });
  } catch (error) {
    console.error('Erreur verifyVimeoCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.useVimeoCode = async (req, res) => {
  try {
    const { code } = req.body;
    const vimeoCode = await VimeoCode.findOne({ code });
    
    if (!vimeoCode) {
      return res.status(404).json({ success: false, message: "Code invalide" });
    }
    if (vimeoCode.status === 'USED') {
      return res.status(400).json({ success: false, message: "Code déjà utilisé" });
    }
    
    await VimeoCode.findByIdAndUpdate(vimeoCode._id, { status: 'USED', usedAt: new Date() });
    
    res.json({
      success: true,
      message: "Code utilisé avec succès",
      video: { url: vimeoCode.videoUrl, title: vimeoCode.videoTitle }
    });
  } catch (error) {
    console.error('Erreur useVimeoCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getVideoByVimeoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const vimeoCode = await VimeoCode.findOne({ code });
    
    if (!vimeoCode) {
      return res.status(404).json({ success: false, message: "Code invalide" });
    }
    
    res.json({
      success: true,
      video: {
        title: vimeoCode.videoTitle,
        url: vimeoCode.videoUrl,
        description: vimeoCode.description,
        status: vimeoCode.status
      }
    });
  } catch (error) {
    console.error('Erreur getVideoByVimeoCode:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getActiveVimeoCodes = async (req, res) => {
  try {
    const codes = await VimeoCode.find({ status: { $in: ['ACTIVE', 'PENDING'] } })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    
    res.json({ success: true, codes, count: codes.length });
  } catch (error) {
    console.error('Erreur getActiveVimeoCodes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== STATS ====================
exports.getStats = async (req, res) => {
  try {
    const stats = {
      totalBranches: await Branch.countDocuments(),
      totalSubjects: await Subject.countDocuments(),
      totalUnits: await Unit.countDocuments(),
      totalLessons: await Lesson.countDocuments({ status: 'PUBLISHED' }),
      totalLessonParts: await LessonPart.countDocuments(),
      totalVimeoCodes: await VimeoCode.countDocuments(),
      activeVimeoCodes: await VimeoCode.countDocuments({ status: 'ACTIVE' })
    };
    res.json(stats);
  } catch (error) {
    console.error('Erreur getStats:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== PROXY WASABI ====================

// ==================== LESSON PART BY ID ====================
exports.getLessonPartById = async (req, res) => {
  try {
    const { partId } = req.params;
    
    const part = await LessonPart.findById(partId).lean();
    if (!part) {
      return res.status(404).json({ error: "Partie non trouvée" });
    }
    
    const protocol = req.protocol;
    const host = req.get('host');
    const baseUrl = `${protocol}://${host}`;
    
    let url = part.url || '';
    let body = part.body || '';
    
    if (url && url.startsWith('/') && !url.startsWith('http')) {
      url = `${baseUrl}${url}`;
    }
    if (url && url.includes('wasabisys.com')) {
      url = `${baseUrl}/api/mobile/v1/proxy?url=${encodeURIComponent(url)}`;
    }
    
    res.json({
      success: true,
      part: {
        id: part._id,
        lessonId: part.lessonId,
        lesson: part.lesson,
        type: part.type,
        title: part.title,
        url: url,
        body: body,
        duration: part.duration || 0,
        order: part.order,
        isFree: part.isFree
      }
    });
  } catch (error) {
    console.error('Erreur getLessonPartById:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== QUIZ HISTORY ====================
exports.getQuizHistory = async (req, res) => {
  try {
    const { clientId, lessonId } = req.params;
    const QuizAttempt = require('../models/QuizAttempt');
    const attempts = await QuizAttempt.find({ clientId, lessonId })
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, attempts });
  } catch (error) {
    console.error('Erreur getQuizHistory:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.proxyWasabi = async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'url manquante' });
    if (!url.includes('wasabisys.com') && !url.includes('cemstorage')) {
      return res.status(403).json({ error: 'URL non autorisée' });
    }

    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      endpoint: 'https://s3.eu-central-2.wasabisys.com',
      region: 'eu-central-2',
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
      }
    });

    const urlObj = new URL(url);
    const key = urlObj.pathname.replace(`/${process.env.WASABI_BUCKET}/`, '').replace(/^\//, '');
    const command = new GetObjectCommand({ Bucket: process.env.WASABI_BUCKET, Key: key });
    const s3Response = await s3.send(command);

    const ext = key.split('.').pop().toLowerCase();
    const mimeTypes = {
      pdf: 'application/pdf', mp4: 'video/mp4', webm: 'video/webm',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp'
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    s3Response.Body.pipe(res);
  } catch (error) {
    console.error('Proxy Wasabi error:', error);
    res.status(500).json({ error: 'Erreur accès fichier' });
  }
};