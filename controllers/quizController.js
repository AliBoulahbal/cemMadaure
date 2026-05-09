const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const Branch = require('../models/Branch');  // années
const Subject = require('../models/Subject');  // matières
const fs = require('fs');
const path = require('path');

// ==================== PAGE D'ACCUEIL DES QUIZ ====================
exports.index = async (req, res) => {
  try {
    const lessonsWithQuizzes = await Quiz.aggregate([
      {
        $group: {
          _id: '$lessonId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'lessons',
          localField: '_id',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      {
        $unwind: { path: '$lesson', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'branches',
          localField: 'lesson.branchId',
          foreignField: '_id',
          as: 'branch'
        }
      },
      {
        $unwind: { path: '$branch', preserveNullAndEmptyArrays: true }
      },
      {
        $lookup: {
          from: 'subjects',
          localField: 'lesson.subjectId',
          foreignField: '_id',
          as: 'subject'
        }
      },
      {
        $unwind: { path: '$subject', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          lessonId: '$_id',
          lessonName: { $ifNull: ['$lesson.name', 'درس غير موجود'] },
          branchName: { $ifNull: ['$branch.name', '-'] },
          subjectName: { $ifNull: ['$subject.name', '-'] },
          quizCount: '$count'
        }
      },
      {
        $sort: { branchName: 1, subjectName: 1, lessonName: 1 }
      }
    ]);

    // Récupérer toutes les leçons pour le modal "إنشاء اختبار"
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
      lessonsWithQuizzes: lessonsWithQuizzes,
      allLessons: allLessons,
      stats: stats
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

    res.render('quiz/list', {
      title: 'الاختبارات',
      lesson: lesson,
      quizzes: quizzes,
      stats: stats
    });
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
    const nextOrder = quizCount + 1;

    res.render('quiz/create', {
      title: 'إنشاء اختبار جديد',
      lessonId: lessonId,
      lesson: lesson,
      nextOrder: nextOrder
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect(`/lesson`);
  }
};

// ==================== CRÉER UN QUIZ ====================
exports.create = async (req, res) => {
  try {
    const { lessonId, question, subQuestion, typeQuiz, point, explanation, order } = req.body;
    const options = JSON.parse(req.body.options || '[]');

    const newQuiz = await Quiz.create({
      lessonId,
      question,
      subQuestion: subQuestion || '',
      questionMediaType: 'text',
      questionMediaUrl: '',
      options: options,
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

    res.render('quiz/edit', {
      title: 'تعديل الاختبار',
      quiz: quiz,
      lesson: lesson
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/quiz');
  }
};

// ==================== METTRE À JOUR UN QUIZ ====================
exports.update = async (req, res) => {
  try {
    const { question, subQuestion, typeQuiz, point, explanation, order, status } = req.body;
    const options = JSON.parse(req.body.options || '[]');

    await Quiz.findByIdAndUpdate(req.params.id, {
      question,
      subQuestion: subQuestion || '',
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
exports.delete = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      req.flash('error', 'الاختبار غير موجود');
      return res.redirect('back');
    }

    if (quiz.questionMediaUrl && quiz.questionMediaUrl !== '') {
      const filePath = path.join(__dirname, '..', 'public', quiz.questionMediaUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (quiz.explanationMediaUrl && quiz.explanationMediaUrl !== '') {
      const filePath = path.join(__dirname, '..', 'public', quiz.explanationMediaUrl);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    if (quiz.options) {
      quiz.options.forEach(option => {
        if (option.mediaUrl && option.mediaUrl !== '') {
          const filePath = path.join(__dirname, '..', 'public', option.mediaUrl);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
      });
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

// ==================== UPLOAD MÉDIA QUESTION ====================
exports.uploadQuestionMedia = async (req, res) => {
  try {
    const { quizId, mediaType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier téléchargé' });
    }

    let mediaUrl = '';
    if (mediaType === 'image') {
      mediaUrl = '/uploads/quiz/images/' + req.file.filename;
    } else if (mediaType === 'video') {
      mediaUrl = '/uploads/quiz/videos/' + req.file.filename;
    } else if (mediaType === 'audio') {
      mediaUrl = '/uploads/quiz/audio/' + req.file.filename;
    }

    if (quizId) {
      await Quiz.findByIdAndUpdate(quizId, {
        questionMediaType: mediaType,
        questionMediaUrl: mediaUrl
      });
    }

    res.json({ success: true, mediaUrl: mediaUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPLOAD MÉDIA OPTION ====================
exports.uploadOptionMedia = async (req, res) => {
  try {
    const { quizId, optionId, mediaType } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Aucun fichier téléchargé' });
    }

    let mediaUrl = '';
    if (mediaType === 'image') {
      mediaUrl = '/uploads/quiz/images/' + req.file.filename;
    } else if (mediaType === 'video') {
      mediaUrl = '/uploads/quiz/videos/' + req.file.filename;
    } else if (mediaType === 'audio') {
      mediaUrl = '/uploads/quiz/audio/' + req.file.filename;
    }

    if (quizId && optionId) {
      const quiz = await Quiz.findById(quizId);
      const option = quiz.options.id(optionId);
      if (option) {
        option.mediaType = mediaType;
        option.mediaUrl = mediaUrl;
        await quiz.save();
      }
    }

    res.json({ success: true, mediaUrl: mediaUrl });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== SUPPRIMER UN MÉDIA ====================
exports.deleteMedia = async (req, res) => {
  try {
    const { quizId, field, optionId } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz non trouvé' });
    }

    let filePath = '';

    if (field === 'question') {
      filePath = path.join(__dirname, '..', 'public', quiz.questionMediaUrl);
      quiz.questionMediaType = 'text';
      quiz.questionMediaUrl = '';
    } else if (field === 'explanation') {
      filePath = path.join(__dirname, '..', 'public', quiz.explanationMediaUrl);
      quiz.explanationMediaUrl = '';
    } else if (field === 'option' && optionId) {
      const option = quiz.options.id(optionId);
      if (option) {
        filePath = path.join(__dirname, '..', 'public', option.mediaUrl);
        option.mediaType = 'text';
        option.mediaUrl = '';
      }
    }

    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await quiz.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
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

    res.json({
      success: true,
      count: quizzes.length,
      quizzes: quizzes
    });
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
        let correct = true;
        const correctOptions = quiz.options.filter(opt => opt.isCorrect).map(opt => opt._id);
        const userAnswers = answer.submittedAnswers;

        if (quiz.typeQuiz === 'SINGLESELECT') {
          correct = userAnswers.length === 1 && correctOptions[0] === userAnswers[0];
        } else {
          correct = correctOptions.length === userAnswers.length &&
                    correctOptions.every(opt => userAnswers.includes(opt));
        }

        const score = correct ? quiz.point : 0;
        totalScore += score;

        results.push({
          quizId: answer.quizId,
          correct: correct,
          score: score,
          correctAnswers: correctOptions
        });
      }
    }

    res.json({
      success: true,
      totalScore: totalScore,
      results: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
