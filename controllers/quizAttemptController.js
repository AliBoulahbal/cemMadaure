const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');

// ==================== GESTION DES TENTATIVES ====================

exports.allAttempts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const attempts = await QuizAttempt.find()
      .populate('lessonId', 'name')
      .populate('clientId', 'fullName email username')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await QuizAttempt.countDocuments();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const stats = {
      total: total,
      today: await QuizAttempt.countDocuments({ createdAt: { $gte: today } }),
      thisWeek: await QuizAttempt.countDocuments({ createdAt: { $gte: weekAgo } }),
      avgScore: await QuizAttempt.aggregate([
        { $group: { _id: null, avg: { $avg: '$score' } } }
      ]).then(res => res[0]?.avg?.toFixed(2) || 0)
    };
    
    res.render('quizAttempt/index', {
      title: 'جميع محاولات الاختبارات',
      attempts: attempts,
      stats: stats,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
        next: page + 1,
        prev: page - 1
      }
    });
  } catch (error) {
    console.error(error);
    res.render('quizAttempt/index', {
      title: 'جميع محاولات الاختبارات',
      error: error.message,
      attempts: [],
      stats: { total: 0, today: 0, thisWeek: 0, avgScore: 0 }
    });
  }
};

exports.listByLesson = async (req, res) => {
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
    
    const attempts = await QuizAttempt.find({ lessonId })
      .populate('clientId', 'fullName email username')
      .sort({ createdAt: -1 })
      .lean();
    
    const scores = attempts.map(a => a.score);
    const stats = {
      total: attempts.length,
      avgScore: scores.length > 0 
        ? (scores.reduce((sum, s) => sum + s, 0) / scores.length).toFixed(2)
        : 0,
      maxScore: scores.length > 0 ? Math.max(...scores) : 0,
      minScore: scores.length > 0 ? Math.min(...scores) : 0,
      uniqueStudents: new Set(attempts.map(a => a.clientId?._id?.toString()).filter(Boolean)).size
    };
    
    res.render('quizAttempt/list', {
      title: 'محاولات الاختبارات',
      lesson: lesson,
      attempts: attempts,
      stats: stats
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

exports.viewAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await QuizAttempt.findById(attemptId)
      .populate('lessonId', 'name')
      .populate('clientId', 'fullName email username phone')
      .lean();
    
    if (!attempt) {
      req.flash('error', 'المحاولة غير موجودة');
      return res.redirect('/quiz-attempt');
    }
    
    const quizzes = await Quiz.find({ lessonId: attempt.lessonId._id }).lean();
    
    const detailedAnswers = (attempt.submittedAnswers || []).map(answer => {
      const quiz = quizzes.find(q => q._id.toString() === answer.quizId);
      const correctAnswers = quiz?.options?.filter(opt => opt.isCorrect).map(opt => opt.content) || [];
      const userAnswers = answer.submittedAnswers || [];
      
      let userAnswersText = [...userAnswers];
      if (quiz && quiz.options) {
        userAnswersText = userAnswers.map(ans => {
          const option = quiz.options.find(o => o._id?.toString() === ans?.toString());
          if (option) return option.content;
          return ans;
        });
      }
      
      return {
        ...answer,
        question: quiz?.question || 'سؤال غير موجود',
        userAnswersText: userAnswersText,
        correctAnswers: correctAnswers,
        isCorrect: answer.score > 0,
        maxScore: quiz?.point || 0
      };
    });
    
    const totalPossible = detailedAnswers.reduce((sum, a) => sum + a.maxScore, 0);
    
    res.render('quizAttempt/view', {
      title: 'تفاصيل المحاولة',
      attempt: attempt,
      detailedAnswers: detailedAnswers,
      totalScore: attempt.score || 0,
      totalPossible: totalPossible,
      percentage: totalPossible > 0 ? Math.round((attempt.score / totalPossible) * 100) : 0
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/quiz-attempt');
  }
};

exports.deleteAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attempt = await QuizAttempt.findById(id);
    if (!attempt) {
      req.flash('error', 'المحاولة غير موجودة');
      return res.redirect('/quiz-attempt');
    }
    
    await QuizAttempt.findByIdAndDelete(id);
    req.flash('success', 'تم حذف المحاولة بنجاح');
    res.redirect('/quiz-attempt');
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/quiz-attempt');
  }
};

// ==================== API ====================

exports.submitAttempt = async (req, res) => {
  try {
    const { lessonId, clientId, answers } = req.body;
    
    if (!lessonId || !clientId || !answers) {
      return res.status(400).json({ success: false, error: 'بيانات غير مكتملة' });
    }
    
    const quizzes = await Quiz.find({ lessonId }).lean();
    if (quizzes.length === 0) {
      return res.status(400).json({ success: false, error: 'لا توجد أسئلة في هذا الدرس' });
    }
    
    let totalScore = 0;
    const submittedAnswers = [];
    
    for (const answer of answers) {
      const quiz = quizzes.find(q => q._id.toString() === answer.quizId);
      if (!quiz) {
        submittedAnswers.push({
          quizId: answer.quizId,
          submittedAnswers: answer.submittedAnswers || [],
          score: 0
        });
        continue;
      }
      
      const correctOptionIds = quiz.options.filter(opt => opt.isCorrect).map(opt => opt._id.toString());
      const userAnswers = answer.submittedAnswers || [];
      
      let isCorrect = false;
      if (quiz.typeQuiz === 'SINGLESELECT') {
        isCorrect = userAnswers.length === 1 && correctOptionIds.includes(userAnswers[0]?.toString());
      } else {
        const userSet = new Set(userAnswers.map(a => a?.toString()));
        const correctSet = new Set(correctOptionIds);
        isCorrect = userAnswers.length === correctOptionIds.length && 
                    [...correctSet].every(c => userSet.has(c));
      }
      
      const score = isCorrect ? quiz.point : 0;
      totalScore += score;
      
      submittedAnswers.push({
        quizId: answer.quizId,
        submittedAnswers: userAnswers,
        score: score
      });
    }
    
    const attempt = await QuizAttempt.create({
      lessonId,
      clientId,
      score: totalScore,
      submittedAnswers: submittedAnswers
    });
    
    res.json({
      success: true,
      attemptId: attempt._id,
      score: totalScore,
      maxScore: quizzes.reduce((sum, q) => sum + q.point, 0),
      submittedAnswers: submittedAnswers
    });
  } catch (error) {
    console.error('Error in submitAttempt:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStudentAttempts = async (req, res) => {
  try {
    const { clientId, lessonId } = req.params;
    
    const filter = { clientId };
    if (lessonId && lessonId !== 'undefined') filter.lessonId = lessonId;
    
    const attempts = await QuizAttempt.find(filter)
      .populate('lessonId', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    const lessonsIds = [...new Set(attempts.map(a => a.lessonId?._id?.toString()).filter(Boolean))];
    const maxScoresMap = {};
    
    for (const lid of lessonsIds) {
      const quizzes = await Quiz.find({ lessonId: lid }).lean();
      const maxScore = quizzes.reduce((sum, q) => sum + (q.point || 0), 0);
      maxScoresMap[lid] = maxScore;
    }
    
    const formattedAttempts = attempts.map(attempt => ({
      id: attempt._id,
      lessonId: attempt.lessonId?._id || attempt.lessonId,
      lessonName: attempt.lessonId?.name || '',
      date: attempt.createdAt,
      score: attempt.score,
      maxScore: maxScoresMap[attempt.lessonId?._id?.toString()] || 0,
      percentage: maxScoresMap[attempt.lessonId?._id?.toString()] > 0 
        ? Math.round((attempt.score / maxScoresMap[attempt.lessonId?._id?.toString()]) * 100) 
        : 0
    }));
    
    res.json({
      success: true,
      count: formattedAttempts.length,
      attempts: formattedAttempts
    });
  } catch (error) {
    console.error('Error in getStudentAttempts:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};