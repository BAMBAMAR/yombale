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
      const embedType = isReel ? 'reel' : 'p';
      result.thumbnailUrl = `https://www.instagram.com/p/${postId}/media/?size=l`;
      result.embedHtml = `<iframe src="https://www.instagram.com/${embedType}/${postId}/embed/" width="100%" height="480" frameborder="0" scrolling="no" allowtransparency="true" allow="encrypted-media" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>`;
    }
  } else if (platform === 'facebook') {
    const isVideoOrReel = /\/(reel|videos|watch)/i.test(url);
    const isPage = !isVideoOrReel && !/\/(posts|photos|story\.php|permalink\.php)/i.test(url);
    result.mediaType = isVideoOrReel ? 'REEL' : 'POST';

    let fbPluginUrl = '';
    if (isVideoOrReel) {
      fbPluginUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`;
    } else if (isPage) {
      fbPluginUrl = `https://www.facebook.com/plugins/page.php?href=${encodeURIComponent(url)}&tabs=timeline&width=380&height=500&small_header=false&adapt_container_width=true&hide_cover=false&show_facepile=true&appId=`;
    } else {
      fbPluginUrl = `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&width=380&show_text=true&appId=`;
    }

    result.embedHtml = `<iframe src="${fbPluginUrl}" width="100%" height="480" style="border:none;overflow:hidden;border-radius:12px;background:#ffffff;" scrolling="no" frameborder="0" allowfullscreen="true" allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"></iframe>`;
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

/**
 * Nettoie et normalise un nom d'utilisateur ou URL de profil
 */
function cleanUsername(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') return '';
  let u = rawInput.trim();
  // Si URL de profil passée, extraire le pseudo
  try {
    if (u.startsWith('http://') || u.startsWith('https://')) {
      const parsed = new URL(u);
      const parts = parsed.pathname.split('/').filter(Boolean);
      u = parts[0] || '';
    }
  } catch (_) {}
  return u.replace(/^@+/, '').replace(/\/+$/, '').trim();
}

/**
 * Découpe et extrait une liste propre d'URLs à partir d'un texte multi-lignes ou d'un tableau
 */
function parseBatchUrls(rawInput) {
  if (!rawInput) return [];
  let rawUrls = [];
  if (Array.isArray(rawInput)) {
    rawUrls = rawInput;
  } else if (typeof rawInput === 'string') {
    rawUrls = rawInput.split(/[\r\n,; \t]+/).filter(Boolean);
  }

  const validPosts = [];
  const seen = new Set();

  for (const raw of rawUrls) {
    const trimmed = (raw || '').trim();
    if (!trimmed || !trimmed.startsWith('http')) continue;
    if (seen.has(trimmed)) continue;

    const platform = detectPlatform(trimmed);
    if (platform) {
      seen.add(trimmed);
      validPosts.push({
        url: trimmed,
        platform,
        externalPostId: extractExternalPostId(trimmed, platform),
      });
    }
  }

  return validPosts;
}

let cachedMetaToken = null;
let lastMetaTokenFetch = 0;

/**
 * Récupère le token Meta actif (priorité à la table settings en DB, sinon process.env)
 */
async function getLiveMetaToken() {
  if (process.env.NODE_ENV === 'test') {
    return process.env.FB_PAGE_ACCESS_TOKEN || null;
  }
  const now = Date.now();
  if (cachedMetaToken && now - lastMetaTokenFetch < 60000) {
    return cachedMetaToken;
  }
  try {
    const { pool } = require('../models/db');
    if (pool) {
      const { rows } = await pool.query(`SELECT value FROM settings WHERE key='fb_page_access_token'`);
      if (rows.length && rows[0].value) {
        cachedMetaToken = rows[0].value;
        lastMetaTokenFetch = now;
        return cachedMetaToken;
      }
    }
  } catch (_) {}
  return process.env.FB_PAGE_ACCESS_TOKEN || null;
}

/**
 * Normalise et nettoie une URL de réseau social pour stockage en base.
 * Élimine les doubles préfixes, paramètres de tracking temporaires, espaces.
 * Exemples valides en sortie :
 *   'https://instagram.com/dieteltouba'
 *   'https://www.tiktok.com/@maboutique'
 *   'https://www.facebook.com/maboutique'
 *   '@maboutique' → conservé tel quel si pas d'URL
 */
function normalizeSocialUrl(rawInput, platform) {
  if (!rawInput || typeof rawInput !== 'string') return null;
  let u = rawInput.trim();
  if (!u) return null;

  // Cas où l'utilisateur colle une URL dans un champ URL :
  // Supprimer les doubles préfixes du type https://instagram.com/https://www.instagram.com/...
  const doubleUrlMatch = u.match(/https?:\/\/[^/]+\/(?:https?:\/\/(.+))/);
  if (doubleUrlMatch) {
    u = 'https://' + doubleUrlMatch[1];
  }

  // Si c'est juste un @pseudo ou un pseudo sans préfixe, construire l'URL canonique
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    const pseudo = u.replace(/^@+/, '').trim();
    if (!pseudo) return null;
    switch ((platform || '').toLowerCase()) {
      case 'instagram': return `https://www.instagram.com/${pseudo}`;
      case 'tiktok':    return `https://www.tiktok.com/@${pseudo}`;
      case 'facebook':  return `https://www.facebook.com/${pseudo}`;
      case 'youtube':   return `https://www.youtube.com/@${pseudo}`;
      case 'twitter': case 'x': return `https://x.com/${pseudo}`;
      default:          return `@${pseudo}`;
    }
  }

  // Nettoyer les paramètres de tracking temporaires (?_r=1&_t=ZS-...) pour TikTok
  try {
    const parsed = new URL(u);
    // Supprimer les params de tracking TikTok (_r, _t)
    ['_r', '_t', 'igsh', 'igshid', 'fbclid'].forEach(p => parsed.searchParams.delete(p));
    u = parsed.toString();
  } catch (_) {}

  return u;
}

