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

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
require('dotenv').config();

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
      connectSrc:    ["'self'", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
      styleSrc:      ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      styleSrcElem:  ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com", "data:"],
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
  'http://localhost:3000',
  'http://localhost:8080',
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error('CORS non autorisé pour : ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Protection pages admin ────────────────────────────────────
// Doit être AVANT express.static pour intercepter les routes
function adminPageGuard(req, res, next) {
  const { secretsMatch } = require('./middlewares/auth');
  const secret = req.headers['x-admin-secret'];
  if (process.env.ADMIN_SECRET && !secretsMatch(secret, process.env.ADMIN_SECRET)) {
    const page = req.path.replace('/', '');
    return res.status(401).send(
      '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Accès refusé</title>' +
      '<style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;background:#f4f5f7;margin:0;}' +
      '.box{background:#fff;border-radius:10px;padding:32px 40px;box-shadow:0 2px 8px rgba(0,0,0,.1);text-align:center;}' +
      'h2{color:#e63946;margin-top:0}input{padding:8px 12px;border:1px solid #d8dadf;border-radius:6px;font-size:14px;width:260px;margin-bottom:12px;}' +
      'button{padding:10px 24px;background:#ff6600;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;}</style></head>' +
      '<body><div class="box"><h2>🔒 Accès admin requis</h2>' +
      '<p style="color:#64748b;margin-bottom:16px">Entrez le secret admin pour accéder à cette page.</p>' +
      '<input type="password" id="s" placeholder="Secret admin" autofocus onkeydown="if(event.key===\'Enter\')go()">' +
      '<br><button onclick="go()">Accéder →</button>' +
      '<p id="err" style="color:#e63946;font-size:13px;min-height:18px"></p>' +
      '<script>async function go(){var s=document.getElementById("s").value;var r=await fetch("/'+page+'",{headers:{"x-admin-secret":s}});if(r.ok){sessionStorage.setItem("nopalou_admin_secret",s);location.href="/'+page+'";}else{document.getElementById("err").textContent="Secret invalide";}}<\/script>' +
      '</div></body></html>'
    );
  }
  next();
}

app.get('/admin-telecom.html', adminPageGuard);
app.get('/admin-immo.html',    adminPageGuard);
app.get('/admin-partenaires.html', adminPageGuard);
app.get('/admin.html', adminPageGuard);


// ── Fichiers statiques frontend ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

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

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { pool } = require('./models/db');
  let db = 'ok';
  try { await pool.query('SELECT 1'); } catch { db = 'erreur'; }
  res.json({ status: 'ok', version: '1.1.0', db, ts: new Date() });
});

// ── SSR pour les bots (Googlebot, Bingbot…) ──────────────────
app.use(require('./middlewares/bot-ssr'));

// ── Catch-all → SPA frontend ──────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);

// ── Gestion erreurs globale ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', req.method, req.path, err.stack);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(err.status || 500).json({ error: isDev ? (err.message || 'Erreur serveur') : 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;

// ── Migration automatique au démarrage ───────────────────────────
// BUG FIX : migrate.js n'était jamais appelé → DB vide → catégories manquantes
async function demarrerApp() {
  try {
    console.log('[MIGRATE] Vérification des tables...');
    // Inline les CREATE TABLE IF NOT EXISTS essentiels (idempotent)
    const { pool: dbPool } = require('./models/db');
    await dbPool.query(`
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      CREATE EXTENSION IF NOT EXISTS "pg_trgm";
    `);
    // Appel du script migrate complet — AWAIT obligatoire
    await require('./migrate-inline')();
  } catch (err) {
    console.warn('[MIGRATE] Avertissement:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`✅ Nopalou → http://localhost:${PORT}`);

    if (process.env.SCRAPING_DISABLED !== 'true') {
      const { demarrerScraping } = require('./services/scraper');
      demarrerScraping();
    } else {
      console.log('[SCRAPER] Désactivé (SCRAPING_DISABLED=true)');
    }
  });
}

demarrerApp().catch(console.error);

// (app exporté pour les tests)
module.exports = app;
