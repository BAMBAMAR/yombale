const router = require('express').Router();
const { pool, queryWithCache } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

// GET /api/produits?q=Samsung&categorie=smartphones&limit=20&page=1
router.get('/', async (req, res) => {
  try {
    const { q, categorie, limit = 20, page = 1, tri, prixMax } = req.query;
    const offset    = (page - 1) * limit;
    const cacheKey  = `produits:${q}:${categorie}:${page}:${tri}:${prixMax}`;

    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  :                      'COUNT(o.id) DESC NULLS LAST'; // pertinence

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
        AND ($5::numeric IS NULL OR o.prix <= $5::numeric)
      GROUP BY p.id, c.nom
      ORDER BY ` + orderBy + `
      LIMIT $3 OFFSET $4`,
      [q || null, categorie || null, limit, offset, prixMax || null]
    );

    const totalResult = await pool.query(`
      SELECT COUNT(DISTINCT p.id) AS total
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom    ILIKE '%' || $1 || '%'
                              OR p.marque ILIKE '%' || $1 || '%')
        AND ($2::text IS NULL OR c.slug = $2)
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)`,
      [q || null, categorie || null, prixMax || null]
    );
    const total = parseInt(totalResult.rows[0].total, 10);

    res.json({ success: true, produits: rows, page: +page, limit: +limit, total, pages: Math.ceil(total / limit) });
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

// GET /api/produits/:id/similaires — produits similaires avec filtres marque/marchand/prix
router.get('/:id/similaires', async (req, res) => {
  try {
    const { marque, marchand, prixMax, prixMin, limit = 8 } = req.query;

    // Récupérer le produit source pour extraire mots-clés
    const { rows: src } = await pool.query('SELECT nom, marque, categorie_id FROM produits WHERE id=$1', [req.params.id]);
    if (!src.length) return res.status(404).json({ error: 'Produit introuvable' });

    // Extraire le mot-clé principal (1er mot significatif du nom)
    const motsCles = src[0].nom.split(/\s+/).filter(m => m.length > 3).slice(0, 2).join(' ');

    const { rows } = await pool.query(`
      SELECT DISTINCT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             COUNT(DISTINCT o.id) AS nb_offres,
             array_agg(DISTINCT m.nom) AS marchands
      FROM produits p
      LEFT JOIN categories c  ON c.id = p.categorie_id
      LEFT JOIN offres o      ON o.produit_id = p.id AND o.stock = true
      LEFT JOIN marchands m   ON m.id = o.marchand_id
      WHERE p.id != $1
        AND p.categorie_id = $2
        AND ($3::text IS NULL OR p.nom ILIKE '%' || $3 || '%')
        AND ($4::text IS NULL OR p.marque ILIKE $4)
        AND ($5::text IS NULL OR m.nom ILIKE '%' || $5 || '%')
        AND ($6::numeric IS NULL OR o.prix <= $6::numeric)
        AND ($7::numeric IS NULL OR o.prix >= $7::numeric)
      GROUP BY p.id, c.nom
      ORDER BY MIN(o.prix) ASC NULLS LAST
      LIMIT $8`,
      [req.params.id, src[0].categorie_id, motsCles || null,
       marque || null, marchand || null,
       prixMax || null, prixMin || null, limit]
    );
    res.json({ produits: rows, source: src[0], motsCles });
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
