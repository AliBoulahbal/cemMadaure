const VimeoCode = require('../models/VimeoCode');

// ==================== CRUD PRINCIPAL ====================

/**
 * Liste tous les codes Vimeo
 * GET /vimeo-code
 */
exports.list = async (req, res) => {
  try {
    const codes = await VimeoCode.find()
      .sort({ createdAt: -1 })
      .lean();

    const stats = {
      total: codes.length,
      pending: codes.filter(c => c.status === "PENDING").length,
      active: codes.filter(c => c.status === "ACTIVE").length,
      used: codes.filter(c => c.status === "USED").length,
      expired: codes.filter(c => c.status === "EXPIRED").length,
    };

    res.render("vimeoCode/index", {
      title: "رموز Vimeo",
      codes: codes,
      stats: stats,
      active: { vimeoCode: true },
    });
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/dashboard");
  }
};

/**
 * Formulaire de création d'un code
 * GET /vimeo-code/create
 */
exports.createForm = async (req, res) => {
  try {
    res.render("vimeoCode/create", {
      title: "إضافة رمز Vimeo جديد",
      active: { vimeoCode: true },
    });
  } catch (error) {
    console.error(error);
    res.redirect("/vimeo-code");
  }
};

/**
 * Créer un nouveau code
 * POST /vimeo-code/create
 */
exports.create = async (req, res) => {
  try {
    let { code, user, status, videoUrl, videoTitle, description, expiresAt } = req.body;

    const existingCode = await VimeoCode.findOne({ code });
    if (existingCode) {
      req.flash("error", "هذا الرمز موجود بالفعل");
      return res.redirect("/vimeo-code/create");
    }

    // 🔥 Calculer le prochain ordre
    const lastReel = await VimeoCode.findOne().sort({ order: -1 });
    const nextOrder = (lastReel?.order || 0) + 1;

    if (!videoUrl || videoUrl.trim() === "") {
      if (code && /^\d+$/.test(code)) {
        videoUrl = `https://vimeo.com/${code}`;
      }
    }

    await VimeoCode.create({
      code,
      user: user || "education",
      status: status || "PENDING",
      videoUrl: videoUrl || "",
      videoTitle: videoTitle || "",
      description: description || "",
      order: nextOrder,           // ⭐ AJOUTER L'ORDRE
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.session?.user?.fullName || req.session?.user?.username || "admin",
    });

    req.flash("success", "تم إضافة الرمز بنجاح");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code/create");
  }
};

/**
 * Formulaire d'édition d'un code
 * GET /vimeo-code/edit/:id
 */
exports.editForm = async (req, res) => {
  try {
    const code = await VimeoCode.findById(req.params.id).lean();
    if (!code) {
      req.flash("error", "الرمز غير موجود");
      return res.redirect("/vimeo-code");
    }

    res.render("vimeoCode/edit", {
      title: "تعديل رمز Vimeo",
      code: code,
      active: { vimeoCode: true },
    });
  } catch (error) {
    console.error(error);
    res.redirect("/vimeo-code");
  }
};

/**
 * Mettre à jour un code
 * PUT /vimeo-code/update/:id
 */
