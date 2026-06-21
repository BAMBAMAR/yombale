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
      { folder: folder || 'annonces', resource_type: 'image',
        quality: 'auto', fetch_format: 'auto', max_bytes: 5 * 1024 * 1024 },
      function(err, result) {
        if (err) return reject(err);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}

module.exports = { uploadBuffer };
