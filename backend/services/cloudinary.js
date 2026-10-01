// backend/services/cloudinary.js — Upload d'images vers Cloudinary
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const { exigerTypes, IMAGES_OU_PDF, VIDEOS, DOCUMENTS } = require('../lib/fichiersAutorises'); // AUD-146 : contenu réel contrôlé avant tout envoi

async function uploadBuffer(buffer, folder) {
  exigerTypes(buffer, IMAGES_OU_PDF, 'image');
  return new Promise(function(resolve, reject) {
    var stream = cloudinary.uploader.upload_stream(
      {
        folder:        folder || 'annonces',
        resource_type: 'image',
        quality:       90,
        fetch_format:  'auto',
        flags:         'progressive',
        max_bytes:     8 * 1024 * 1024,
        // Watermark © Nopalou en bas à droite (30% opacité)
        transformation: [
          { overlay: { font_family: 'Arial', font_size: 18, font_weight: 'bold', text: '© nopalou.com' },
            color: 'white', opacity: 35, gravity: 'south_east', x: 10, y: 10 }
        ],
        // Générer automatiquement des variantes optimisées
        eager: [
          { width: 800,  crop: 'limit', quality: 90, fetch_format: 'auto' },
          { width: 400,  crop: 'limit', quality: 85, fetch_format: 'auto' },
        ],
        eager_async: true,
      },
      function(err, result) {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadVideoBuffer(buffer, folder) {
  exigerTypes(buffer, VIDEOS, 'vidéo');
  return new Promise(function(resolve, reject) {
    var stream = cloudinary.uploader.upload_stream(
      {
        folder:        folder || 'biens_videos',
        resource_type: 'video',
        max_bytes:     50 * 1024 * 1024,
      },
      function(err, result) {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

async function uploadDocumentBuffer(buffer, folder, filename) {
  exigerTypes(buffer, DOCUMENTS, 'document');
  return new Promise(function(resolve, reject) {
    var stream = cloudinary.uploader.upload_stream(
      {
        folder: folder || 'documents_locatif',
        resource_type: 'auto',
        max_bytes: 15 * 1024 * 1024,
      },
      function(err, result) {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

// Upload par URL distante — Cloudinary accepte directement une URL source.
// Utilisé par le scraper FB pour persister les images fbcdn.net (URLs signées temporaires).
// Timeout 15s : les URLs fbcdn expirent vite, inutile d'attendre plus longtemps.
async function uploadFromUrl(url, folder) {
  const result = await cloudinary.uploader.upload(url, {
    folder:        folder || 'annonces/fb',
    resource_type: 'image',
    quality:       85,
    fetch_format:  'auto',
    flags:         'progressive',
    timeout:       15000,
    // Watermark léger identique aux autres uploads
    transformation: [
      { overlay: { font_family: 'Arial', font_size: 16, font_weight: 'bold', text: '© nopalou.com' },
        color: 'white', opacity: 30, gravity: 'south_east', x: 8, y: 8 }
    ],
  });
  return result; // expose secure_url, public_id, etc.
}

module.exports = { uploadBuffer, uploadVideoBuffer, uploadDocumentBuffer, uploadFromUrl };
