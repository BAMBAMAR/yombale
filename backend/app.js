// Polyfill global File pour Node.js < 20 (requis par undici)
if (typeof globalThis.File === 'undefined') {
  const { Blob } = require('buffer');
  globalThis.File = class File extends Blob {
    constructor(fileBits, fileName, options = {}) {
      super(fileBits, options);
      this.name = fileName;
      this.lastModified = options.lastModified ?? Date.now();
    }
  };
}

const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const path        = require('path');
const rateLimit   = require('express-rate-limit');
require('dotenv').config();

// ── Gestion globale des erreurs inattendues (Évite la mort du process Node) ──
process.on('uncaughtException', (err) => {
  console.error('💥 [CRITICAL UNCAUGHT EXCEPTION]:', err.stack || err.message);
});

process.on('unhandledRejection', (reason) => {
  console.error('💥 [UNHANDLED REJECTION]:', reason);
});

// ── Sentry (monitoring, free tier) ──────────────────────────────
let Sentry;
try {
  Sentry = require('@sentry/node');
  if (process.env.SENTRY_DSN) {
    // v8+ : les intégrations http/express/uncaught sont automatiques
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: 0.1, // 10% des requêtes
    });
  } else {
    Sentry = null;
  }
} catch (err) {
  console.log('[SENTRY] Non disponible (npm install @sentry/node pour activer)');
  Sentry = null;
}

const app = express();
app.set('trust proxy', 1);

