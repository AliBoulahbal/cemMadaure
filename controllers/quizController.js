const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const { getPresignedUrl } = require('../middleware/wasabi'); // adapter le chemin selon votre projet

// ==================== PAGE D'ACCUEIL DES QUIZ ====================
exports.index = async (req, res) => {
  try {
    const lessonsWithQuizzes = await Quiz.aggregate([
      { $group: { _id: '$lessonId', count: { $sum: 1 } } },
      { $lookup: { from: 'lessons', localField: '_id', foreignField: '_id', as: 'lesson' } },
      { $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'branches', localField: 'lesson.branchId', foreignField: '_id', as: 'branch' } },
      { $unwind: { path: '$branch', preserveNullAndEmptyArrays: true } },
      { $lookup: { from: 'subjects', localField: 'lesson.subjectId', foreignField: '_id', as: 'subject' } },
      { $unwind: { path: '$subject', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          lessonId: '$_id',
          lessonName: { $ifNull: ['$lesson.name', 'درس غير موجود'] },
          branchName: { $ifNull: ['$branch.name', '-'] },
          subjectName: { $ifNull: ['$subject.name', '-'] },
          quizCount: '$count'
        }
      },
      { $sort: { branchName: 1, subjectName: 1, lessonName: 1 } }
    ]);

    const allLessons = await Lesson.find({})
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .sort({ name: 1 })
      .lean();

    const stats = {
      totalQuizzes: await Quiz.countDocuments(),
      totalLessonsWithQuizzes: lessonsWithQuizzes.length,
      singleselect: await Quiz.countDocuments({ typeQuiz: 'SINGLESELECT' }),
      multiselect: await Quiz.countDocuments({ typeQuiz: 'MULTISELECT' }),
      withMedia: await Quiz.countDocuments({ questionMediaType: { $ne: 'text' } })
    };

    res.render('quiz/index', {
      title: 'الاختبارات',
      lessonsWithQuizzes,
      allLessons,
      stats
    });
  } catch (error) {
    console.error(error);
    res.render('quiz/index', {
      error: error.message,
      lessonsWithQuizzes: [],
      allLessons: [],
      stats: { totalQuizzes: 0, totalLessonsWithQuizzes: 0, singleselect: 0, multiselect: 0, withMedia: 0 }
    });
  }
};

// ==================== LISTE DES QUIZ PAR LEÇON ====================
exports.listByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .lean();

    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }

    const quizzes = await Quiz.find({ lessonId }).sort({ order: 1 }).lean();
    const stats = {
      total: quizzes.length,
      singleselect: quizzes.filter(q => q.typeQuiz === 'SINGLESELECT').length,
      multiselect: quizzes.filter(q => q.typeQuiz === 'MULTISELECT').length,
      withMedia: quizzes.filter(q => q.questionMediaType !== 'text').length
    };

    res.render('quiz/list', { title: 'الاختبارات', lesson, quizzes, stats });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// ==================== FORMULAIRE DE CRÉATION ====================
exports.createForm = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const lesson = await Lesson.findById(lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .lean();

    if (!lesson) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }

    const quizCount = await Quiz.countDocuments({ lessonId });
    res.render('quiz/create', {
      title: 'إنشاء اختبار جديد',
      lessonId,
      lesson,
      nextOrder: quizCount + 1
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// ==================== CRÉER UN QUIZ ====================
exports.create = async (req, res) => {
  try {
    const {
      lessonId, question, subQuestion, typeQuiz,
      point, explanation, order,
      questionMediaType, questionMediaUrl  // ← champs Wasabi
    } = req.body;

    const options = JSON.parse(req.body.options || '[]');

    await Quiz.create({
      lessonId,
      question,
      subQuestion: subQuestion || '',
      questionMediaType: questionMediaType || 'text',
      questionMediaUrl: questionMediaUrl || '',
      options,
      point: parseInt(point) || 1,
      typeQuiz: typeQuiz || 'SINGLESELECT',
      explanation: explanation || '',
      order: parseInt(order) || 0,
      createdBy: req.session.user?.id,
      status: 'published'
    });

    req.flash('success', 'تم إنشاء الاختبار بنجاح');
    res.redirect(`/quiz/lesson/${lessonId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/quiz/create/${req.body.lessonId}`);
  }
};

// ==================== FORMULAIRE D'ÉDITION ====================
exports.editForm = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).lean();
    if (!quiz) {
      req.flash('error', 'الاختبار غير موجود');
      return res.redirect('/quiz');
    }

    const lesson = await Lesson.findById(quiz.lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .lean();

    res.render('quiz/edit', { title: 'تعديل الاختبار', quiz, lesson });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/quiz');
  }
};

