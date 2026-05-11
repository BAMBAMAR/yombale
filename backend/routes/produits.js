const router = require('express').Router();
const { pool, queryWithCache } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

// GET /api/produits?q=Samsung&categorie=smartphones&limit=20&page=1
router.get('/', async (req, res) => {
  try {
    const { q, categorie, limit = 20, page = 1 } = req.query;
    const offset    = (page - 1) * limit;
    const cacheKey  = `produits:${q}:${categorie}:${page}`;

    const rows = await queryWithCache(cacheKey, `
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             COUNT(o.id) AS nb_offres
      FROM produits p
      LEFT JOIN categories c ON c.id        = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom    ILIKE '%' || $1 || '%'
                              OR p.marque ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR c.slug = $2)
      GROUP BY p.id, c.nom
ORDER BY p.nb_offres DESC NULLS LAST
LIMIT $3 OFFSET $4`,
      [q || null, categorie || null, limit, offset]
    );
    res.json({ success: true, produits: rows, page: +page, limit: +limit });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id — détail d'un produit
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             COUNT(o.id) AS nb_offres
      FROM produits p
      LEFT JOIN categories c ON c.id        = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE p.id = $1
      GROUP BY p.id, c.nom`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/offres — triées par prix croissant
router.get('/:id/offres', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT o.*, m.nom AS marchand_nom, m.site_url
      FROM offres o
      JOIN marchands m ON m.id = o.marchand_id
      WHERE o.produit_id = $1 AND o.stock = true
      ORDER BY o.prix ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/produits/:id/historique — 90 derniers jours
router.get('/:id/historique', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT DATE_TRUNC('day', h.date) AS jour,
             MIN(h.prix) AS prix_min, MAX(h.prix) AS prix_max
      FROM historique_prix h
      JOIN offres o ON o.id = h.offre_id
      WHERE o.produit_id = $1
        AND h.date >= NOW() - INTERVAL '90 days'
      GROUP BY jour ORDER BY jour ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/produits — créer (admin)
router.post('/', verifierToken, async (req, res) => {
  try {
    const { nom, marque, categorie_id, ean, image_url } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO produits (nom,marque,categorie_id,ean,image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [nom, marque, categorie_id, ean, image_url]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
