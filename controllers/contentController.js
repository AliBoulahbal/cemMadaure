const Lesson = require('../models/Lesson');
const LessonPart = require('../models/LessonPart');
const Branch = require('../models/Branch');
const Subject = require('../models/Subject');
const Unit = require('../models/Unit');
const traceabilityService = require('../services/traceabilityService');

// ==================== FORMULAIRE D'UPLOAD ====================

exports.uploadForm = async (req, res) => {
  try {
    const lessons = await Lesson.find()
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .lean();
    
    const branches = await Branch.find().lean();
    const subjects = await Subject.find().lean();
    const units = await Unit.find().lean();
    
    // Statistiques depuis LessonPart
    const stats = {
      videos: await LessonPart.countDocuments({ url: { $ne: '' } }),
      pdfs: await LessonPart.countDocuments({ body: { $ne: '' }, type: { $nin: ['TEXT', 'QUIZ'] } }),
      texts: await LessonPart.countDocuments({ type: 'TEXT' }),
      quizzes: await LessonPart.countDocuments({ type: 'QUIZ' }),
      images: 0,
      total: await LessonPart.countDocuments()
    };
    
    res.render('content/upload', { 
      title: 'رفع المحتوى',
      lessons: lessons,
      branches: branches,
      subjects: subjects,
      units: units,
      stats: stats,
      activeTab: 'video'
    });
  } catch (error) {
    console.error('Erreur uploadForm:', error);
    res.render('content/upload', { 
      error: error.message,
      lessons: [],
      branches: [],
      subjects: [],
      units: [],
      stats: { videos: 0, pdfs: 0, texts: 0, quizzes: 0, images: 0, total: 0 }
    });
  }
};

// ==================== APPROBATION (compatibilité) ====================

