const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Créer les dossiers s'ils n'existent pas
const uploadDirs = [
    path.join(__dirname, '..', 'public/uploads/videos'),
    path.join(__dirname, '..', 'public/uploads/pdfs'),
    path.join(__dirname, '..', 'public/uploads/images')
];

uploadDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Dossier créé: ${dir}`);
    }
});

// ==================== CONFIGURATION VIDÉO ====================
const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/videos'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'video-' + uniqueSuffix + ext);
    }
});

const videoFilter = (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format vidéo non supporté. Utilisez MP4, WebM, AVI ou MOV'), false);
    }
};

const uploadVideo = multer({ 
    storage: videoStorage,
    fileFilter: videoFilter,
    limits: { 
        fileSize: 100 * 1024 * 1024 // 100MB
    }
});

// ==================== CONFIGURATION PDF ====================
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/pdfs'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'pdf-' + uniqueSuffix + '.pdf');
    }
});

const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Seuls les fichiers PDF sont acceptés'), false);
    }
};

const uploadPDF = multer({ 
    storage: pdfStorage,
    fileFilter: pdfFilter,
    limits: { 
        fileSize: 50 * 1024 * 1024 // 50MB
    }
});

// ==================== CONFIGURATION IMAGE ====================
const imageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '..', 'public/uploads/images'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'image-' + uniqueSuffix + ext);
    }
});

const imageFilter = (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format image non supporté. Utilisez JPG, PNG, GIF, WebP, BMP ou SVG'), false);
    }
};

const uploadImage = multer({ 
    storage: imageStorage,
    fileFilter: imageFilter,
    limits: { 
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// ==================== EXPORTS ====================
module.exports = { 
    uploadVideo: uploadVideo.single('file'),
    uploadPDF: uploadPDF.single('file'),
    uploadImage: uploadImage.single('file')
};