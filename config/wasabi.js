const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const s3 = new S3Client({
  endpoint: 'https://s3.eu-central-2.wasabisys.com',
  region: 'eu-central-2',
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const BUCKET = process.env.WASABI_BUCKET;

const FOLDERS = {
  video: 'uploads/videos',
  pdf:   'uploads/pdfs',
  image: 'uploads/images',
  audio: 'uploads/audios',   // ← ajouté
};

const MIME_TYPES = {
  // video
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', mov: 'video/quicktime',
  // pdf
  pdf: 'application/pdf',
  // image
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif',
  // audio ← ajouté
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', aac: 'audio/aac',
};

async function getPresignedUrl(type, ext) {
  const folder = FOLDERS[type];
  if (!folder) throw new Error('Type inconnu: ' + type);
  const key = `${folder}/${uuidv4()}.${ext.toLowerCase()}`;
  const contentType = MIME_TYPES[ext.toLowerCase()] || 'application/octet-stream';
  const command = new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType });
  const url = await getSignedUrl(s3, command, {
    expiresIn: 3600,
    unhoistableHeaders: new Set(['x-amz-checksum-crc32']),
  });
  const publicUrl = `https://s3.eu-central-2.wasabisys.com/${BUCKET}/${key}`;
  return { url, key, publicUrl };
}

module.exports = { getPresignedUrl };
