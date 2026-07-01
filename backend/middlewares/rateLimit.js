const rateLimit = require('express-rate-limit');

// Derrière Cloudflare, req.ip est une IP CDN partagée.
// CF-Connecting-IP contient la vraie IP du client.
function realIp(req) {
  return (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()
}

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  keyGenerator: realIp,
  message: { error: 'Trop de requêtes — réessayez dans 15 min' },
  standardHeaders: true
});

// Bloque les user-agents de scripts nus connus (bots, scrapers)
// Ne bloque PAS les UAs vides : le serveur Next.js (SSR) utilise Node.js fetch sans UA
function blockScraperUA(req, res, next) {
  const ua = (req.headers['user-agent'] || '').toLowerCase().trim()
  if (!ua) return next() // appels SSR légitimes (Next.js server) sans UA → laisser passer
  const blocked = ['python-requests', 'python-httpx', 'go-http-client', 'java/', 'okhttp']
  // "node" exact ou "node/xx.x" → bot, mais pas "node-fetch" (bibliothèque courante légitime)
  const isNodeBot = ua === 'node' || /^node\/\d/.test(ua)
  if (isNodeBot || blocked.some(b => ua === b || ua.startsWith(b))) {
    return res.status(429).json({ error: 'Accès automatisé non autorisé' })
  }
  next()
}

const limiterImmo = rateLimit({
  windowMs: 60 * 1000, max: 60,
  keyGenerator: realIp,
  message: { error: 'Trop de recherches immo — attendez 1 minute' },
  standardHeaders: true,
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  keyGenerator: realIp,
  message: { error: 'Trop de tentatives de connexion' }
});

const limiterRecherche = rateLimit({
  windowMs: 60 * 1000, max: 60,
  keyGenerator: realIp,
  message: { error: 'Trop de recherches — attendez 1 minute' }
});

const limiterPublication = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyGenerator: realIp,
  message: { error: 'Trop d\'annonces publiées — réessayez dans 1 heure' }
});

const limiterEcriture = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  keyGenerator: realIp,
  message: { error: 'Trop de requêtes — réessayez dans quelques minutes' }
});

// Limite les accès bulk (listes produits/immo/annonces) pour freiner le scraping
// Exclut les IPs internes (serveur Next.js → Express en SSR) et les utilisateurs authentifiés
const INTERNAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const limiterBulk = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  keyGenerator: realIp,
  message: { error: 'Trop de requêtes — créez un compte gratuit pour un accès illimité' },
  standardHeaders: true,
  skip: (req) => !!(req.user) || INTERNAL_IPS.has(realIp(req)),
});

module.exports = { limiterGeneral, limiterAuth, limiterRecherche, limiterPublication, limiterEcriture, limiterImmo, limiterBulk, blockScraperUA };