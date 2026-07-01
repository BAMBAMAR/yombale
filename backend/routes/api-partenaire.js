// backend/routes/api-partenaire.js — API publique payante pour partenaires externes
const router  = require('express').Router();
const crypto  = require('crypto');
const { pool } = require('../models/db');
const rateLimit = require('express-rate-limit');

const QUOTA_GRATUIT = 1000; // req/mois

// Vérification de la clé API (header X-Api-Key ou ?api_key=)
async function requireApiKey(req, res, next) {
  const rawKey = req.headers['x-api-key'] || req.query.api_key;
  if (!rawKey) return res.status(401).json({ error: 'Clé API requise. Header: X-Api-Key' });

  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const { rows } = await pool.query(
    'SELECT id, plan, requests_this_month, reset_at FROM api_keys WHERE key_hash=$1',
    [keyHash]
  ).catch(() => ({ rows: [] }));

  if (!rows[0]) return res.status(401).json({ error: 'Clé API invalide' });

  const key = rows[0];
  if (key.plan === 'gratuit' && key.requests_this_month >= QUOTA_GRATUIT) {
    return res.status(429).json({
      error: `Quota mensuel atteint (${QUOTA_GRATUIT} req/mois). Passez au plan payant.`,
      upgrade_url: `${process.env.FRONTEND_URL}/api-partenaire`,
    });
  }

  // Incrémenter le compteur en arrière-plan
  pool.query(
    'UPDATE api_keys SET requests_this_month = requests_this_month + 1 WHERE id=$1',
    [key.id]
  ).catch(() => {});

  req.apiKey = key;
  next();
}

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 });

// GET /api/v1/prix?produit=smartphone — comparaison prix d'un produit
router.get('/prix', limiter, requireApiKey, async (req, res) => {
  const { produit, categorie, limit = 20 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT p.nom, p.categorie, o.prix, o.url_achat, m.nom AS marchand, o.updated_at
       FROM offres o
       JOIN produits p ON p.id = o.produit_id
       JOIN marchands m ON m.id = o.marchand_id
       WHERE o.stock = true
         AND ($1::text IS NULL OR p.nom ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR p.categorie = $2)
       ORDER BY o.prix ASC
       LIMIT $3`,
      [produit || null, categorie || null, Math.min(parseInt(limit) || 20, 100)]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/v1/boutiques?categorie=mode — liste des boutiques
router.get('/boutiques', limiter, requireApiKey, async (req, res) => {
  const { categorie, ville, limit = 20 } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT b.nom, b.description, b.ville, b.logo_url, b.categorie,
              COUNT(bp.id) AS nb_produits
       FROM boutiques b
       LEFT JOIN boutique_produits bp ON bp.boutique_id = b.id AND bp.disponible = true
       WHERE b.actif = true
         AND ($1::text IS NULL OR b.categorie = $1)
         AND ($2::text IS NULL OR b.ville ILIKE '%' || $2 || '%')
       GROUP BY b.id
       ORDER BY b.sponsorise DESC, b.created_at DESC
       LIMIT $3`,
      [categorie || null, ville || null, Math.min(parseInt(limit) || 20, 100)]
    );
    res.json({ data: rows, count: rows.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/v1/keys — créer une clé API (authentification utilisateur requise)
const { verifierToken } = require('../middlewares/auth');
router.post('/keys', verifierToken, async (req, res) => {
  try {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    await pool.query(
      'INSERT INTO api_keys (key_hash, utilisateur_id, plan) VALUES ($1,$2,$3)',
      [keyHash, req.user.userId, 'gratuit']
    );
    res.status(201).json({
      api_key: rawKey,
      plan: 'gratuit',
      quota_mensuel: QUOTA_GRATUIT,
      warning: 'Conservez cette clé — elle ne sera plus affichée.',
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
