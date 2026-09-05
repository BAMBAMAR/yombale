// backend/routes/search.js — Recherche globale multi-domaines
const router = require('express').Router();
const { pool } = require('../models/db');
const { limiterRecherche } = require('../middlewares/rateLimit');
const { recordSearch } = require('../lib/searchLogger');

// GET /api/search?q=…&limit=10
router.get('/', limiterRecherche, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ q, produits: [], boutiques: [], annonces: [], immo: [] });

  // Enregistrement asynchrone non bloquant des tendances
  recordSearch(q);

  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const like = `%${q}%`;

  try {
    const [produits, boutiques, annonces, immo] = await Promise.all([

      // ── Produits marketplace ─────────────────────────────────────────────────
      pool.query(
        `SELECT p.id, p.nom, p.marque, p.prix_min AS prix, p.image_url AS image,
                (
                  SELECT m.nom 
                  FROM offres o 
                  JOIN marchands m ON m.id = o.marchand_id 
                  WHERE o.produit_id = p.id AND o.stock = true AND o.quarantinee = false 
                  ORDER BY o.prix ASC 
                  LIMIT 1
                ) AS marchand
         FROM produits p
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
                a.photos->>0 AS image, a.categorie_slug AS categorie,
                CASE WHEN a.actif THEN 'publiee' ELSE 'inactive' END AS statut
         FROM annonces_classifiees a
         WHERE a.actif = true AND a.supprimee = false
           AND (a.titre ILIKE $1 OR a.description ILIKE $1 OR a.categorie_slug ILIKE $1 OR a.ville ILIKE $1)
         ORDER BY
           CASE WHEN a.titre ILIKE $2 THEN 0 ELSE 1 END,
           CASE WHEN a.utilisateur_id IS NOT NULL THEN 0 ELSE 1 END,
           a.created_at DESC
         LIMIT $3`,
        [like, `${q}%`, limit]
      ),

      // ── Annonces immo ────────────────────────────────────────────────────────
      pool.query(
        `SELECT ai.id, ai.titre AS nom, ai.description, ai.prix,
                ai.ville, ai.quartier, ai.photos->>0 AS image,
                ai.type_bien, ai.transaction, ai.surface_m2 AS surface,
                CASE WHEN ai.actif THEN 'publiee' ELSE 'inactive' END AS statut
         FROM annonces_immo ai
         WHERE ai.actif = true AND ai.supprimee = false
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
