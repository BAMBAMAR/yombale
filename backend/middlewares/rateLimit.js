const rateLimit = require('express-rate-limit');

const net = require('net');

// Derrière reverse proxy / Cloudflare, sécurise l'identification de l'IP
// SÉCURITÉ P1 : Prioriser req.ip (géré par Express sous trust proxy:1) qui est validé
// par le reverse proxy de confiance. Ne pas accorder confiance à CF-Connecting-IP
// en premier car il peut être forgé par n'importe quel client direct.
function realIp(req) {
  // 1. req.ip fourni par Express sous trust proxy : 1 (l'IP du vrai client selon le reverse proxy)
  if (req.ip && net.isIP(req.ip)) {
    return req.ip;
  }
  // 2. Fallback : CF-Connecting-IP uniquement si req.ip n'est pas disponible
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp && typeof cfIp === 'string') {
    const clean = cfIp.split(',')[0].trim();
    if (net.isIP(clean)) return clean;
  }
  // 3. Fallback X-Forwarded-For nettoyé
  const xff = req.headers['x-forwarded-for'];
  if (xff && typeof xff === 'string') {
    const clean = xff.split(',')[0].trim();
    if (net.isIP(clean)) return clean;
  }
  return req.socket?.remoteAddress || '127.0.0.1';
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
// AUD-138 : l'User-Agent est un SIGNAL, plus un refus. Un scraper change d'User-Agent en une ligne (et un client
// d'API partenaire légitime en Python ou en curl ne doit pas être bloqué). Un client « nu » (script, sans navigateur)
// reçoit simplement un budget de lignes réduit ; l'accès reste possible. BOT_UA_BLOCK=true rétablit l'ancien refus (429).
const UA_AUTOMATE = /^(python-requests|python-httpx|python-urllib|go-http-client|java\/|okhttp|curl\/|wget\/|scrapy|aiohttp|httpx|libwww-perl|httrack|node(\/\d.*)?$)/i;
function signalerAutomate(req, res, next) {
  req.botSignal = false;
  if (isSsrRequest(req)) return next();
  const ip = realIp(req);
  if (INTERNAL_IPS.has(ip) || isPrivateIp(ip)) return next();
  const ua = String(req.headers['user-agent'] || '').trim();
  req.botSignal = !ua || UA_AUTOMATE.test(ua);
  if (req.botSignal && process.env.BOT_UA_BLOCK === 'true' && process.env.NODE_ENV === 'production') {
    return res.status(429).json({ error: 'Accès automatisé non autorisé' });
  }
  next();
}
const blockScraperUA = signalerAutomate; // nom conservé : les routes l'utilisent déjà dans leur chaîne

const skipInDevOrSsr = (req) => process.env.NODE_ENV !== 'production' || isSsrRequest(req);

const limiterImmo = rateLimit({
  windowMs: 60 * 1000, max: 60,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de recherches immo — attendez 1 minute' },
  standardHeaders: true,
});

const limiterAuth = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de tentatives de connexion' }
});

const limiterRecherche = rateLimit({
  windowMs: 60 * 1000, max: 60,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de recherches — attendez 1 minute' }
});

const limiterPublication = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop d\'annonces publiées — réessayez dans 1 heure' }
});

const limiterEcriture = rateLimit({
  windowMs: 15 * 60 * 1000, max: 15,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de requêtes — réessayez dans quelques minutes' }
});

const limiterImport = rateLimit({
  windowMs: 5 * 60 * 1000, max: 25,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de demandes d\'import rapide — réessayez dans 5 minutes' }
});

// AUD-010 : checkout public — freine la création en rafale de commandes qui immobilisent le stock
const limiterCommandeExpress = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  keyGenerator: realIp,
  skip: skipInDevOrSsr,
  message: { error: 'Trop de commandes depuis cette connexion — réessayez dans quelques minutes' },
  standardHeaders: true,
});

// AUD-027 : envoi de fiches WhatsApp — limite par compte (pas par IP), active aussi hors production
const limiterWhatsappSend = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyGenerator: (req) => `wa-send:${req.user?.userId || realIp(req)}`,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Trop d’envois WhatsApp — réessayez dans 1 heure' },
  standardHeaders: true,
});

// AUD-132 : codes OTP du portail locataire — actifs aussi hors production (un message WhatsApp part à chaque
// demande : pas de spam vers des tiers, pas de recherche exhaustive de numéros). Désactivés seulement en test.
const skipTestOtp = () => process.env.NODE_ENV === 'test' && !process.env.FORCE_RATE_LIMITS;
const chiffresTel = (req) => String((req.body && req.body.tel) || '').replace(/\D/g, '').slice(-9);

const limiterOtpLocataireIp = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  keyGenerator: (req) => `otp-loc-ip:${realIp(req)}`,
  skip: skipTestOtp,
  message: { success: false, error: 'Trop de demandes de code — réessayez dans 1 heure.' },
  standardHeaders: true,
});

