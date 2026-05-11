const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const path    = require('path');
require('dotenv').config();

const app = express();

// ── Middlewares globaux ───────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      connectSrc:    ["'self'"],
      styleSrc:      ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", "data:", "https:"],
      fontSrc:       ["'self'", "https:", "data:"],
      objectSrc:     ["'none'"],
      frameAncestors:["'self'"],
    }
  }
}));

const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : null,
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
app.use(morgan('dev'));

// ── Fichiers statiques frontend ───────────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── Routes API ────────────────────────────────────────────────
app.use('/api/produits',  require('./routes/produits'));
app.use('/api/offres',    require('./routes/offres'));
app.use('/api/paiement',  require('./routes/paiement'));
app.use('/api/alertes',   require('./routes/alertes'));
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/scraper',   require('./routes/scraper'));

// ── Health check ──────────────────────────────────────────────
app.get('/health', async (req, res) => {
  const { pool } = require('./models/db');
  let db = 'ok';
  try { await pool.query('SELECT 1'); } catch { db = 'erreur'; }
  res.json({ status: 'ok', version: '1.1.0', db, ts: new Date() });
});

// ── Catch-all → SPA frontend ──────────────────────────────────
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../frontend/index.html'))
);

// ── Gestion erreurs globale ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Erreur serveur' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Yombale → http://localhost:${PORT}`);

  // ── Démarrage du scraping automatique ────────────────────────
  // Désactivé si SCRAPING_DISABLED=true (utile en dev pour ne pas surcharger les sites)
  if (process.env.SCRAPING_DISABLED !== 'true') {
    const { demarrerScraping } = require('./services/scraper');
    demarrerScraping();
  } else {
    console.log('[SCRAPER] Désactivé (SCRAPING_DISABLED=true)');
  }
});

module.exports = app;