// ── Validation des variables d'env critiques ──────────────────
const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length) {
  console.error(`❌ Variables d'environnement manquantes : ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// ── Middlewares globaux ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc:    ["'self'", "https:", "wss:"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      styleSrcElem:  ["'self'", "'unsafe-inline'"],
      fontSrc:       ["'self'", "data:"],
      imgSrc:        ["'self'", "data:", "https:"],

      objectSrc:     ["'none'"],
      frameAncestors:["'self'"],
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  // Accepte aussi automatiquement la variante avec/sans "www" du domaine
  process.env.FRONTEND_URL && process.env.FRONTEND_URL.includes('://www.')
    ? process.env.FRONTEND_URL.replace('://www.', '://')
    : process.env.FRONTEND_URL
      ? process.env.FRONTEND_URL.replace('://', '://www.')
      : null,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
  process.env.RENDER_EXTERNAL_URL || null,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:3001', 'http://localhost:3008'] : []),
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS non autorisé pour : ' + origin));
  },
  credentials: true,
}));
app.use(compression());

// ── Protection Anti-Scraping & Filtrage des User-Agents de Bots ─
const BAD_USER_AGENTS = /scrapy|python-requests|go-http-client|java\/|libwww-perl|wget\/|httrack|aiohttp|httpx|curl\//i;

const botBlockerMiddleware = (req, res, next) => {
  if (req.path.includes('/webhook')) return next();
  const ua = req.headers['user-agent'] || '';
  if (BAD_USER_AGENTS.test(ua)) {
    return res.status(403).json({ error: 'Accès refusé : requête automatisée détectée (Anti-Scraping Nopalou)' });
  }
  next();
};

app.use('/api/', botBlockerMiddleware);

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return (
      req.path.includes('/scanner-remote') ||
      req.path.includes('/health') ||
      req.path.includes('/analytics') ||
      req.path.includes('/webhook')
    );
  },
  message: { error: 'Trop de requêtes, veuillez réessayer dans 15 minutes.' },
});

const searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Limite de recherche atteinte, veuillez patienter quelques minutes.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, veuillez réessayer dans 15 minutes.' },
});

app.use('/api/', apiLimiter);
app.use('/api/search', searchLimiter);
app.use('/api/annonces/publiques', searchLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/paiement/', (req, res, next) => {
  if (req.path.includes('/webhook')) return next();
  return authLimiter(req, res, next);
});

// Sentry v8+ : l'instrumentation des requêtes est automatique (pas de middleware requis)

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => { req.rawBody = buf; },
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Protection pages admin ────────────────────────────────────
// Doit être AVANT express.static pour intercepter les routes
function getAdminCookie(req) {
  const raw = req.headers.cookie || '';
  const match = raw.match(/(?:^|;\s*)nopalou_admin=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function adminPageGuard(req, res, next) {
  const { secretsMatch } = require('./middlewares/auth');
  const cookieSecret = getAdminCookie(req);
  const headerSecret = req.headers['x-admin-secret'];
  const secret = cookieSecret || headerSecret;
  if (process.env.ADMIN_SECRET && !secretsMatch(secret, process.env.ADMIN_SECRET)) {
    const page = req.path.replace('/', '');
    return res.status(401).send(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Accès refusé</title>' +
      '<style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#f4f5f7;margin:0;}' +
      '.box{background:#fff;border-radius:10px;padding:32px 40px;box-shadow:0 2px 8px rgba(0,0,0,.1);text-align:center;}' +
      'h2{color:#e63946;margin-top:0}input{padding:8px 36px 8px 12px;border:1px solid #d8dadf;border-radius:6px;font-size:14px;width:100%;box-sizing:border-box;}' +
      'button.btn-go{padding:10px 24px;background:#ff6600;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;margin-top:12px;}</style></head>' +
      '<body><div class="box"><h2>🔒 Accès admin requis</h2>' +
      '<p style="color:#64748b;margin-bottom:16px">Entrez le secret admin pour accéder à cette page.</p>' +
      '<div style="position:relative;display:inline-block;width:260px;">' +
      '<input type="password" id="s" placeholder="Secret admin" autofocus onkeydown="if(event.key===\'Enter\')go()">' +
      '<button type="button" onclick="var i=document.getElementById(\'s\');if(i.type===\'password\'){i.type=\'text\';this.textContent=\'🙈\';}else{i.type=\'password\';this.textContent=\'👁️\';}" style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;font-size:16px;padding:0;">👁️</button>' +
      '</div>' +
      '<br><button class="btn-go" onclick="go()">Accéder →</button>' +
      '<p id="err" style="color:#e63946;font-size:13px;min-height:18px"></p>' +
      '<script>async function go(){var s=document.getElementById("s").value;' +
      'var r=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:s}),credentials:"include"});' +
      'if(r.ok){location.href="/' + page + '";}else{document.getElementById("err").textContent="Secret invalide";}}<\/script>' +
      '</div></body></html>'
    );
  }
  next();
}

app.get('/admin-telecom.html', adminPageGuard);
app.get('/admin-immo.html',    adminPageGuard);
app.get('/admin-partenaires.html', adminPageGuard);
app.get('/admin-annonces.html', adminPageGuard);
app.get('/admin.html', adminPageGuard);


// ── Fichiers statiques frontend ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Login admin — cookie httpOnly (8h) ───────────────────────
app.post('/api/admin/login', (req, res) => {
  const { secretsMatch } = require('./middlewares/auth');
  const { secret } = req.body || {};
  if (!secretsMatch(secret, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Secret invalide' });
  }
  const isSecure = process.env.NODE_ENV === 'production';
  res.setHeader('Set-Cookie',
    `nopalou_admin=${encodeURIComponent(secret)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${8 * 3600}${isSecure ? '; Secure' : ''}`
  );
  res.json({ ok: true });
});

// ── Routes API ────────────────────────────────────────────────
app.use('/api/produits',  require('./routes/produits'));
app.use('/api/offres',    require('./routes/offres'));
app.use('/api/paiement',  require('./routes/paiement'));
app.use('/api/alertes',   require('./routes/alertes'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/scraper',   require('./routes/scraper'));
app.use('/api/telecom',   require('./routes/telecom'));
app.use('/api/immo',      require('./routes/immo'));
app.use('/api/partenaires', require('./routes/partenaires'));
app.use('/api/annonces',        require('./routes/annonces'));
app.use('/api/boutiques',       require('./routes/boutiques'));
app.use('/api/promotions',      require('./routes/boutiques'));
app.use('/api/devises',         require('./routes/boutiques'));
app.use('/api/paiements',       require('./routes/boutiques'));
app.use('/api/facebook-posts',  require('./routes/facebook-posts'));
app.use('/api/abonnements',     require('./routes/abonnements'));
app.use('/api/admin/utilisateurs', require('./routes/admin-utilisateurs'));
app.use('/api/click',           require('./routes/click'));
app.use('/api/analytics',       require('./routes/analytics'));
app.use('/api/whatsapp',        require('./routes/whatsapp'));
app.use('/api/comptabilite',    require('./routes/comptabilite'));
app.use('/api/search',          require('./routes/search'));
app.use('/api/v1',              require('./routes/api-partenaire'));
app.use('/api/settings',        require('./routes/settings'));
app.use('/api/apporteurs',      require('./routes/apporteurs'));
app.use('/api/affiliates',      require('./routes/affiliates'));
app.use('/api/qualite',         require('./routes/qualite'));
app.use('/api/prospection',     require('./routes/prospection'));
app.use('/api/entites',         require('./routes/entites'));

// ── Health check (Diagnostics & Liveness/Readiness Probes) ─────
app.get(['/health', '/api/health'], async (req, res) => {
  const { pool } = require('./models/db');
  let dbStatus = 'ok';
  let dbLatency = 0;
  const start = Date.now();
  try {
    await pool.query('SELECT 1');
    dbLatency = Date.now() - start;
  } catch (err) {
    dbStatus = 'error: ' + err.message;
  }

  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    processType: process.env.PROCESS_TYPE || 'web',
    version: '1.2.0',
    uptimeSeconds: Math.floor(process.uptime()),
    memoryMB: {
      rss: Math.round(mem.rss / 1024 / 1024),
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
    },
    db: {
      status: dbStatus,
      latencyMs: dbLatency,
    },
    timestamp: new Date().toISOString(),
  });
});

// ── SSR pour les bots (Googlebot, Bingbot…) ──────────────────
app.use(require('./middlewares/bot-ssr'));

// ── Catch-all → SPA frontend ──────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);

// ── Gestion erreurs globale ───────────────────────────────────
// Sentry error handler — DOIT être APRÈS toutes les routes, AVANT les autres error handlers
if (Sentry) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err.stack);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ error: isDev ? (err.message || 'Erreur serveur') : 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;

// ── Migration automatique au démarrage ───────────────────────────
// BUG FIX : migrate.js n'était jamais appelé → DB vide → catégories manquantes
async function demarrerApp() {
  const server = app.listen(PORT, () => {
    console.log(`✅ Nopalou → http://localhost:${PORT}`);

    // Exécuter la vérification des migrations de manière asynchrone non-bloquante
    setImmediate(async () => {
      try {
        console.log('[MIGRATE] Vérification des tables...');
        const { pool: dbPool } = require('./models/db');
        await dbPool.query(`
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
          CREATE EXTENSION IF NOT EXISTS "pg_trgm";
        `);
        await require('./migrate-inline')();
      } catch (err) {
        console.warn('[MIGRATE] Avertissement:', err.message);
      }
    });

    const processType = process.env.PROCESS_TYPE || 'web';

    if (processType === 'worker') {
      console.log('🤖 [MODE WORKER] Démarrage des tâches de fond (scraping & crons)');
      const { demarrerScraping, demarrerCronsMetier } = require('./services/scraper');
      demarrerCronsMetier();
      if (process.env.SCRAPING_DISABLED !== 'true') {
        demarrerScraping();
      } else {
        console.log('[SCRAPER] Désactivé (SCRAPING_DISABLED=true)');
      }
    } else {
      console.log('⚡ [MODE WEB SERVER] Démarrage de l\'API Web & crons');
      const { demarrerScraping, demarrerCronsMetier } = require('./services/scraper');
      demarrerCronsMetier();
      if (process.env.SCRAPING_DISABLED !== 'true') {
        console.log('🕷️ [SCRAPER] Activation du scraping automatique HTTP en arrière-plan');
        demarrerScraping();
      } else {
        console.log('[SCRAPER] Désactivé (SCRAPING_DISABLED=true)');
      }
      try { require('./services/cron-relances-carnet'); } catch (e) { console.warn('[CRON CARNET] Warning:', e.message); }
    }
  });

  const { pool: dbPool2 } = require('./models/db');
  process.on('SIGTERM', () => {
    console.log('[SIGTERM] Arrêt gracieux…');
    server.close(() => dbPool2.end(() => process.exit(0)));
  });
}

if (process.env.NODE_ENV !== 'test') {
  demarrerApp().catch(console.error);
}

// (app exporté pour les tests)
module.exports = app;
