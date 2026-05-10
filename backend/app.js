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
      imgSrc:        ["'self'", "data:"],
      fontSrc:       ["'self'", "https:", "data:"],
      objectSrc:     ["'none'"],
      frameAncestors:["'self'"],
    }
  }
}));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
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

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'ok', version: '1.0.0', ts: new Date() })
);

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
app.listen(PORT, () => console.log(`✅ Yombale → http://localhost:${PORT}`));
module.exports = app;