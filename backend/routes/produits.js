const router = require('express').Router();
const { pool, queryWithCache } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');

// GET /api/produits
router.get('/', async (req, res) => {
  try {
    const { q, categorie, limit = 20, page = 1, tri, prixMax, prixMin } = req.query;
    const offset = (page - 1) * limit;

    const orderBy = tri === 'prix_asc'  ? 'MIN(o.prix) ASC NULLS LAST'
                  : tri === 'prix_desc' ? 'MIN(o.prix) DESC NULLS LAST'
                  : tri === 'nom_asc'   ? 'p.nom ASC'
                  :                      'COUNT(o.id) DESC NULLS LAST';

    // Filtre catégorie : slug exact OU mots-clés dans le nom (pour produits sans categorie_id)
    const catCondition = `
      ($2::text IS NULL OR c.slug = $2 OR (
        ($2 = 'smartphones'  AND LOWER(p.nom) LIKE ANY(ARRAY['%samsung%','%iphone%','%xiaomi%','%tecno%','%infinix%','%phone%','%portable%','%tablette%','%nokia%','%huawei%','%oppo%','%realme%','%itel%']))
     OR ($2 = 'informatique' AND LOWER(p.nom) LIKE ANY(ARRAY['%laptop%','%ordinateur%','%macbook%','%lenovo%','%dell%','%hp %','%clavier%','%souris%','%imprimante%','%ssd%']))
     OR ($2 = 'tv-electro'   AND LOWER(p.nom) LIKE ANY(ARRAY['%tv %','%tele%','%télé%','%led%','%hisense%','%refriger%','%climatiseur%','%lave-linge%','%frigo%']))
     OR ($2 = 'mode'         AND LOWER(p.nom) LIKE ANY(ARRAY['%robe%','%chaussure%','%sneaker%','%basket%','%vêtement%','%habit%','%sac %','%montre%']))
     OR ($2 = 'maison'       AND LOWER(p.nom) LIKE ANY(ARRAY['%canapé%','%table %','%chaise%','%lit %','%matelas%','%meuble%','%armoire%']))
     OR ($2 = 'auto-moto'    AND LOWER(p.nom) LIKE ANY(ARRAY['%voiture%','%moto %','%vélo%','%auto %','%scooter%','%pneu%']))
     OR ($2 = 'jeux'         AND LOWER(p.nom) LIKE ANY(ARRAY['%playstation%','%xbox%','%nintendo%','%gaming%','%ps4%','%ps5%']))
      ))`;

    const sql = `
      SELECT p.*, c.nom AS categorie_nom,
             MIN(o.prix) AS prix_min,
             MAX(o.prix) AS prix_max,
             COUNT(o.id) AS nb_offres
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        AND ${catCondition}
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
        AND ($4::numeric IS NULL OR o.prix >= $4::numeric)
      GROUP BY p.id, c.nom
      ORDER BY ${orderBy}
      LIMIT $5 OFFSET $6`;

    const params = [q||null, categorie||null, prixMax||null, prixMin||null, limit, offset];
    const result = await pool.query(sql, params);

    const countSql = `
      SELECT COUNT(DISTINCT p.id) AS total
      FROM produits p
      LEFT JOIN categories c ON c.id = p.categorie_id
      LEFT JOIN offres o     ON o.produit_id = p.id AND o.stock = true
      WHERE ($1::text IS NULL OR p.nom ILIKE '%'||$1||'%' OR p.marque ILIKE '%'||$1||'%')
        AND ${catCondition}
        AND ($3::numeric IS NULL OR o.prix <= $3::numeric)
        AND ($4::numeric IS NULL OR o.prix >= $4::numeric)`;

    const countResult = await pool.query(countSql, [q||null, categorie||null, prixMax||null, prixMin||null]);
    const total = parseInt(countResult.rows[0].total, 10);

    // Correction des prix_min aberrants sur les cartes produits
    // Utilise le prix_max comme référence : si prix_min << prix_max, corriger
    result.rows.forEach(p => {
      const pMin = parseFloat(p.prix_min);
      const pMax = parseFloat(p.prix_max);
      if (pMin > 0 && pMax > 0) {
        const ratio = pMax / pMin;
        if (ratio >= 50 && ratio < 500)       p.prix_min = pMin * 100;
        else if (ratio >= 500 && ratio < 5000) p.prix_min = pMin * 1000;
      }
    });

    res.json({
      success: true,
      produits: result.rows,
      page: +page, limit: +limit,
      total, pages: Math.ceil(total / limit) || 1
    });
  } catch (err) {
    console.error('[GET /api/produits]', err.message);
    res.status(500).json({ error: err.message });
  }
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

    // ── Correction des prix aberrants ──────────────────────────────
    // Pour des produits identiques, un prix 10x inférieur à la médiane
    // indique une division par 100 ou 1000 lors du scraping (bug XOF).
    // On corrige à la volée sans toucher la base.
    if (rows.length >= 2) {
      const prices = rows.map(r => r.prix).filter(p => p > 0).sort((a, b) => a - b);
      // Médiane robuste
      const mid = Math.floor(prices.length / 2);
      const mediane = prices.length % 2 !== 0
        ? prices[mid]
        : (prices[mid - 1] + prices[mid]) / 2;

      rows.forEach(r => {
        if (r.prix <= 0) return;
        const ratio = mediane / r.prix;
        // Si prix est ~100x trop petit → multiplier par 100
        if (ratio >= 50 && ratio < 500) {
          r.prix = r.prix * 100;
          r._corrige = true;
        }
        // Si prix est ~1000x trop petit → multiplier par 1000
        else if (ratio >= 500) {
          r.prix = r.prix * 1000;
          r._corrige = true;
        }
      });

      // Retrier après correction
      rows.sort((a, b) => a.prix - b.prix);
    }

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
