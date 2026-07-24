const rateLimit = require('express-rate-limit');

// Derrière Cloudflare, req.ip est une IP CDN partagée.
// CF-Connecting-IP contient la vraie IP du client.
function realIp(req) {
  return (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip || '').split(',')[0].trim()
}

// Vérifie si la requête vient du serveur Next.js SSR (header secret partagé)
const SSR_SECRET = process.env.SSR_SECRET || ''
function isSsrRequest(req) {
  return SSR_SECRET && req.headers['x-ssr-token'] === SSR_SECRET
}

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  keyGenerator: realIp,
  message: { error: 'Trop de requêtes — réessayez dans 15 min' },
  standardHeaders: true,
  skip: (req) => process.env.NODE_ENV !== 'production' || isSsrRequest(req),
});

// Bloque les user-agents de scripts nus connus (bots, scrapers)
// Laisse passer les requêtes SSR Next.js identifiées par X-SSR-Token
function blockScraperUA(req, res, next) {
  if (process.env.NODE_ENV !== 'production') return next()
  if (isSsrRequest(req)) return next()
  const ip = realIp(req)
  if (INTERNAL_IPS.has(ip) || isPrivateIp(ip)) return next()
  const ua = (req.headers['user-agent'] || '').toLowerCase().trim()
  const blocked = ['python-requests', 'python-httpx', 'go-http-client', 'java/', 'okhttp']
  const isNodeBot = !ua || ua === 'node' || /^node\/\d/.test(ua)
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
function isPrivateIp(ip) {
  return /^(127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::1$|::ffff:127\.)/.test(ip)
}
const limiterBulk = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  keyGenerator: realIp,
  message: { error: 'Trop de requêtes — créez un compte gratuit pour un accès illimité' },
  standardHeaders: true,
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true
    if (req.user) return true
    if (isSsrRequest(req)) return true
    const ip = realIp(req)
    if (INTERNAL_IPS.has(ip) || isPrivateIp(ip)) return true
    return false
  },
});

module.exports = { limiterGeneral, limiterAuth, limiterRecherche, limiterPublication, limiterEcriture, limiterImmo, limiterBulk, blockScraperUA };