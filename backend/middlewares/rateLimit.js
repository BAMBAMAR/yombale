const rateLimit = require('express-rate-limit');

const limiterGeneral = rateLimit({
  windowMs: 15 * 60 * 1000, max: 100,
  message: { error: 'Trop de requêtes — réessayez dans 15 min' },
  standardHeaders: true
});

// Bloque les user-agents de scripts nus (node, python-requests, curl sans referer, etc.)
function blockScraperUA(req, res, next) {
  const ua = (req.headers['user-agent'] || '').toLowerCase().trim()
  const blocked = ['node', 'python-requests', 'python-httpx', 'go-http-client', 'java/', 'okhttp', 'axios/']
  if (!ua || blocked.some(b => ua === b || ua.startsWith(b))) {
    return res.status(429).json({ error: 'Accès automatisé non autorisé' })
  }
  next()
}

const limiterImmo = rateLimit({
  windowMs: 60 * 1000, max: 20,
  message: { error: 'Trop de recherches immo — attendez 1 minute' },
  standardHeaders: true,
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { error: 'Trop de tentatives de connexion' }
});

const limiterRecherche = rateLimit({
  windowMs: 60 * 1000, max: 60,
  message: { error: 'Trop de recherches — attendez 1 minute' }
});

const limiterPublication = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  message: { error: 'Trop d\'annonces publiées — réessayez dans 1 heure' }
});

const limiterEcriture = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  message: { error: 'Trop de requêtes — réessayez dans quelques minutes' }
});

// Limite les accès bulk (listes produits/immo/annonces) pour freiner le scraping
// Exclut les IPs internes (serveur Next.js → Express en SSR) et les utilisateurs authentifiés
const INTERNAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1'])
const limiterBulk = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  message: { error: 'Trop de requêtes — créez un compte gratuit pour un accès illimité' },
  standardHeaders: true,
  skip: (req) => !!(req.user) || INTERNAL_IPS.has(req.ip || ''),
});

module.exports = { limiterGeneral, limiterAuth, limiterRecherche, limiterPublication, limiterEcriture, limiterImmo, limiterBulk, blockScraperUA };