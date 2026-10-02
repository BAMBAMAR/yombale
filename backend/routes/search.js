// backend/routes/search.js — Recherche globale multi-domaines
const router = require('express').Router();
const { pool } = require('../models/db');
const { limiterRecherche } = require('../middlewares/rateLimit');
const { recordSearch } = require('../lib/searchLogger');
const { expandQuery } = require('../services/search-service');
const { conditionImmoPubliable } = require('../lib/immo-publiable');

// GET /api/search?q=…&limit=10
router.get('/', limiterRecherche, async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q || q.length < 2) return res.json({ q, produits: [], boutiques: [], annonces: [], immo: [] });

  // Enregistrement asynchrone non bloquant des tendances
  recordSearch(q);

  const limit = Math.min(parseInt(req.query.limit) || 10, 30);
  const terms = expandQuery(q).map(t => `%${t}%`);

  // AUD-216 : budget et tri (liste blanche : le tri n'est jamais interpolé depuis la requête)
  const prixMaxBrut = Number(req.query.prix_max);
  const prixMax = Number.isFinite(prixMaxBrut) && prixMaxBrut > 0 ? prixMaxBrut : null;
  const TRIS = {
    // pertinence : correspondance en début de nom, puis annonces en panne/location en bas, puis nombre d'offres, puis prix
    pertinence: `CASE WHEN m.nom ILIKE $2 THEN 0 ELSE 1 END,
                 CASE WHEN m.nom ~* '(cass[eé]|probl[eè]me|en panne|pour pi[eè]ces|hors service|en location)' THEN 1 ELSE 0 END,
                 m.nb_offres DESC NULLS LAST, m.prix_min ASC`,
    prix_asc: 'm.prix_min ASC',
    prix_desc: 'm.prix_min DESC',
  };
  const ordreProduits = TRIS[req.query.tri] || TRIS.pertinence;
  const PLANCHER_PRIX = 500; // même plancher que le catalogue d'accueil (routes/produits.js)

  try {
    const [produits, boutiques, annonces, immo] = await Promise.all([

      // ── Produits marketplace ─────────────────────────────────────────────────
      // Uniquement les produits ayant une offre en stock ; un prix très inférieur à la médiane des résultats
      // (donnée probablement erronée) est relégué en fin de liste au lieu de s'afficher en tête.
      pool.query(
        `WITH m AS (
           SELECT p.id, p.nom, p.marque, p.prix_min, p.image_url, p.nb_offres
           FROM produits p
           WHERE (p.nom ILIKE ANY($1::text[]) OR p.marque ILIKE ANY($1::text[]))
             AND $2::text IS NOT NULL -- $2 doit toujours être référencé, même quand le tri choisi ne l'utilise pas
             AND p.prix_min >= $4
             AND ($5::numeric IS NULL OR p.prix_min <= $5)
             AND EXISTS (SELECT 1 FROM offres o WHERE o.produit_id = p.id AND o.stock = true AND o.quarantinee = false)
         ), med AS (
           SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY prix_min) AS v, COUNT(*) AS n FROM m
         )
         SELECT m.id, m.nom, m.marque, m.prix_min AS prix, m.image_url AS image, m.nb_offres,
                (
                  SELECT mc.nom
                  FROM offres o
                  JOIN marchands mc ON mc.id = o.marchand_id
                  WHERE o.produit_id = m.id AND o.stock = true AND o.quarantinee = false
                  ORDER BY o.prix ASC
                  LIMIT 1
                ) AS marchand,
                COUNT(*) OVER() AS total_count
         FROM m CROSS JOIN med
         ORDER BY
           CASE WHEN med.n >= 5 AND m.prix_min < med.v * 0.1 THEN 1 ELSE 0 END,
           ${ordreProduits}
         LIMIT $3`,
        [terms, `${q}%`, limit, PLANCHER_PRIX, prixMax]
      ),

      // ── Boutiques + produits boutique ────────────────────────────────────────
      pool.query(
        `SELECT t.*, COUNT(*) OVER() AS total_count FROM (
         SELECT 'boutique' AS type, b.id, b.nom, b.description, b.categorie,
                b.ville, b.logo_url AS image, b.slug,
                NULL::numeric AS prix
         FROM boutiques b
         WHERE b.actif = true AND (
           b.nom ILIKE ANY($1::text[]) 
           OR b.description ILIKE ANY($1::text[]) 
           OR b.categorie ILIKE ANY($1::text[])
           OR EXISTS (
             SELECT 1 FROM boutique_produits bp_ex
             WHERE bp_ex.boutique_id = b.id AND bp_ex.en_stock = true
               AND (bp_ex.statut_moderation IS NULL OR bp_ex.statut_moderation = 'actif')
               AND (bp_ex.nom ILIKE ANY($1::text[]) OR bp_ex.description ILIKE ANY($1::text[]) OR bp_ex.categorie ILIKE ANY($1::text[]))
           )
         )
         UNION ALL
         SELECT 'produit_boutique' AS type, bp.id, bp.nom, bp.description, bp.categorie,
                b.ville, bp.images[1] AS image, b.slug || '/produits/' || bp.id::text AS slug,
                bp.prix::numeric
         FROM boutique_produits bp
         JOIN boutiques b ON b.id = bp.boutique_id
         WHERE b.actif = true AND bp.en_stock = true
           AND (bp.statut_moderation IS NULL OR bp.statut_moderation = 'actif')
           AND (bp.nom ILIKE ANY($1::text[]) OR bp.description ILIKE ANY($1::text[]))
         ) t
         ORDER BY t.type, t.prix ASC NULLS LAST
         LIMIT $2`,
        [terms, limit * 2]
      ),

      // ── Annonces classées ────────────────────────────────────────────────────
      pool.query(
        `SELECT a.id, a.titre AS nom, a.description, a.prix, a.ville,
                a.photos->>0 AS image, a.categorie_slug AS categorie,
                CASE WHEN a.actif THEN 'publiee' ELSE 'inactive' END AS statut,
                COUNT(*) OVER() AS total_count
         FROM annonces_classifiees a
         WHERE a.actif = true AND a.supprimee = false
           AND (a.titre ILIKE ANY($1::text[]) OR a.description ILIKE ANY($1::text[]) OR a.categorie_slug ILIKE ANY($1::text[]) OR a.ville ILIKE ANY($1::text[]))
         ORDER BY
           CASE WHEN a.titre ILIKE $2 THEN 0 ELSE 1 END,
           CASE WHEN a.utilisateur_id IS NOT NULL THEN 0 ELSE 1 END,
           a.created_at DESC
         LIMIT $3`,
        [terms, `${q}%`, limit]
      ),

      // ── Annonces immo ────────────────────────────────────────────────────────
      pool.query(
        `SELECT ai.id, ai.titre AS nom, ai.description, ai.prix,
                ai.ville, ai.quartier, ai.photos->>0 AS image,
                ai.type_bien, ai.transaction, ai.surface_m2 AS surface,
                CASE WHEN ai.actif THEN 'publiee' ELSE 'inactive' END AS statut,
                COUNT(*) OVER() AS total_count
         FROM annonces_immo ai
         WHERE ${conditionImmoPubliable('ai')}
           AND (ai.titre ILIKE ANY($1::text[]) OR ai.ville ILIKE ANY($1::text[]) OR ai.quartier ILIKE ANY($1::text[])
                OR ai.type_bien ILIKE ANY($1::text[]) OR ai.description ILIKE ANY($1::text[]))
         ORDER BY
           CASE WHEN ai.titre ILIKE $2 THEN 0 ELSE 1 END,
           ai.created_at DESC
         LIMIT $3`,
        [terms, `${q}%`, limit]
      ),
    ]);

    // Vrais totaux (COUNT sur l'ensemble des correspondances) ; `total_count` n'est pas renvoyé dans les lignes.
    const compter = (r) => (r.rows.length ? Number(r.rows[0].total_count) || r.rows.length : 0);
    const sansCompte = (r) => r.rows.map(({ total_count, ...ligne }) => ligne);
    const totaux = { produits: compter(produits), boutiques: compter(boutiques), annonces: compter(annonces), immo: compter(immo) };

    res.json({
      q,
      produits: sansCompte(produits),
      boutiques: sansCompte(boutiques),
      annonces: sansCompte(annonces),
      immo: sansCompte(immo),
      totaux,
      total: totaux.produits + totaux.boutiques + totaux.annonces + totaux.immo,
    });
  } catch (err) {
    console.error('[SEARCH]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router;