// ==================== METTRE À JOUR UN QUIZ ====================
exports.update = async (req, res) => {
  try {
    const {
      question, subQuestion, typeQuiz, point, explanation, order, status,
      questionMediaType, questionMediaUrl  // ← champs Wasabi
    } = req.body;

    const options = JSON.parse(req.body.options || '[]');

    await Quiz.findByIdAndUpdate(req.params.id, {
      question,
      subQuestion: subQuestion || '',
      questionMediaType: questionMediaType || 'text',
      questionMediaUrl: questionMediaUrl || '',
      options,
      point: parseInt(point) || 1,
      typeQuiz: typeQuiz || 'SINGLESELECT',
      explanation: explanation || '',
      order: parseInt(order) || 0,
      status: status || 'published'
    });

    req.flash('success', 'تم تحديث الاختبار بنجاح');
    res.redirect(`/quiz/lesson/${req.body.lessonId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/quiz/edit/${req.params.id}`);
  }
};

// ==================== SUPPRIMER UN QUIZ ====================
// Note : les fichiers Wasabi ne sont pas supprimés automatiquement.
// Pour les supprimer, utilisez le SDK AWS S3 (DeleteObjectCommand).
exports.delete = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash('error', 'الاختبار غير موجود');
      return res.redirect('back');
    }

    const lessonId = quiz.lessonId;
    await Quiz.findByIdAndDelete(req.params.id);

    req.flash('success', 'تم حذف الاختبار بنجاح');
    res.redirect(`/quiz/lesson/${lessonId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('back');
  }
};

// ==================== PRESIGN URL WASABI (upload direct depuis le navigateur) ====================
// GET /quiz/upload/presign?type=image&ext=jpg
exports.getPresignUrl = async (req, res) => {
  try {
    const { type, ext } = req.query;

    const allowedTypes = ['image', 'video', 'audio'];
    const allowedExts = {
      image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      video: ['mp4', 'webm', 'avi', 'mov'],
      audio: ['mp3', 'wav', 'ogg', 'm4a', 'aac']
    };

    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, error: 'نوع ملف غير مسموح' });
    }
    if (!ext || !allowedExts[type].includes(ext.toLowerCase())) {
      return res.status(400).json({ success: false, error: 'امتداد الملف غير مسموح: ' + ext });
    }

    const { url, key, publicUrl } = await getPresignedUrl(type, ext);

    res.json({
      success: true,
      uploadUrl: url,    // URL présignée PUT → utilisée par le navigateur
      publicUrl,         // URL publique Wasabi → stockée en base
      key
    });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== API MOBILE ====================
exports.getQuizForLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const quizzes = await Quiz.find({ lessonId, status: 'published' })
      .sort({ order: 1 })
      .lean();

    res.json({ success: true, count: quizzes.length, quizzes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitAnswers = async (req, res) => {
  try {
    const { lessonId, clientId, answers } = req.body;
    const quizzes = await Quiz.find({ lessonId }).lean();

    let totalScore = 0;
    const results = [];

    for (const answer of answers) {
      const quiz = quizzes.find(q => q._id.toString() === answer.quizId);
      if (quiz) {
        const correctOptions = quiz.options.filter(opt => opt.isCorrect).map(opt => opt._id);
        const userAnswers = answer.submittedAnswers;
        let correct;

        if (quiz.typeQuiz === 'SINGLESELECT') {
          correct = userAnswers.length === 1 && correctOptions[0] === userAnswers[0];
        } else {
          correct = correctOptions.length === userAnswers.length &&
                    correctOptions.every(opt => userAnswers.includes(opt));
        }

        const score = correct ? quiz.point : 0;
        totalScore += score;
        results.push({ quizId: answer.quizId, correct, score, correctAnswers: correctOptions });
      }
    }

    res.json({ success: true, totalScore, results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