exports.approveContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await LessonPart.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    res.json({ success: true, message: 'Contenu approuvé' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.rejectContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await LessonPart.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    res.json({ success: true, message: 'Contenu rejeté' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== WASABI PRESIGNED URL ====================

exports.getPresignedUrl = async (req, res) => {
  try {
    const { type, ext } = req.query;
    
    if (!type || !ext) {
      return res.status(400).json({ error: 'Type et extension requis' });
    }
    
    let folder = '';
    let contentType = '';
    
    switch (type) {
      case 'video':
        folder = 'videos';
        contentType = 'video/mp4';
        break;
      case 'pdf':
        folder = 'pdfs';
        contentType = 'application/pdf';
        break;
      case 'image':
        folder = 'images';
        contentType = 'image/jpeg';
        break;
      default:
        folder = 'others';
        contentType = 'application/octet-stream';
    }
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const fileName = `${timestamp}_${random}.${ext}`;
    const key = `uploads/${folder}/${fileName}`;
    
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
    
    const s3 = new S3Client({
      endpoint: 'https://s3.eu-central-2.wasabisys.com',
      region: 'eu-central-2',
      credentials: {
        accessKeyId: process.env.WASABI_ACCESS_KEY,
        secretAccessKey: process.env.WASABI_SECRET_KEY,
      },
    });
    
    const command = new PutObjectCommand({
      Bucket: process.env.WASABI_BUCKET,
      Key: key,
      ContentType: contentType,
    });
    
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 });
    const publicUrl = `https://${process.env.WASABI_BUCKET}.s3.eu-central-2.wasabisys.com/${key}`;
    
    res.json({ url: signedUrl, key: key, publicUrl: publicUrl });
  } catch (error) {
    console.error('❌ Erreur getPresignedUrl:', error);
    res.status(500).json({ error: error.message });
  }
};

// ==================== UPLOAD VIDEO (URL Vimeo) ====================

exports.uploadVideoUrl = async (req, res) => {
  try {
    const { lessonId, title, order, videoUrl, isReel } = req.body;

    if (!videoUrl) {
      return res.status(400).json({ success: false, error: 'URL vidéo requise' });
    }

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner une leçon' });
    }

    const lesson = await Lesson.findById(lessonId)
      .populate('branchId')
      .populate('subjectId')
      .populate('unitId');

    if (!lesson) {
      return res.status(400).json({ success: false, error: 'Leçon non trouvée' });
    }

    const vimeoMatch = videoUrl.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (!vimeoMatch) {
      return res.status(400).json({ success: false, error: 'URL vidéo non reconnue (Vimeo uniquement)' });
    }

    // Chercher un document existant pour cette leçon
    let part = await LessonPart.findOne({ lessonId });

    if (part) {
      part.url = videoUrl;
      part.title = title || part.title;
      part.order = parseInt(order) || part.order;
      part.type = 'VIDEO';
      if (!part.body) part.body = '';
      await part.save();
      console.log('✅ Vidéo mise à jour dans LessonPart:', part._id);
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId._id,
        branch: lesson.branchId.name,
        subjectId: lesson.subjectId._id,
        subject: lesson.subjectId.name,
        unitId: lesson.unitId?._id || lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'VIDEO',
        title: title || 'Vidéo',
        url: videoUrl,
        body: '',
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
      console.log('✅ Nouveau LessonPart créé avec vidéo URL:', part._id);
    }

    if (isReel) {
      try {
        const VimeoCode = require('../models/VimeoCode');
        const generateCode = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
        let code = generateCode();
        let existing = await VimeoCode.findOne({ code });
        while (existing) {
          code = generateCode();
          existing = await VimeoCode.findOne({ code });
        }
        await VimeoCode.create({
          code: code,
          videoUrl: videoUrl,
          videoTitle: title || 'Reel',
          status: 'ACTIVE',
          createdBy: req.session.user.id
        });
        console.log('✅ Reel ajouté dans VimeoCode');
      } catch (reelError) {
        console.error('⚠️ Erreur ajout Reel:', reelError.message);
      }
    }

    return res.json({ success: true, content: part });
  } catch (error) {
    console.error('❌ Erreur uploadVideoUrl:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPLOAD VIDEO (FICHIER Wasabi) ====================

exports.uploadVideo = async (req, res) => {
  try {
    const { lessonId, title, order, fileKey, fileUrl, isReel } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'Aucun fichier vidéo téléchargé' });
    }

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner une leçon' });
    }

    const lesson = await Lesson.findById(lessonId)
      .populate('branchId')
      .populate('subjectId')
      .populate('unitId');

    if (!lesson) {
      return res.status(400).json({ success: false, error: 'Leçon non trouvée' });
    }

    let part = await LessonPart.findOne({ lessonId });

    if (part) {
      part.url = fileUrl;
      part.title = title || part.title;
      part.order = parseInt(order) || part.order;
      part.type = 'VIDEO';
      if (!part.body) part.body = '';
      await part.save();
      console.log('✅ Vidéo mise à jour dans LessonPart:', part._id);
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId._id,
        branch: lesson.branchId.name,
        subjectId: lesson.subjectId._id,
        subject: lesson.subjectId.name,
        unitId: lesson.unitId?._id || lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'VIDEO',
        title: title || 'Vidéo',
        url: fileUrl,
        body: '',
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
      console.log('✅ Nouveau LessonPart créé avec vidéo Wasabi:', part._id);
    }

    if (isReel) {
      try {
        const VimeoCode = require('../models/VimeoCode');
        const generateCode = () => Math.floor(1000000000 + Math.random() * 9000000000).toString();
        let code = generateCode();
        let existing = await VimeoCode.findOne({ code });
        while (existing) {
          code = generateCode();
          existing = await VimeoCode.findOne({ code });
        }
        await VimeoCode.create({
          code: code,
          videoUrl: fileUrl,
          videoTitle: title || 'Reel',
          status: 'ACTIVE',
          createdBy: req.session.user.id
        });
        console.log('✅ Reel ajouté dans VimeoCode');
      } catch (reelError) {
        console.error('⚠️ Erreur ajout Reel:', reelError.message);
      }
    }

    return res.json({ success: true, content: part });
  } catch (error) {
    console.error('❌ Erreur uploadVideo:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPLOAD PDF ====================

exports.uploadPDF = async (req, res) => {
  try {
    const { lessonId, title, order, fileKey, fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'Aucun fichier PDF téléchargé' });
    }

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner une leçon' });
    }

    const lesson = await Lesson.findById(lessonId)
      .populate('branchId')
      .populate('subjectId')
      .populate('unitId');

    if (!lesson) {
      return res.status(400).json({ success: false, error: 'Leçon non trouvée' });
    }

    let part = await LessonPart.findOne({ lessonId });

    if (part) {
      part.body = fileUrl;
      if (title) part.title = title;
      part.order = parseInt(order) || part.order;
      if (!part.url) part.type = 'PDF';
      await part.save();
      console.log('✅ PDF mis à jour dans LessonPart:', part._id);
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId._id,
        branch: lesson.branchId.name,
        subjectId: lesson.subjectId._id,
        subject: lesson.subjectId.name,
        unitId: lesson.unitId?._id || lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'PDF',
        title: title || 'Document PDF',
        url: '',
        body: fileUrl,
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
      console.log('✅ Nouveau LessonPart créé avec PDF:', part._id);
    }

    return res.json({ success: true, content: part });
  } catch (error) {
    console.error('❌ Erreur uploadPDF:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPLOAD IMAGE ====================

exports.uploadImage = async (req, res) => {
  try {
    const { lessonId, title, order, fileKey, fileUrl } = req.body;

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'Aucun fichier image téléchargé' });
    }

    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'Veuillez sélectionner une leçon' });
    }

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(400).json({ success: false, error: 'Leçon non trouvée' });
    }

    let part = await LessonPart.findOne({ lessonId });

    if (part) {
      part.body = fileUrl;
      part.title = title || part.title;
      part.order = parseInt(order) || part.order;
      part.type = 'TEXT';
      await part.save();
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId,
        branch: lesson.branchId?.name || '',
        subjectId: lesson.subjectId,
        subject: lesson.subjectId?.name || '',
        unitId: lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'TEXT',
        title: title || 'Image',
        url: '',
        body: fileUrl,
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
    }

    return res.json({ success: true, content: part });
  } catch (error) {
    console.error('❌ Erreur uploadImage:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== UPLOAD TEXTE ====================

exports.uploadText = async (req, res) => {
  try {
    const { lessonId, title, body, order } = req.body;
    
    if (!lessonId) {
      throw new Error('Veuillez sélectionner une leçon');
    }
    
    if (!body || body.trim() === '') {
      throw new Error('Le contenu textuel est requis');
    }
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Leçon non trouvée');
    }
    
    let part = await LessonPart.findOne({ lessonId });
    
    if (part) {
      part.body = body;
      part.title = title || part.title;
      part.order = parseInt(order) || part.order;
      part.type = 'TEXT';
      await part.save();
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId,
        branch: lesson.branchId?.name || '',
        subjectId: lesson.subjectId,
        subject: lesson.subjectId?.name || '',
        unitId: lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'TEXT',
        title: title || 'Contenu textuel',
        url: '',
        body: body,
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
    }
    
    console.log('✅ Texte créé dans LessonPart:', part._id);
    req.flash('success', '✅ Texte ajouté avec succès');
    res.redirect(`/content/manage/${lessonId}`);
  } catch (error) {
    console.error('❌ Erreur uploadText:', error);
    req.flash('error', error.message);
    res.redirect('/content/upload');
  }
};

// ==================== UPLOAD QUIZ ====================

exports.uploadQuiz = async (req, res) => {
  try {
    const { lessonId, title, questions, order } = req.body;
    
    if (!lessonId) {
      throw new Error('Veuillez sélectionner une leçon');
    }
    
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Leçon non trouvée');
    }
    
    let parsedQuestions;
    if (typeof questions === 'string') {
      parsedQuestions = JSON.parse(questions);
    } else {
      parsedQuestions = questions;
    }
    
    if (!parsedQuestions || parsedQuestions.length === 0) {
      throw new Error('Au moins une question est requise');
    }
    
    let part = await LessonPart.findOne({ lessonId });
    
    if (part) {
      part.body = JSON.stringify(parsedQuestions);
      part.title = title || part.title;
      part.order = parseInt(order) || part.order;
      part.type = 'QUIZ';
      await part.save();
    } else {
      part = await LessonPart.create({
        lessonId: lessonId,
        lesson: lesson.name,
        branchId: lesson.branchId,
        branch: lesson.branchId?.name || '',
        subjectId: lesson.subjectId,
        subject: lesson.subjectId?.name || '',
        unitId: lesson.unitId,
        unit: lesson.unitId?.name || '',
        type: 'QUIZ',
        title: title || 'Quiz',
        url: '',
        body: JSON.stringify(parsedQuestions),
        duration: 0,
        order: parseInt(order) || 0,
        isFree: false,
        createdBy: req.session.user?.fullName || req.session.user?.username || 'admin'
      });
    }
    
    console.log('✅ Quiz créé dans LessonPart:', part._id);
    req.flash('success', '✅ Quiz ajouté avec succès');
    res.redirect(`/content/manage/${lessonId}`);
  } catch (error) {
    console.error('❌ Erreur uploadQuiz:', error);
    req.flash('error', error.message);
    res.redirect('/content/upload');
  }
};