const limiterOtpLocataireNumero = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5,
  keyGenerator: (req) => `otp-loc-tel:${chiffresTel(req) || realIp(req)}`,
  skip: skipTestOtp,
  message: { success: false, error: 'Trop de demandes de code pour ce numéro — réessayez dans 1 heure.' },
  standardHeaders: true,
});

const limiterVerifOtpLocataire = rateLimit({
  windowMs: 60 * 60 * 1000, max: 30,
  keyGenerator: (req) => `otp-loc-verif:${realIp(req)}`,
  skip: skipTestOtp,
  message: { success: false, error: 'Trop de tentatives — réessayez dans 1 heure.' },
  standardHeaders: true,
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

// AUD-135 : budget de LIGNES servies (et non de requêtes). Un moissonneur qui demande des pages de 50 lignes ou
// des listes entières consomme le même budget : 600 lignes / 15 min pour un anonyme, 3 000 pour un compte.
// Un visiteur humain (quelques dizaines de fiches) n'approche jamais ces seuils. Exemptés : rendu serveur du site
// (X-SSR-Token) et réseau interne. Compteur en mémoire du processus (un seul processus web sur Render).
const FENETRE_BUDGET_MS = 15 * 60 * 1000;
const budgets = new Map();
setInterval(() => {
  const limite = Date.now() - FENETRE_BUDGET_MS;
  for (const [cle, b] of budgets) if (b.debut < limite) budgets.delete(cle);
}, 5 * 60 * 1000).unref();

const CLES_LISTES = ['annonces', 'produits', 'boutiques', 'forfaits', 'agences', 'offres', 'biens'];
function compterLignes(corps) {
  if (Array.isArray(corps)) return corps.length;
  if (!corps || typeof corps !== 'object') return 0;
  return CLES_LISTES.reduce((n, k) => n + (Array.isArray(corps[k]) ? corps[k].length : 0), 0);
}

function limiterBudget(req, res, next) {
  if (process.env.NODE_ENV !== 'production' && !process.env.FORCE_RATE_LIMITS) return next();
  if (isSsrRequest(req)) return next();
  const ip = realIp(req);
  if (INTERNAL_IPS.has(ip) || isPrivateIp(ip)) return next();

  const base = req.user
    ? parseInt(process.env.SCRAPE_BUDGET_USER, 10) || 3000
    : parseInt(process.env.SCRAPE_BUDGET_ANON, 10) || 600;
  // un client automate sans compte a un budget divisé par 4 (AUD-138)
  const max = req.botSignal && !req.user ? Math.max(1, Math.floor(base / 4)) : base;
  const cle = req.user ? `u:${req.user.userId || req.user.id}` : `ip:${ip}`;
  const now = Date.now();
  let b = budgets.get(cle);
  if (!b || now - b.debut > FENETRE_BUDGET_MS) {
    b = { debut: now, lignes: 0 };
    budgets.set(cle, b);
  }
  if (b.lignes >= max) {
    if (!b.signale) { b.signale = true; console.warn('[BUDGET] ' + cle + ' a atteint ' + max + ' lignes en 15 min (' + req.method + ' ' + req.baseUrl + ')'); }
    // SCRAPE_BUDGET_ENFORCE=false : journalise sans refuser (utile pour valider l'IP vue par le backend avant d'appliquer)
    if (process.env.SCRAPE_BUDGET_ENFORCE === 'false') return next();
    res.set('Retry-After', String(Math.ceil((b.debut + FENETRE_BUDGET_MS - now) / 1000)));
    return res.status(429).json({ error: 'Volume de données demandé trop élevé — réessayez dans quelques minutes.' });
  }
  const envoyer = res.json.bind(res);
  res.json = (corps) => {
    b.lignes += compterLignes(corps);
    return envoyer(corps);
  };
  next();
}

// AUD-137 : révélation d'un numéro de particulier. 10 par heure et par IP, 40 par jour et par compte connecté.
// Actifs aussi hors production (désactivés seulement en test sans FORCE_RATE_LIMITS).
const limiterRevelationIp = rateLimit({
  windowMs: 60 * 60 * 1000, max: 10,
  keyGenerator: (req) => `rev-ip:${realIp(req)}`,
  skip: skipTestOtp,
  message: { success: false, error: 'Trop de numéros consultés — réessayez dans 1 heure ou contactez-nous par WhatsApp.' },
  standardHeaders: true,
});
const limiterRevelationCompte = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, max: 40,
  keyGenerator: (req) => `rev-user:${req.user && (req.user.userId || req.user.id)}`,
  skip: (req) => skipTestOtp() || !req.user,
  message: { success: false, error: 'Limite quotidienne de numéros consultés atteinte.' },
  standardHeaders: true,
});
const limiterRevelation = [limiterRevelationIp, limiterRevelationCompte];

module.exports = { signalerAutomate, limiterRevelation, isSsrRequest, limiterBudget, limiterGeneral, limiterAuth, limiterRecherche, limiterPublication, limiterEcriture, limiterImport, limiterImmo, limiterBulk, limiterWhatsappSend, limiterCommandeExpress, blockScraperUA, limiterOtpLocataireIp, limiterOtpLocataireNumero, limiterVerifOtpLocataire };