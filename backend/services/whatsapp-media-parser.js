// backend/services/whatsapp-media-parser.js
// Service d'analyse et d'OCR pour les imports médias directs (WhatsApp Status, Galerie Marchand)

let Tesseract;
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.warn('[WHATSAPP_OCR] Tesseract non disponible:', e.message);
  Tesseract = null;
}

const {
  extractPricesFromText,
  extractHashtags,
  matchProductsWithCaption,
} = require('./social-parser');

let cachedWorker = null;

async function getOcrWorker() {
  if (cachedWorker) return cachedWorker;
  if (!Tesseract) return null;
  try {
    cachedWorker = await Tesseract.createWorker('fra', 1, {
      logger: () => {},
    });
    return cachedWorker;
  } catch (err) {
    console.warn('[WHATSAPP_OCR_INIT_WARN]', err.message);
    return null;
  }
}

/**
 * Extrait le texte d'un buffer d'image via Tesseract OCR
 */
async function extractTextFromImageBuffer(imageBuffer) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) return '';

  try {
    const worker = await getOcrWorker();
    if (worker) {
      const { data } = await worker.recognize(imageBuffer);
      return (data?.text || '').trim();
    } else if (Tesseract) {
      const { data } = await Tesseract.recognize(imageBuffer, 'fra');
      return (data?.text || '').trim();
    }
  } catch (err) {
    console.warn('[WHATSAPP_OCR_PARSE_ERR]', err.message);
  }
  return '';
}

/**
 * Analyse un média uploadé et effectue l'OCR + le Smart Matching
 */
async function parseWhatsAppMedia(buffer, mimeType, caption = '', products = []) {
  let ocrText = '';

  // Si c'est une image (JPEG, PNG, WebP), exécuter l'OCR
  if (mimeType && mimeType.startsWith('image/')) {
    ocrText = await extractTextFromImageBuffer(buffer);
  }

  // Combiner la légende fournie par l'utilisateur et le texte extrait par l'OCR
  const fullText = [caption, ocrText].filter(Boolean).join(' ');

  const detectedPrices = extractPricesFromText(fullText);
  const detectedHashtags = extractHashtags(fullText);
  const suggestions = matchProductsWithCaption(fullText, products);

  return {
    ocr_text: ocrText,
    full_text: fullText,
    detected_prices: detectedPrices,
    detected_hashtags: detectedHashtags,
    suggestions,
  };
}

module.exports = {
  extractTextFromImageBuffer,
  parseWhatsAppMedia,
};