// ==================== GESTION DES CONTENUS ====================

exports.updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, data } = req.body;
    
    if (!id || !title) {
      return res.status(400).json({ success: false, error: 'Champs manquants' });
    }
    
    const content = await LessonPart.findById(id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    
    content.title = title;
    
    if (data) {
      if (data.url !== undefined) content.url = data.url;
      if (data.body !== undefined) content.body = data.body;
    }
    
    await content.save();
    res.json({ success: true, message: 'Contenu mis à jour' });
  } catch (error) {
    console.error('❌ Erreur updateContent:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== PAGE INDEX GESTION (liste toutes les leçons) ====================

exports.manageIndex = async (req, res) => {
  try {
    const lessons = await Lesson.find({ status: { $in: ['PUBLISHED', 'PENDING'] } })
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Pour chaque leçon, compter le nombre de parties
    const lessonsWithStats = await Promise.all(
      lessons.map(async (lesson) => {
        const parts = await LessonPart.find({ lessonId: lesson._id }).lean();
        return {
          ...lesson,
          id: lesson._id.toString(),
          partsCount: parts.length,
          hasVideo: parts.some(p => p.url && p.url !== ''),
          hasPdf: parts.some(p => p.body && p.body !== '' && p.type !== 'TEXT' && p.type !== 'QUIZ'),
        };
      })
    );

    const stats = {
      totalLessons: lessons.length,
      lessonsWithContent: lessonsWithStats.filter(l => l.partsCount > 0).length,
      totalParts: lessonsWithStats.reduce((sum, l) => sum + l.partsCount, 0),
      videos: await LessonPart.countDocuments({ url: { $ne: '' } }),
      pdfs: await LessonPart.countDocuments({ body: { $ne: '' }, type: { $nin: ['TEXT', 'QUIZ'] } }),
      texts: await LessonPart.countDocuments({ type: 'TEXT' }),
    };

    res.render('content/manage-index', {
      title: 'إدارة المحتوى',
      lessons: lessonsWithStats,
      stats,
      active: { upload: true }
    });
  } catch (error) {
    console.error('❌ Erreur manageIndex:', error);
    req.flash('error', error.message);
    res.redirect('/dashboard');
  }
};

exports.manage = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate('branchId', 'name')
      .populate('subjectId', 'name')
      .populate('unitId', 'name')
      .lean();
    
    if (!lesson) {
      req.flash('error', 'Leçon non trouvée');
      return res.redirect('/lesson');
    }
    
    const contents = await LessonPart.find({ lessonId: req.params.lessonId })
      .sort({ order: 1 })
      .lean();
    
    const stats = {
      videos: contents.filter(c => c.url && c.url !== '').length,
      pdfs: contents.filter(c => c.body && c.body !== '' && c.type !== 'TEXT' && c.type !== 'QUIZ').length,
      texts: contents.filter(c => c.type === 'TEXT').length,
      quizzes: contents.filter(c => c.type === 'QUIZ').length,
      images: 0,
      total: contents.length,
      pending: 0,
      published: contents.length
    };
    
    res.render('content/manage', { 
      title: `Gérer le contenu: ${lesson.name}`,
      lesson: lesson,
      contents: contents,
      stats: stats,
      userRole: req.session.user.role,
      canPublish: true
    });
  } catch (error) {
    console.error('❌ Erreur manage:', error);
    req.flash('error', error.message);
    res.redirect('/lesson');
  }
};