/**
 * Explore un profil social public (@username) pour récupérer ses publications récentes.
 *
 * SÉCURITÉ MULTI-TENANT : Cette fonction est appelée dans le contexte d'une boutique
 * marchande spécifique. Elle ne doit JAMAIS utiliser les credentials Meta de Nopalou
 * (IG_USER_ID, FB_PAGE_ID) car cela retournerait les posts officiels de Nopalou au
 * lieu des posts du marchand.
 * → Mode exclusif : oEmbed public + iframe placeholders de profil.
 * L'API Graph officielle n'est utilisée que si le marchand a lui-même fourni son
 * propre token OAuth via social_accounts.access_token (fonctionnalité future).
 */
async function exploreProfile(platform, rawUser) {
  const username = cleanUsername(rawUser);
  if (!username) {
    return { success: false, error: 'Nom d\'utilisateur invalide', posts: [] };
  }

  const posts = [];

  try {
    if (platform === 'instagram') {
      // Sécurité : NE PAS utiliser process.env.IG_USER_ID ni getLiveMetaToken() ici.
      // Ces credentials appartiennent au compte Nopalou et non au marchand.
      // → Exploration publique uniquement via iframe embed placeholder.
      const profileUrl = `https://www.instagram.com/${username}/`;

      posts.push({
        externalPostId: `ig_${username}_latest_1`,
        url: profileUrl,
        platform: 'instagram',
        mediaType: 'REEL',
        thumbnailUrl: null,
        caption: `Dernières publications de @${username}`,
        author: `@${username}`,
        isProfilePlaceholder: true,
      });

      return { success: true, platform: 'instagram', username, posts, source: 'web_discovery' };
    }

    if (platform === 'tiktok') {
      // TikTok oEmbed public — pas de token requis, isolation garantie.
      const profileUrl = `https://www.tiktok.com/@${username}`;
      const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(profileUrl)}`;
      const data = await httpGetJson(oembedUrl, 6000);

      if (data) {
        posts.push({
          externalPostId: `tiktok_${username}_profile`,
          url: profileUrl,
          platform: 'tiktok',
          mediaType: 'TIKTOK_VIDEO',
          thumbnailUrl: data.thumbnail_url || null,
          caption: data.title || `Vidéos de @${username}`,
          author: data.author_name ? `@${data.author_name}` : `@${username}`,
          source: 'oembed',
        });
      } else {
        // Fallback sans oEmbed
        posts.push({
          externalPostId: `tiktok_${username}_profile`,
          url: profileUrl,
          platform: 'tiktok',
          mediaType: 'TIKTOK_VIDEO',
          thumbnailUrl: null,
          caption: `Vidéos de @${username}`,
          author: `@${username}`,
          isProfilePlaceholder: true,
        });
      }

      return { success: true, platform: 'tiktok', username, posts, source: 'tiktok_discovery' };
    }

    if (platform === 'facebook') {
      // Sécurité : NE PAS utiliser le token FB global (getLiveMetaToken) ni FB_PAGE_ID.
      // Cela retournerait les posts de la page officielle Nopalou, pas ceux du marchand.
      // → Fallback iframe Plugin Facebook public uniquement.
      const pageUrl = `https://www.facebook.com/${username}`;
      posts.push({
        externalPostId: `fb_${username}_page`,
        url: pageUrl,
        platform: 'facebook',
        mediaType: 'POST',
        thumbnailUrl: null,
        caption: `Publications de la page ${username}`,
        author: username,
        isProfilePlaceholder: true,
      });
      return { success: true, platform: 'facebook', username, posts, source: 'facebook_discovery' };
    }

    if (platform === 'youtube') {
      const channelUrl = `https://www.youtube.com/@${username}`;
      posts.push({
        externalPostId: `yt_${username}_channel`,
        url: channelUrl,
        platform: 'youtube',
        mediaType: 'VIDEO',
        thumbnailUrl: null,
        caption: `Chaîne YouTube de @${username}`,
        author: `@${username}`,
        isProfilePlaceholder: true,
      });
      return { success: true, platform: 'youtube', username, posts, source: 'youtube_discovery' };
    }

    return { success: false, error: 'Plateforme non supportée pour l\'exploration', posts: [] };
  } catch (err) {
    console.error('[EXPLORE_PROFILE_ERR]', err);
    return { success: false, error: err.message, posts: [] };
  }
}

module.exports = {
  detectPlatform,
  extractExternalPostId,
  fetchOEmbedMetadata,
  matchProductsWithCaption,
  normalizeText,
  cleanUsername,
  parseBatchUrls,
  exploreProfile,
  normalizeSocialUrl,
};

