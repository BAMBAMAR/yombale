// backend/services/social-parser.js
// Analyseur officiel d'URLs sociales, résolveur oEmbed et moteur de Smart Matching produits

const https = require('https');
const http = require('http');

/**
 * Normalise une chaîne de texte pour comparaison textuelle
 */
function normalizeText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Détecte la plateforme sociale à partir de l'URL
 */
function detectPlatform(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();

  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';

  return null;
}

/**
 * Extrait l'identifiant externe stable d'un post
 */
function extractExternalPostId(url, platform) {
  try {
    const u = new URL(url);
    if (platform === 'instagram') {
      const match = u.pathname.match(/\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (match) return match[1];
    } else if (platform === 'tiktok') {
      const match = u.pathname.match(/\/video\/(\d+)/);
      if (match) return match[1];
      const codeMatch = u.pathname.match(/\/([a-zA-Z0-9]+)/);
      if (codeMatch) return codeMatch[1];
    } else if (platform === 'facebook') {
      const vMatch = u.searchParams.get('v') || u.searchParams.get('story_fbid');
      if (vMatch) return vMatch;
      const pathParts = u.pathname.split('/').filter(Boolean);
      return pathParts[pathParts.length - 1] || null;
    }
  } catch (_) {}
  return null;
}

/**
 * Effectue un GET HTTP/HTTPS simple avec timeout
 */
function httpGetJson(url, timeoutMs = 7000) {
  return new Promise((resolve, reject) => {
    try {
      const client = url.startsWith('https') ? https : http;
      const req = client.get(url, { headers: { 'User-Agent': 'Nopalou-SocialShop/1.0' } }, (res) => {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          try {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(JSON.parse(data));
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });
      req.on('error', err => resolve(null));
      req.setTimeout(timeoutMs, () => { req.destroy(); resolve(null); });
    } catch (e) {
      resolve(null);
    }
  });
}

/**
 * Récupère les métadonnées officielles via l'endpoint oEmbed officiel de la plateforme
 */
async function fetchOEmbedMetadata(url, platform) {
  const result = {
    platform,
    postUrl: url,
    externalPostId: extractExternalPostId(url, platform),
    title: '',
    caption: '',
    author: '',
    thumbnailUrl: null,
    embedHtml: null,
    mediaType: 'VIDEO',
  };

  if (platform === 'tiktok') {
    result.mediaType = 'TIKTOK_VIDEO';
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const data = await httpGetJson(oembedUrl);
    if (data) {
      result.title = data.title || '';
      result.caption = data.title || '';
      result.author = data.author_name ? `@${data.author_unique_id || data.author_name}` : '';
      result.thumbnailUrl = data.thumbnail_url || null;
      result.embedHtml = data.html || null;
    } else {
      // Fallback embed officiel TikTok
      result.embedHtml = `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${result.externalPostId || ''}"><section><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a></section></blockquote><script async src="https://www.tiktok.com/embed.js"></script>`;
    }
  } else if (platform === 'instagram') {
    const isReel = /\/reel\//i.test(url);
    result.mediaType = isReel ? 'REEL' : 'POST';
    const postId = result.externalPostId;

    if (postId) {
      result.thumbnailUrl = `https://instagram.com/p/${postId}/media/?size=l`;
      result.embedHtml = `<iframe src="https://www.instagram.com/p/${postId}/embed/captioned/" width="100%" height="480" frameborder="0" scrolling="no" allowtransparency="true" allow="encrypted-media" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>`;
    }
  } else if (platform === 'facebook') {
    result.mediaType = 'POST';
    result.embedHtml = `<div class="fb-post" data-href="${url}" data-width="100%"></div>`;
  } else if (platform === 'youtube') {
    result.mediaType = 'VIDEO';
    let videoId = null;
    try {
      const u = new URL(url);
      if (u.pathname.includes('/shorts/')) {
        videoId = u.pathname.split('/shorts/')[1]?.split('?')[0];
      } else if (u.searchParams.get('v')) {
        videoId = u.searchParams.get('v');
      } else if (u.hostname === 'youtu.be') {
        videoId = u.pathname.slice(1);
      }
    } catch (_) {}

    if (videoId) {
      result.externalPostId = videoId;
      result.thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      result.embedHtml = `<iframe width="100%" height="450" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius:12px;"></iframe>`;
    }
  }

  return result;
}

/**
 * Stop words français / wolof fréquents dans le e-commerce social
 */
const STOP_WORDS = new Set([
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'd', 'en', 'a', 'au', 'aux',
  'et', 'ou', 'pour', 'dans', 'sur', 'par', 'avec', 'sans', 'sous', 'ce', 'cet',
  'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta', 'tes', 'son', 'sa', 'ses',
  'notre', 'nos', 'votre', 'vos', 'leur', 'leurs', 'qui', 'que', 'quoi', 'dont',
  'est', 'sont', 'disponible', 'disponibles', 'promo', 'promotion', 'solde', 'soldes',
  'prix', 'fcfa', 'cfa', 'dakar', 'senegal', 'sn', 'boutique', 'arrivage', 'nouveau',
  'nouvelle', 'collection', 'nouveaute', 'nouveautes', 'whatsapp', 'commande', 'commander',
  'qualite', 'top', 'meilleur', 'livraison', 'partout', 'contact', 'contactez', 'cliquez',
  'lien', 'bio', 'tel', 'telephone', 'numero', 'mode', 'look', 'style'
]);

/**
 * Moteur de Smart Matching :
 * Compare la légende sociale (`caption`) avec les noms, descriptions et catégories des produits
 * Retourne une liste ordonnée par score de pertinence (0.00 à 1.00)
 */
function matchProductsWithCaption(caption, products = []) {
  if (!caption || !products || products.length === 0) return [];

  const normCaption = normalizeText(caption);
  if (!normCaption) return [];

  const captionWords = normCaption.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
  if (captionWords.length === 0) return [];

  const matches = [];

  for (const p of products) {
    const normNom = normalizeText(p.nom || '');
    const normDesc = normalizeText(p.description || '');
    const normCat = normalizeText(p.categorie || '');

    let score = 0;

    // 1. Correspondance exacte du nom complet dans la légende (Score très élevé)
    if (normNom.length > 3 && normCaption.includes(normNom)) {
      score += 0.85;
    } else {
      // 2. Correspondance par mots clés du nom du produit
      const nomWords = normNom.split(' ').filter(w => w.length > 2 && !STOP_WORDS.has(w));
      let matchCount = 0;
      for (const w of nomWords) {
        if (normCaption.includes(w)) {
          matchCount++;
        }
      }
      if (nomWords.length > 0) {
        const ratio = matchCount / nomWords.length;
        score += ratio * 0.60;
      }
    }

    // 3. Correspondance de la catégorie
    if (normCat && normCat.length > 2 && normCaption.includes(normCat)) {
      score += 0.15;
    }

    // 4. Bonus si un mot rare de la description apparaît
    if (normDesc) {
      const descWords = normDesc.split(' ').filter(w => w.length > 4 && !STOP_WORDS.has(w)).slice(0, 5);
      for (const w of descWords) {
        if (normCaption.includes(w)) {
          score += 0.05;
          break;
        }
      }
    }

    const finalScore = Math.min(1.0, Math.round(score * 100) / 100);

    // Seuil de pertinence minimum
    if (finalScore >= 0.35) {
      matches.push({
        produit: p,
        confidence_score: finalScore,
        suggested: true,
      });
    }
  }

  // Tri décroissant par score de confiance
  return matches.sort((a, b) => b.confidence_score - a.confidence_score);
}

module.exports = {
  detectPlatform,
  extractExternalPostId,
  fetchOEmbedMetadata,
  matchProductsWithCaption,
  normalizeText,
};