exports.recentContent = async (req, res) => {
  try {
    const contents = await LessonPart.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    
    const stats = {
      videos: await LessonPart.countDocuments({ url: { $ne: '' } }),
      pdfs: await LessonPart.countDocuments({ body: { $ne: '' }, type: { $nin: ['TEXT', 'QUIZ'] } }),
      texts: await LessonPart.countDocuments({ type: 'TEXT' }),
      quizzes: await LessonPart.countDocuments({ type: 'QUIZ' }),
      images: 0,
      total: await LessonPart.countDocuments(),
      pending: 0,
      published: await LessonPart.countDocuments()
    };
    
    res.render('content/recent', { 
      title: 'المحتوى الحديث',
      contents: contents,
      stats: stats,
      userRole: req.session.user.role
    });
  } catch (error) {
    console.error('❌ Erreur recentContent:', error);
    res.render('content/recent', { 
      error: error.message,
      contents: [],
      stats: { videos: 0, pdfs: 0, texts: 0, quizzes: 0, images: 0, total: 0 }
    });
  }
};

exports.updateText = async (req, res) => {
  try {
    const { contentId, title, body } = req.body;
    
    if (!contentId || !title || !body) {
      return res.status(400).json({ success: false, error: 'Champs manquants' });
    }
    
    const content = await LessonPart.findById(contentId);
    if (!content) {
      return res.status(404).json({ success: false, error: 'Contenu non trouvé' });
    }
    
    content.title = title;
    content.body = body;
    content.type = 'TEXT';
    await content.save();
    
    res.json({ success: true, message: 'Contenu mis à jour' });
  } catch (error) {
    console.error('❌ Erreur updateText:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.delete = async (req, res) => {
  try {
    const content = await LessonPart.findById(req.params.id);
    if (!content) {
      req.flash('error', 'Contenu non trouvé');
      return res.redirect('back');
    }
    
    const lessonId = content.lessonId;
    await LessonPart.findByIdAndDelete(req.params.id);
    
    req.flash('success', 'Contenu supprimé avec succès');
    res.redirect(`/content/manage/${lessonId}`);
  } catch (error) {
    console.error('❌ Erreur delete:', error);
    req.flash('error', error.message);
    res.redirect('back');
  }
};

exports.reorder = async (req, res) => {
  try {
    const { orders } = req.body;
    
    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ success: false, error: 'Données invalides' });
    }
    
    for (const item of orders) {
      await LessonPart.findByIdAndUpdate(item.id, { order: item.order });
    }
    
    res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (error) {
    console.error('❌ Erreur reorder:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getContentsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    
    if (!lessonId) {
      return res.status(400).json({ success: false, error: 'ID de leçon requis' });
    }
    
    const contents = await LessonPart.find({ lessonId: lessonId })
      .sort({ order: 1 })
      .lean();
    
    res.json({ success: true, contents: contents });
  } catch (error) {
    console.error('❌ Erreur getContentsByLesson:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};