const LessonPart = require('../models/LessonPart');
const Lesson = require('../models/Lesson');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');

// ==================== CRUD PRINCIPAL ====================

// Liste des parties d'une leçon
exports.listByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lessonDoc = await Lesson.findById(lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name');

    if (!lessonDoc) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }

    const lesson = lessonDoc.toObject();

    const parts = await LessonPart.find({ lessonId })
      .sort({ order: 1, partOrder: 1 })
      .lean();

    // Préparer les données pour l'affichage
    parts.forEach(part => {
      part.id = part._id.toString();
      
      // S'assurer que documents est un tableau
      if (!part.documents) part.documents = [];
      
      // Ajouter les anciens champs comme documents s'ils existent
      if (part.url && part.url !== '') {
        const existingDoc = part.documents.find(d => d.type === 'VIDEO');
        if (!existingDoc) {
          part.documents.unshift({
            type: 'VIDEO',
            title: part.title || 'Vidéo',
            url: part.url,
            duration: part.duration || 0,
            isFree: part.isFree || false,
            order: 0
          });
        }
      }
      
      if (part.body && part.body !== '') {
        let docType = 'PDF';
        if (part.type === 'TEXT') docType = 'TEXT';
        else if (part.type === 'QUIZ') docType = 'QUIZ';
        
        const existingDoc = part.documents.find(d => d.type === docType);
        if (!existingDoc) {
          part.documents.push({
            type: docType,
            title: part.title + (docType === 'PDF' ? ' (PDF)' : ''),
            content: part.body,
            isFree: part.isFree || false,
            order: part.documents.length
          });
        }
      }
      
      // Trier les documents par order
      part.documents.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    const stats = {
      total: parts.length,
      videos: parts.filter(p => p.url && p.url !== '').length,
      pdfs: parts.filter(p => p.body && p.body !== '' && p.type !== 'TEXT' && p.type !== 'QUIZ').length,
      texts: parts.filter(p => p.type === 'TEXT').length,
      quizzes: parts.filter(p => p.type === 'QUIZ').length,
      free: parts.filter(p => p.isFree).length,
      totalDocs: parts.reduce((sum, p) => sum + (p.documents?.length || 0), 0)
    };

    const lessonIdStr = lessonDoc._id.toString();
    res.render('lessonPart/list', {
      title: 'أجزاء الدرس',
      lesson,
      lessonIdStr,
      parts,
      stats,
      active: { lessonPart: true }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// Formulaire de création
// Formulaire de création
exports.createForm = async (req, res) => {
  try {
    const { lessonId } = req.params;

    const lessonDoc = await Lesson.findById(lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name');

    if (!lessonDoc) {
      req.flash('error', 'الدرس غير موجود');
      return res.redirect('/lesson');
    }

    const lesson = lessonDoc.toObject();
    
    // S'assurer que les IDs existent, sinon mettre des chaînes vides
    const branchIdValue = lesson.branchId?._id ? lesson.branchId._id.toString() : '';
    const subjectIdValue = lesson.subjectId?._id ? lesson.subjectId._id.toString() : '';
    const unitIdValue = lesson.unitId?._id ? lesson.unitId._id.toString() : '';
    
    const branchNameValue = lesson.branchId?.name || '';
    const subjectNameValue = lesson.subjectId?.name || '';
    const unitNameValue = lesson.unitId?.name || '';

    const partsCount = await LessonPart.countDocuments({ lessonId });
    const nextOrder = partsCount + 1;

    res.render('lessonPart/create', {
      title: 'إضافة جزء جديد',
      lesson,
      lessonIdStr: lessonDoc._id.toString(),
      branchIdValue,
      subjectIdValue,
      unitIdValue,
      branchNameValue,
      subjectNameValue,
      unitNameValue,
      nextOrder,
      active: { lessonPart: true }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// CRÉER / METTRE À JOUR une partie
// Logique : 1 LessonPart par lessonId (même structure que Java)
//   url  = vidéo | body = PDF
// Si une part existe déjà pour ce lessonId → update, sinon → create
// ─────────────────────────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const {
      lessonId, lesson, branchId, branch,
      subjectId, subject, unitId, unit,
      partName, partOrder, description, isFree,
      hasVideo, videoTitle, videoUrl, videoDuration, videoIsFree,
      hasPdf, pdfTitle, pdfUrl, pdfIsFree,
      hasText, textTitle, textContent, textIsFree
    } = req.body;

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'lessonId requis' });
    }

    // Valeurs finales
    const finalUrl      = (hasVideo && videoUrl)  ? videoUrl  : '';
    const finalBody     = (hasPdf   && pdfUrl)    ? pdfUrl
                        : (hasText  && textContent) ? textContent : '';
    const finalDuration = parseInt(videoDuration) || 0;
    const finalTitle    = videoTitle || pdfTitle || textTitle || partName || '';
    const finalType     = hasVideo ? 'VIDEO' : (hasPdf ? 'PDF' : 'TEXT');
    const finalIsFree   = isFree === true || isFree === 'true' || isFree === 'on';
    const createdBy     = req.session?.user?.fullName || req.session?.user?.username || 'admin';

    if (!finalUrl && !finalBody) {
      return res.status(400).json({ success: false, error: 'Au moins une vidéo ou un PDF est requis' });
    }

    // TOUJOURS créer un nouvel enregistrement
    // Même unitId = normal (les 2 screenshots Java ont le même unitId)
    // order auto-incrémenté si pas fourni
    const lastPart = await LessonPart.findOne({ lessonId: lessonId.toString() })
      .sort({ order: -1 }).lean();
    const nextOrder = parseInt(partOrder) || (lastPart ? (lastPart.order || 0) + 1 : 1);

    const part = await LessonPart.create({
      lessonId:  lessonId.toString(),
      lesson:    lesson    || '',
      branchId:  branchId  || '',
      branch:    branch    || '',
      subjectId: subjectId || '',
      subject:   subject   || '',
      unitId:    unitId    || '',
      unit:      unit      || '',
      order:     nextOrder,
      title:     finalTitle,
      url:       finalUrl,
      body:      finalBody,
      duration:  finalDuration,
      isFree:    finalIsFree,
      type:      finalType,
      createdBy
    });
    console.log('✅ Partie créée (order=' + part.order + '):', part._id.toString());

    res.json({ success: true, part });
  } catch (error) {
    console.error('❌ Erreur create:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD VIDÉO — met à jour le champ url
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadVideo = async (req, res) => {
  try {
    const { lessonId, title, order, isFree, sourceType, fileUrl, videoUrl } = req.body;
    if (!lessonId) return res.status(400).json({ success: false, error: 'lessonId requis' });

    const finalUrl = (sourceType === 'upload' ? fileUrl : videoUrl) || '';
    if (!finalUrl) return res.status(400).json({ success: false, error: 'URL vidéo requise' });

    const lesson = await Lesson.findById(lessonId).populate('branchId').populate('subjectId').populate('unitId');
    if (!lesson) return res.status(400).json({ success: false, error: 'Leçon non trouvée' });

    const isFreeVal = isFree === 'true' || isFree === true;
    const createdBy = req.session?.user?.fullName || req.session?.user?.username || 'admin';

    // TOUJOURS créer un nouvel enregistrement
    const lastV = await LessonPart.findOne({ lessonId: lessonId.toString() })
      .sort({ order: -1 }).lean();
    const videoOrder = parseInt(order) || (lastV ? (lastV.order || 0) + 1 : 1);

    const part = await LessonPart.create({
      lessonId:  lessonId.toString(),
      lesson:    lesson.name || '',
      branchId:  lesson.branchId?._id?.toString() || lesson.branchId?.toString() || '',
      branch:    lesson.branchId?.name || '',
      subjectId: lesson.subjectId?._id?.toString() || lesson.subjectId?.toString() || '',
      subject:   lesson.subjectId?.name || '',
      unitId:    lesson.unitId?._id?.toString() || lesson.unitId?.toString() || '',
      unit:      lesson.unitId?.name || '',
      type:      'VIDEO',
      title:     title || '',
      url:       finalUrl,
      body:      '',
      duration:  parseInt(req.body.duration) || 0,
      order:     videoOrder,
      isFree:    isFreeVal,
      createdBy
    });
    console.log('✅ Video créée (order=' + part.order + '):', part._id.toString());
    return res.json({ success: true, part });
  } catch (error) {
    console.error('❌ Erreur uploadVideo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD PDF — met à jour le champ body
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadPDF = async (req, res) => {
  try {
    const { lessonId, title, order, isFree, fileUrl } = req.body;
    if (!lessonId) return res.status(400).json({ success: false, error: 'lessonId requis' });
    if (!fileUrl)  return res.status(400).json({ success: false, error: 'URL PDF requise' });

    const lesson = await Lesson.findById(lessonId).populate('branchId').populate('subjectId').populate('unitId');
    if (!lesson) return res.status(400).json({ success: false, error: 'Leçon non trouvée' });

    const isFreeVal = isFree === 'true' || isFree === true;
    const createdBy = req.session?.user?.fullName || req.session?.user?.username || 'admin';

    // TOUJOURS créer un nouvel enregistrement
    const lastP = await LessonPart.findOne({ lessonId: lessonId.toString() })
      .sort({ order: -1 }).lean();
    const pdfOrder = parseInt(order) || (lastP ? (lastP.order || 0) + 1 : 1);

    const part = await LessonPart.create({
      lessonId:  lessonId.toString(),
      lesson:    lesson.name || '',
      branchId:  lesson.branchId?._id?.toString() || lesson.branchId?.toString() || '',
      branch:    lesson.branchId?.name || '',
      subjectId: lesson.subjectId?._id?.toString() || lesson.subjectId?.toString() || '',
      subject:   lesson.subjectId?.name || '',
      unitId:    lesson.unitId?._id?.toString() || lesson.unitId?.toString() || '',
      unit:      lesson.unitId?.name || '',
      type:      'PDF',
      title:     title || '',
      url:       '',
      body:      fileUrl,
      duration:  0,
      order:     pdfOrder,
      isFree:    isFreeVal,
      createdBy
    });
    console.log('✅ PDF créé (order=' + part.order + '):', part._id.toString());
    return res.json({ success: true, part });
  } catch (error) {
    console.error('❌ Erreur uploadPDF:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// UPLOAD TEXTE — met à jour le champ body avec le contenu texte
// ─────────────────────────────────────────────────────────────────────────────
exports.uploadText = async (req, res) => {
  try {
    const { lessonId, title, body, order, isFree } = req.body;
    if (!lessonId || !title || !body) {
      return res.status(400).json({ success: false, error: 'lessonId, title et body requis' });
    }

    const lesson = await Lesson.findById(lessonId).populate('branchId').populate('subjectId').populate('unitId');
    if (!lesson) return res.status(400).json({ success: false, error: 'Leçon non trouvée' });

    const isFreeVal = isFree === 'true' || isFree === true;
    const createdBy = req.session?.user?.fullName || req.session?.user?.username || 'admin';

    // TOUJOURS créer un nouvel enregistrement
    const lastT = await LessonPart.findOne({ lessonId: lessonId.toString() })
      .sort({ order: -1 }).lean();
    const txtOrder = parseInt(order) || (lastT ? (lastT.order || 0) + 1 : 1);

    const part = await LessonPart.create({
      lessonId:  lessonId.toString(),
      lesson:    lesson.name || '',
      branchId:  lesson.branchId?._id?.toString() || lesson.branchId?.toString() || '',
      branch:    lesson.branchId?.name || '',
      subjectId: lesson.subjectId?._id?.toString() || lesson.subjectId?.toString() || '',
      subject:   lesson.subjectId?.name || '',
      unitId:    lesson.unitId?._id?.toString() || lesson.unitId?.toString() || '',
      unit:      lesson.unitId?.name || '',
      type:      'TEXT',
      title,
      url:       '',
      body,
      duration:  0,
      order:     txtOrder,
      isFree:    isFreeVal,
      createdBy
    });
    console.log('✅ Text créé (order=' + part.order + '):', part._id.toString());
    res.json({ success: true, part });
  } catch (error) {
    console.error('❌ Erreur uploadText:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
// Supprimer une partie
exports.delete = async (req, res) => {
  try {
    const part = await LessonPart.findById(req.params.id);
    if (!part) {
      req.flash('error', 'الجزء غير موجود');
      return res.redirect('/lesson');
    }

    const lessonId = part.lessonId;
    await LessonPart.findByIdAndDelete(req.params.id);

    req.flash('success', 'تم حذف الجزء بنجاح');
    res.redirect(`/lesson-part/lesson/${lessonId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

// Supprimer un document d'une partie
exports.deleteDocument = async (req, res) => {
  try {
    const { partId, docId } = req.params;
    
    const part = await LessonPart.findById(partId);
    if (!part) {
      return res.status(404).json({ success: false, error: 'Partie non trouvée' });
    }
    
    const docToRemove = part.documents.id(docId);
    if (!docToRemove) {
      return res.status(404).json({ success: false, error: 'Document non trouvé' });
    }
    
    // Supprimer le document
    part.documents = part.documents.filter(doc => doc._id.toString() !== docId);
    
    // Réordonner
    part.documents.forEach((doc, idx) => {
      doc.order = idx;
    });
    
    // Mettre à jour les anciens champs si le document supprimé était le principal
    if (part.documents.length > 0) {
      const firstDoc = part.documents[0];
      part.type = firstDoc.type;
      part.title = firstDoc.title;
      part.url = firstDoc.type === 'VIDEO' ? firstDoc.url : '';
      part.body = (firstDoc.type === 'TEXT' || firstDoc.type === 'QUIZ') ? firstDoc.content : (firstDoc.type === 'PDF' ? firstDoc.url : '');
    } else {
      part.type = 'TEXT';
      part.title = '';
      part.url = '';
      part.body = '';
    }
    
    await part.save();
    
    req.flash('success', 'تم حذف المستند بنجاح');
    res.redirect(`/lesson-part/lesson/${part.lessonId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('back');
  }
};

// ==================== PAGE D'ACCUEIL ====================

exports.listAll = async (req, res) => {
  try {
    const lessonDocs = await Lesson.find()
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .sort({ createdAt: -1 });

    const lessonsWithParts = await Promise.all(lessonDocs.map(async (lessonDoc) => {
      const lesson = lessonDoc.toObject();
      const partsCount = await LessonPart.countDocuments({ lessonId: lessonDoc._id });
      const parts = await LessonPart.find({ lessonId: lessonDoc._id })
        .sort({ order: 1 })
        .lean();
      parts.forEach(p => { p.id = p._id.toString(); });
      return { ...lesson, partsCount, parts };
    }));

    const totalParts = lessonsWithParts.reduce((sum, l) => sum + l.partsCount, 0);
    const totalDocs = lessonsWithParts.reduce((sum, l) => sum + (l.parts?.reduce((s, p) => s + (p.documents?.length || 0), 0) || 0), 0);

    res.render('lessonPart/index', {
      title: 'أجزاء الدروس',
      lessons: lessonsWithParts,
      stats: {
        totalLessons: lessonDocs.length,
        totalParts: totalParts,
        totalDocs: totalDocs,
        lessonsWithParts: lessonsWithParts.filter(l => l.partsCount > 0).length
      },
      active: { lessonPart: true }
    });
  } catch (error) {
    console.error(error);
    req.flash('error', error.message);
    res.redirect('/dashboard');
  }
};

// ==================== API ====================

exports.getPartsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const parts = await LessonPart.find({ lessonId })
      .sort({ order: 1 })
      .lean();

    res.json({ success: true, parts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalLessons = await Lesson.countDocuments();
    const totalParts = await LessonPart.countDocuments();
    const totalVideos = await LessonPart.countDocuments({ url: { $ne: '' } });
    const totalPDFs = await LessonPart.countDocuments({ body: { $ne: '' }, type: { $nin: ['TEXT', 'QUIZ'] } });
    
    res.json({
      success: true,
      totalLessons,
      totalParts,
      totalVideos,
      totalPDFs
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};