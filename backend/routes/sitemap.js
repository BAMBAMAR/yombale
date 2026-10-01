// backend/routes/sitemap.js
// AUD-139 : identifiants seuls (jamais de téléphone ni de champ personnel) pour construire le sitemap complet.
// Réservé au rendu serveur du site (jeton X-SSR-Token) : un tiers n'a pas besoin de cet export, il lit le sitemap.xml public.
// Remplace l'appel des listes publiques (plafonnées, budgétées) qui tronquait le sitemap (50 annonces sur 4 633…).
const router = require('express').Router();
const { pool } = require('../models/db');
const { isSsrRequest } = require('../middlewares/rateLimit');

const PAGE = 5000;

const REQUETES = {
  // Produits du comparateur : mêmes conditions de visibilité que la liste publique (offre en stock >= 500 FCFA, photo)
  produit: {
    compte: `SELECT COUNT(*)::int AS n FROM (
               SELECT p.id FROM produits p JOIN offres o ON o.produit_id = p.id AND o.stock = true AND o.quarantinee = false
               WHERE p.image_url IS NOT NULL AND TRIM(p.image_url) != '' AND p.image_url NOT ILIKE '%placeholder%'
               GROUP BY p.id HAVING MIN(o.prix) >= 500) t`,
    liste: `SELECT p.id, MAX(p.created_at) AS updated_at, NULL::text AS boutique_slug, NULL::uuid AS boutique_id
            FROM produits p JOIN offres o ON o.produit_id = p.id AND o.stock = true AND o.quarantinee = false
            WHERE p.image_url IS NOT NULL AND TRIM(p.image_url) != '' AND p.image_url NOT ILIKE '%placeholder%'
            GROUP BY p.id HAVING MIN(o.prix) >= 500
            ORDER BY p.id LIMIT $1 OFFSET $2`,
  },
  // Produits des boutiques actives (hors modération, avec photo)
  produit_boutique: {
    compte: `SELECT COUNT(*)::int AS n FROM boutique_produits p JOIN boutiques b ON b.id = p.boutique_id
             WHERE b.actif = true AND p.en_stock = true AND (p.statut_moderation IS NULL OR p.statut_moderation = 'actif')
               AND p.images IS NOT NULL AND array_length(p.images, 1) > 0 AND TRIM(COALESCE(p.images[1], '')) != '' AND p.images[1] NOT ILIKE '%placeholder%'`,
    liste: `SELECT p.id, p.updated_at, b.slug AS boutique_slug, b.id AS boutique_id
            FROM boutique_produits p JOIN boutiques b ON b.id = p.boutique_id
            WHERE b.actif = true AND p.en_stock = true AND (p.statut_moderation IS NULL OR p.statut_moderation = 'actif')
              AND p.images IS NOT NULL AND array_length(p.images, 1) > 0 AND TRIM(COALESCE(p.images[1], '')) != '' AND p.images[1] NOT ILIKE '%placeholder%'
            ORDER BY p.id LIMIT $1 OFFSET $2`,
  },
  boutique: {
    compte: `SELECT COUNT(*)::int AS n FROM boutiques WHERE actif = true`,
    liste: `SELECT id, slug, updated_at FROM boutiques WHERE actif = true ORDER BY id LIMIT $1 OFFSET $2`,
  },
  annonce: {
    compte: `SELECT COUNT(*)::int AS n FROM annonces_classifiees WHERE actif = true AND supprimee = false`,
    liste: `SELECT id, updated_at FROM annonces_classifiees WHERE actif = true AND supprimee = false ORDER BY id LIMIT $1 OFFSET $2`,
  },
  immo: {
    compte: `SELECT COUNT(*)::int AS n FROM annonces_immo
             WHERE actif = true AND (supprimee IS NULL OR supprimee = false) AND (rejete IS NULL OR rejete = false) AND prix IS NOT NULL AND prix >= 10000`,
    liste: `SELECT id, updated_at FROM annonces_immo
            WHERE actif = true AND (supprimee IS NULL OR supprimee = false) AND (rejete IS NULL OR rejete = false) AND prix IS NOT NULL AND prix >= 10000
            ORDER BY id LIMIT $1 OFFSET $2`,
  },
  agence: {
    compte: `SELECT COUNT(*)::int AS n FROM agences_immo WHERE statut = 'actif'`,
    liste: `SELECT id, slug, updated_at FROM agences_immo WHERE statut = 'actif' ORDER BY id LIMIT $1 OFFSET $2`,
  },
};

// GET /api/sitemap/ids?type=produit|produit_boutique|boutique|annonce|immo|agence&page=1
router.get('/ids', async (req, res) => {
  if (!isSsrRequest(req)) return res.status(403).json({ success: false, error: 'Réservé au rendu serveur' });
  const type = String(req.query.type || '');
  const q = REQUETES[type];
  if (!q) return res.status(400).json({ success: false, error: `type attendu : ${Object.keys(REQUETES).join(', ')}` });
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  try {
    const [{ rows: c }, { rows }] = await Promise.all([
      pool.query(q.compte),
      pool.query(q.liste, [PAGE, (page - 1) * PAGE]),
    ]);
    res.set('Cache-Control', 'no-store');
    res.json({ success: true, type, page, par_page: PAGE, total: c[0].n, pages: Math.max(1, Math.ceil(c[0].n / PAGE)), items: rows });
  } catch (err) {
    console.error('[GET /api/sitemap/ids]', err.message);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

module.exports = router;
