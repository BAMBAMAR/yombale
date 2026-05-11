// backend/routes/offres.js
const router   = require('express').Router();
const { pool } = require('../models/db');

// GET /api/offres
router.get('/', async (req, res) => {
  try {
    const { produit_id, marchand_id, stock } = req.query;
    const { rows } = await pool.query(`
      SELECT o.*, m.nom AS marchand, m.logo_url, m.site_url
      FROM offres o JOIN marchands m ON m.id = o.marchand_id
      WHERE ($1::uuid IS NULL OR o.produit_id  = $1::uuid)
        AND ($2::uuid IS NULL OR o.marchand_id = $2::uuid)
        AND ($3::boolean IS NULL OR o.stock     = $3)
      ORDER BY o.prix ASC`,
      [produit_id || null, marchand_id || null, stock === 'true' ? true : null]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/offres/sync — réception données d'un scraper externe (webhook)
router.post('/sync', async (req, res) => {
  const { marchand_id, produits } = req.body;
  if (!marchand_id || !Array.isArray(produits)) {
    return res.status(400).json({ error: 'marchand_id et produits[] requis' });
  }
  let updated = 0;
  for (const p of produits) {
    try {
      await pool.query(
        `INSERT INTO offres (produit_id, marchand_id, prix, url_achat, scraped_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (produit_id, marchand_id)
         DO UPDATE SET prix=EXCLUDED.prix, scraped_at=NOW()`,
        [p.produit_id, marchand_id, p.prix, p.url_achat]
      );
      await pool.query(
        `INSERT INTO historique_prix (offre_id, prix)
         SELECT id, $1 FROM offres WHERE produit_id=$2 AND marchand_id=$3`,
        [p.prix, p.produit_id, marchand_id]
      );
      updated++;
    } catch (err) { console.error('[SYNC]', err.message); }
  }
  res.json({ success: true, updated });
});

module.exports = router;
