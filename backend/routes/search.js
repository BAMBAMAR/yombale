// backend/routes/search.js — Recherche globale multi-domaines
const router = require('express').Router();
const { pool } = require('../models/db');
const { limiterRecherche } = require('../middlewares/rateLimit');

// GET /api/search?q=…&limit=10
router.get('/', limiterRecherche, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ q, produits: [], boutiques: [], annonces: [], immo: [] });

  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const like = `%${q}%`;

  try {
    const [produits, boutiques, annonces, immo] = await Promise.all([

      // ── Produits marketplace ─────────────────────────────────────────────────
      pool.query(
        `SELECT p.id, p.nom, p.marque, p.prix_min AS prix, p.image_url AS image,
                m.nom AS marchand
         FROM produits p
         LEFT JOIN marchands m ON m.id = p.marchand_id
         WHERE p.nom ILIKE $1 OR p.marque ILIKE $1
         ORDER BY
           CASE WHEN p.nom ILIKE $2 THEN 0 ELSE 1 END,
           p.prix_min ASC NULLS LAST
         LIMIT $3`,
        [like, `${q}%`, limit]
      ),

      // ── Boutiques + produits boutique ────────────────────────────────────────
      pool.query(
        `SELECT 'boutique' AS type, b.id, b.nom, b.description, b.categorie,
                b.ville, b.logo_url AS image, b.slug,
                NULL::numeric AS prix
         FROM boutiques b
         WHERE b.actif = true AND (b.nom ILIKE $1 OR b.description ILIKE $1 OR b.categorie ILIKE $1)
         UNION ALL
         SELECT 'produit_boutique' AS type, bp.id, bp.nom, bp.description, bp.categorie,
                b.ville, bp.images[1] AS image, b.slug || '/produits/' || bp.id::text AS slug,
                bp.prix::numeric
         FROM boutique_produits bp
         JOIN boutiques b ON b.id = bp.boutique_id
         WHERE b.actif = true AND bp.en_stock = true
           AND (bp.nom ILIKE $1 OR bp.description ILIKE $1)
         ORDER BY type, prix ASC NULLS LAST
         LIMIT $2`,
        [like, limit * 2]
      ),

      // ── Annonces classées ────────────────────────────────────────────────────
      pool.query(
        `SELECT a.id, a.titre AS nom, a.description, a.prix, a.ville,
                a.photos->>0 AS image, a.categorie, a.statut
         FROM annonces_classifiees a
         WHERE a.statut = 'publiee'
           AND (a.titre ILIKE $1 OR a.description ILIKE $1 OR a.categorie ILIKE $1 OR a.ville ILIKE $1)
         ORDER BY
           CASE WHEN a.titre ILIKE $2 THEN 0 ELSE 1 END,
           a.created_at DESC
         LIMIT $3`,
        [like, `${q}%`, limit]
      ),

      // ── Annonces immo ────────────────────────────────────────────────────────
      pool.query(
        `SELECT ai.id, ai.titre AS nom, ai.description, ai.prix,
                ai.ville, ai.quartier, ai.photos->>0 AS image,
                ai.type_bien, ai.transaction, ai.surface, ai.statut
         FROM annonces_immo ai
         WHERE ai.statut = 'publiee'
           AND (ai.titre ILIKE $1 OR ai.ville ILIKE $1 OR ai.quartier ILIKE $1
                OR ai.type_bien ILIKE $1 OR ai.description ILIKE $1)
         ORDER BY
           CASE WHEN ai.titre ILIKE $2 THEN 0 ELSE 1 END,
           ai.created_at DESC
         LIMIT $3`,
        [like, `${q}%`, limit]
      ),
    ]);

    res.json({
      q,
      produits: produits.rows,
      boutiques: boutiques.rows,
      annonces: annonces.rows,
      immo: immo.rows,
      total: produits.rows.length + boutiques.rows.length + annonces.rows.length + immo.rows.length,
    });
  } catch (err) {
    console.error('[SEARCH]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