exports.update = async (req, res) => {
  try {
    const { code, user, status, videoUrl, videoTitle, description, expiresAt } = req.body;

    await VimeoCode.findByIdAndUpdate(req.params.id, {
      code,
      user: user || "education",
      status: status || "PENDING",
      videoUrl: videoUrl || "",
      videoTitle: videoTitle || "",
      description: description || "",
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    req.flash("success", "تم تحديث الرمز بنجاح");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect(`/vimeo-code/edit/${req.params.id}`);
  }
};

/**
 * Supprimer un code
 * DELETE /vimeo-code/delete/:id
 */
exports.delete = async (req, res) => {
  try {
    const code = await VimeoCode.findById(req.params.id);
    if (!code) {
      req.flash("error", "الرمز غير موجود");
      return res.redirect("/vimeo-code");
    }

    await VimeoCode.findByIdAndDelete(req.params.id);
    req.flash("success", "تم حذف الرمز بنجاح");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code");
  }
};

/**
 * Marquer un code comme utilisé
 * POST /vimeo-code/mark-used/:id
 */
exports.markAsUsed = async (req, res) => {
  try {
    await VimeoCode.findByIdAndUpdate(req.params.id, {
      status: "USED",
      usedAt: new Date(),
    });
    req.flash("success", "تم تحديث حالة الرمز إلى مستخدم");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code");
  }
};

/**
 * Marquer un code comme actif
 * POST /vimeo-code/mark-active/:id
 */
exports.markAsActive = async (req, res) => {
  try {
    await VimeoCode.findByIdAndUpdate(req.params.id, {
      status: "ACTIVE",
    });
    req.flash("success", "تم تحديث حالة الرمز إلى نشط");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code");
  }
};

/**
 * Générer un nouveau code aléatoire
 * POST /vimeo-code/generate
 */
exports.generate = async (req, res) => {
  try {
    const generateCode = () => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    let code = generateCode();
    let existing = await VimeoCode.findOne({ code });
    while (existing) {
      code = generateCode();
      existing = await VimeoCode.findOne({ code });
    }

    await VimeoCode.create({
      code,
      user: req.body.user || "education",
      status: "PENDING",
      createdBy: req.session?.user?.fullName || req.session?.user?.username || "admin",
    });

    req.flash("success", `تم إنشاء رمز جديد: ${code}`);
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error(error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code");
  }
};

// ==================== UPLOAD REEL (comme contentController) ====================

/**
 * Formulaire d'upload de Reel
 * GET /vimeo-code/upload
 */
exports.uploadForm = async (req, res) => {
  try {
    // Récupérer les statistiques
    const stats = {
      total: await VimeoCode.countDocuments(),
      active: await VimeoCode.countDocuments({ status: 'ACTIVE' }),
      pending: await VimeoCode.countDocuments({ status: 'PENDING' }),
      used: await VimeoCode.countDocuments({ status: 'USED' }),
      expired: await VimeoCode.countDocuments({ status: 'EXPIRED' }),
    };

    res.render("vimeoCode/upload", {
      title: "رفع Reel",
      stats: stats,
      active: { vimeoCode: true },
    });
  } catch (error) {
    console.error(error);
    res.redirect("/vimeo-code");
  }
};

/**
 * Upload de Reel par URL Vimeo
 * POST /vimeo-code/upload/url
 */
exports.uploadReelByUrl = async (req, res) => {
  try {
    const { videoUrl, title, description, userName, userPhotoUrl } = req.body;

    console.log('📹 uploadReelByUrl called:', { videoUrl, title });

    if (!videoUrl) {
      return res.status(400).json({ success: false, error: 'URL vidéo requise' });
    }

    // Extraire l'ID Vimeo
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const match = videoUrl.match(vimeoRegex);
    const vimeoId = match ? match[1] : null;

    if (!vimeoId) {
      return res.status(400).json({ success: false, error: 'URL Vimeo invalide' });
    }

    // Générer un code unique
    const generateCode = () => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    let code = generateCode();
    let existing = await VimeoCode.findOne({ code });
    while (existing) {
      code = generateCode();
      existing = await VimeoCode.findOne({ code });
    }

    // Créer le Reel
    const newReel = await VimeoCode.create({
      code: code,
      videoUrl: videoUrl,
      videoTitle: title || 'Nouveau Reel',
      description: description || '',
      user: userName || req.session?.user?.fullName || 'Éducation CEM',
      userPhotoUrl: userPhotoUrl || '',
      status: 'ACTIVE',
      createdBy: req.session?.user?.id || 'admin'
    });

    console.log('✅ Reel créé:', newReel.code);

    // Retourner la réponse comme contentController
    if (req.xhr || req.headers['content-type'] === 'application/json') {
      return res.json({ 
        success: true, 
        message: 'Reel créé avec succès',
        reel: {
          id: newReel._id,
          code: newReel.code,
          videoUrl: newReel.videoUrl,
          title: newReel.videoTitle
        }
      });
    }

    req.flash("success", "Reel créé avec succès");
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error("Erreur uploadReelByUrl:", error);
    
    if (req.xhr || req.headers['content-type'] === 'application/json') {
      return res.status(500).json({ success: false, error: error.message });
    }
    
    req.flash("error", error.message);
    res.redirect("/vimeo-code/upload");
  }
};

/**
 * Upload de Reel par fichier (Wasabi)
 * POST /vimeo-code/upload/file
 */
exports.uploadReelByFile = async (req, res) => {
  try {
    const { fileUrl, title, description, userName, userPhotoUrl } = req.body;

    console.log('📹 uploadReelByFile called:', { fileUrl, title });

    if (!fileUrl) {
      return res.status(400).json({ success: false, error: 'URL du fichier requise' });
    }

    // Générer un code unique
    const generateCode = () => {
      return Math.floor(1000000000 + Math.random() * 9000000000).toString();
    };

    let code = generateCode();
    let existing = await VimeoCode.findOne({ code });
    while (existing) {
      code = generateCode();
      existing = await VimeoCode.findOne({ code });
    }

    // Créer le Reel
    const newReel = await VimeoCode.create({
      code: code,
      videoUrl: fileUrl,
      videoTitle: title || 'Nouveau Reel',
      description: description || '',
      user: userName || req.session?.user?.fullName || 'Éducation CEM',
      userPhotoUrl: userPhotoUrl || '',
      status: 'ACTIVE',
      createdBy: req.session?.user?.id || 'admin'
    });

    console.log('✅ Reel créé par fichier:', newReel.code);

    return res.json({ 
      success: true, 
      message: 'Reel créé avec succès',
      reel: {
        id: newReel._id,
        code: newReel.code,
        videoUrl: newReel.videoUrl,
        title: newReel.videoTitle
      }
    });
  } catch (error) {
    console.error("Erreur uploadReelByFile:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== REELS ====================

/**
 * Formulaire de création de Reel (simple)
 * GET /vimeo-code/reel/create
 */
exports.createReelForm = async (req, res) => {
  try {
    res.render("vimeoCode/reelCreate", {
      title: "Ajouter un Reel",
      active: { vimeoCode: true },
    });
  } catch (error) {
    console.error(error);
    res.redirect("/vimeo-code");
  }
};

/**
 * Créer un nouveau Reel (simple)
 * POST /vimeo-code/reel/create
 */
exports.createReel = async (req, res) => {
  try {
    let { videoUrl, title, description, userName, userPhotoUrl } = req.body;

    if (!videoUrl) {
      req.flash("error", "URL vidéo requise");
      return res.redirect("/vimeo-code/reel/create");
    }

    let vimeoId = null;
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const match = videoUrl.match(vimeoRegex);
    
    if (match && match[1]) {
      vimeoId = match[1];
    } else if (/^\d+$/.test(videoUrl)) {
      vimeoId = videoUrl;
      videoUrl = `https://vimeo.com/${vimeoId}`;
    }

    if (!vimeoId) {
      req.flash("error", "URL Vimeo invalide");
      return res.redirect("/vimeo-code/reel/create");
    }

    const code = vimeoId;
    
    let existing = await VimeoCode.findOne({ code });
    if (existing) {
      req.flash("error", "Ce Reel existe déjà");
      return res.redirect("/vimeo-code/reel/create");
    }

    // 🔥 Calculer le prochain ordre
    const lastReel = await VimeoCode.findOne().sort({ order: -1 });
    const nextOrder = (lastReel?.order || 0) + 1;

    await VimeoCode.create({
      code: code,
      videoUrl: videoUrl,
      videoTitle: title || "Nouveau Reel",
      description: description || "",
      user: userName || "Éducation CEM",
      userPhotoUrl: userPhotoUrl || "",
      order: nextOrder,           // ⭐ AJOUTER L'ORDRE
      status: "ACTIVE",
      createdBy: req.session?.user?.fullName || "admin"
    });

    req.flash("success", `Reel créé avec succès (ordre: ${nextOrder})`);
    res.redirect("/vimeo-code");
  } catch (error) {
    console.error("Erreur createReel:", error);
    req.flash("error", error.message);
    res.redirect("/vimeo-code/reel/create");
  }
};

/**
 * API: Récupérer tous les Reels actifs
 * GET /vimeo-code/api/reels
 */
exports.getReels = async (req, res) => {
  try {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    
    const activeCodes = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    })
      .sort({ order: 1, createdAt: -1 })  // 🔥 TRI PAR ORDRE
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
          order: vc.order,        // ⭐ INCLURE L'ORDRE
          videoUrl: vc.videoUrl,
          title: vc.videoTitle || 'Vidéo sans titre',
          description: vc.description || '',
          userName: vc.user || 'Éducation CEM',
          userPhotoUrl: vc.userPhotoUrl || '',
          status: vc.status,
          code: vc.code,
          thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
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
 * API: Récupérer les IDs Vimeo des Reels (pour app mobile)
 * GET /vimeo-code/api/reels/ids
 */
exports.getReelIds = async (req, res) => {
  try {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/i;
    const ids = [];

    const activeReels = await VimeoCode.find({ 
      status: 'ACTIVE',
      videoUrl: { $ne: '' }
    }).lean();

    for (const reel of activeReels) {
      if (reel.videoUrl) {
        const match = reel.videoUrl.match(vimeoRegex);
        if (match && match[1]) {
          ids.push(match[1]);
        }
      }
    }

    res.json([...new Set(ids)]);
  } catch (error) {
    console.error("Erreur getReelIds:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * API: Récupérer un Reel par son code
 * GET /vimeo-code/api/reels/:code
 */
exports.getReelByCode = async (req, res) => {
  try {
    const { code } = req.params;
    const reel = await VimeoCode.findOne({ code }).lean();

    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel non trouvé" });
    }

    res.json({
      success: true,
      reel: {
        id: reel._id,
        code: reel.code,
        videoUrl: reel.videoUrl,
        title: reel.videoTitle,
        description: reel.description,
        userName: reel.user,
        userPhotoUrl: reel.userPhotoUrl,
        status: reel.status
      }
    });
  } catch (error) {
    console.error("Erreur getReelByCode:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * API: Mettre à jour un Reel
 * PUT /vimeo-code/api/reels/:code
 */
exports.updateReel = async (req, res) => {
  try {
    const { code } = req.params;
    const { title, description, userName, userPhotoUrl, status } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.videoTitle = title;
    if (description !== undefined) updateData.description = description;
    if (userName !== undefined) updateData.user = userName;
    if (userPhotoUrl !== undefined) updateData.userPhotoUrl = userPhotoUrl;
    if (status !== undefined) updateData.status = status;

    const updated = await VimeoCode.findOneAndUpdate(
      { code },
      updateData,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Reel non trouvé" });
    }

    res.json({
      success: true,
      message: "Reel mis à jour",
      reel: updated
    });
  } catch (error) {
    console.error("Erreur updateReel:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * API: Supprimer un Reel
 * DELETE /vimeo-code/api/reels/:code
 */
exports.deleteReel = async (req, res) => {
  try {
    const { code } = req.params;
    const deleted = await VimeoCode.findOneAndDelete({ code });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Reel non trouvé" });
    }

    res.json({
      success: true,
      message: "Reel supprimé avec succès"
    });
  } catch (error) {
    console.error("Erreur deleteReel:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==================== API POUR APPLICATION MOBILE ====================

/**
 * Vérifier un code Vimeo
 * GET /vimeo-code/api/verify/:code
 */
exports.verifyVimeoCode = async (req, res) => {
  try {
    const { code } = req.params;
    const vimeoCode = await VimeoCode.findOne({ code });

    if (!vimeoCode) {
      return res.status(404).json({ success: false, message: "Code invalide" });
    }

    if (vimeoCode.status === 'USED') {
      return res.status(400).json({ success: false, message: "Ce code a déjà été utilisé" });
    }

    if (vimeoCode.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: "Ce code a expiré" });
    }

    if (vimeoCode.expiresAt && new Date() > vimeoCode.expiresAt) {
      await VimeoCode.findByIdAndUpdate(vimeoCode._id, { status: 'EXPIRED' });
      return res.status(400).json({ success: false, message: "Ce code a expiré" });
    }

    res.json({
      success: true,
      code: {
        id: vimeoCode._id,
        code: vimeoCode.code,
        status: vimeoCode.status,
        videoUrl: vimeoCode.videoUrl,
        videoTitle: vimeoCode.videoTitle,
        description: vimeoCode.description
      }
    });
  } catch (error) {
    console.error("Erreur verifyVimeoCode:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Utiliser un code Vimeo (marquer comme utilisé)
 * POST /vimeo-code/api/use
 */
exports.useVimeoCode = async (req, res) => {
  try {
    const { code } = req.body;
    const vimeoCode = await VimeoCode.findOne({ code });

    if (!vimeoCode) {
      return res.status(404).json({ success: false, message: "Code invalide" });
    }

    if (vimeoCode.status === 'USED') {
      return res.status(400).json({ success: false, message: "Ce code a déjà été utilisé" });
    }

    if (vimeoCode.status === 'EXPIRED') {
      return res.status(400).json({ success: false, message: "Ce code a expiré" });
    }

    if (vimeoCode.expiresAt && new Date() > vimeoCode.expiresAt) {
      await VimeoCode.findByIdAndUpdate(vimeoCode._id, { status: 'EXPIRED' });
      return res.status(400).json({ success: false, message: "Ce code a expiré" });
    }

    await VimeoCode.findByIdAndUpdate(vimeoCode._id, {
      status: 'USED',
      usedAt: new Date()
    });

    res.json({
      success: true,
      message: "Code utilisé avec succès",
      video: {
        url: vimeoCode.videoUrl,
        title: vimeoCode.videoTitle,
        description: vimeoCode.description
      }
    });
  } catch (error) {
    console.error("Erreur useVimeoCode:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupérer une vidéo par code
 * GET /vimeo-code/api/video/:code
 */
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
        id: vimeoCode._id,
        title: vimeoCode.videoTitle,
        url: vimeoCode.videoUrl,
        description: vimeoCode.description,
        status: vimeoCode.status
      }
    });
  } catch (error) {
    console.error("Erreur getVideoByVimeoCode:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Récupérer tous les codes actifs
 * GET /vimeo-code/api/active
 */
exports.getActiveVimeoCodes = async (req, res) => {
  try {
    const codes = await VimeoCode.find({ status: { $in: ['ACTIVE', 'PENDING'] } })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      codes: codes,
      count: codes.length
    });
  } catch (error) {
    console.error("Erreur getActiveVimeoCodes:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};