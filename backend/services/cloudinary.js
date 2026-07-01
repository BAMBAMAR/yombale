// backend/services/cloudinary.js — Upload d'images vers Cloudinary
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadBuffer(buffer, folder) {
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

module.exports = { uploadBuffer };
