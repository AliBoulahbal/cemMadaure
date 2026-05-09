const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers pour les médias des quiz
const quizMediaDirs = [
    'public/uploads/quiz/images',
    'public/uploads/quiz/videos',
    'public/uploads/quiz/audio'
];

quizMediaDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Dossier créé: ${fullPath}`);
    }
});

// Configuration pour les images
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/quiz/images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'quiz-img-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration pour les vidéos
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/quiz/videos'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'quiz-video-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Configuration pour l'audio
const audioStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/quiz/audio'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'quiz-audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtres
const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('صيغة الصورة غير مدعومة'), false);
    }
};

const videoFilter = (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('صيغة الفيديو غير مدعومة'), false);
    }
};

const audioFilter = (req, file, cb) => {
    const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('صيغة الصوت غير مدعومة'), false);
    }
};

// Middlewares multer
const uploadQuizImage = multer({ 
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

const uploadQuizVideo = multer({ 
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

const uploadQuizAudio = multer({ 
    storage: audioStorage,
    fileFilter: audioFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB
});

// Middleware pour gérer plusieurs fichiers
const uploadQuizMedia = multer({
    storage: imageStorage,
    limits: { fileSize: 10 * 1024 * 1024 }
}).fields([
    { name: 'questionMedia', maxCount: 1 },
    { name: 'optionMedia', maxCount: 10 },
    { name: 'explanationMedia', maxCount: 1 }
]);

module.exports = { 
    uploadQuizImage: uploadQuizImage.single('file'),
    uploadQuizVideo: uploadQuizVideo.single('file'),
    uploadQuizAudio: uploadQuizAudio.single('file'),
    uploadQuizMedia: uploadQuizMedia
};