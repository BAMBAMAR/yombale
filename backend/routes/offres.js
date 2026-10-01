// backend/routes/offres.js
const router   = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly, tokenOptional } = require('../middlewares/auth');
const { limiterBudget } = require('../middlewares/rateLimit');
const { clampPagination } = require('../lib/pagination');
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const { corrigerPrixParPlancher } = require('../services/scraper');

const { adminAccess } = require('../middlewares/admin-rbac');
// GET /api/offres
// AUD-135 : plus d'export complet anonyme (12 348 offres en une requête). Un filtre produit ou marchand est
// obligatoire, la page est bornée à 200 lignes et seules les colonnes utiles à l'affichage sont renvoyées.
router.get('/', tokenOptional, limiterBudget, async (req, res) => {
  try {
    const { produit_id, marchand_id, stock } = req.query;
    if (!produit_id && !marchand_id) {
      return res.status(400).json({ error: 'Précisez produit_id ou marchand_id.' });
    }
    if ((produit_id && !UUID_RE.test(produit_id)) || (marchand_id && !UUID_RE.test(marchand_id))) {
      return res.status(400).json({ error: 'Identifiant invalide.' });
    }
    const { limit, offset } = clampPagination(req, { def: 50, max: 200 });
    const { rows } = await pool.query(`
      SELECT o.id, o.produit_id, o.marchand_id, o.prix, o.devise, o.stock, o.url_achat, o.titre_marchand,
             o.scraped_at, o.specs, m.nom AS marchand, m.site_url
      FROM offres o JOIN marchands m ON m.id = o.marchand_id
      WHERE ($1::uuid IS NULL OR o.produit_id  = $1::uuid)
        AND ($2::uuid IS NULL OR o.marchand_id = $2::uuid)
        AND ($3::boolean IS NULL OR o.stock     = $3)
        AND COALESCE(o.quarantinee, false) = false
      ORDER BY o.prix ASC
      LIMIT $4 OFFSET $5`,
      [produit_id || null, marchand_id || null, stock === 'true' ? true : null, limit, offset]
    );
    res.json(rows);
  } catch (err) {
    console.error('[GET /api/offres]', err.message);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/offres/sync — réception données d'un scraper externe (admin seulement)
router.post('/sync', ...adminAccess('produits'), async (req, res) => {
  const { marchand_id, produits } = req.body;
  if (!marchand_id || !Array.isArray(produits)) {
    return res.status(400).json({ error: 'marchand_id et produits[] requis' });
  }
  let updated = 0;
  for (const p of produits) {
    const prixBrut = Number(p.prix);
    if (!p.produit_id || isNaN(prixBrut) || prixBrut <= 0 || prixBrut > 1e9) continue;
    const url = p.url_achat && /^https?:\/\//i.test(p.url_achat) ? p.url_achat : null;
    try {
      // Récupérer le nom du produit pour la correction ×100/×1000
      const prodRes = await pool.query('SELECT nom FROM produits WHERE id=$1', [p.produit_id]);
      const nomProduit = prodRes.rows[0]?.nom || '';
      const prix = corrigerPrixParPlancher(prixBrut, nomProduit);
      if (!prix || prix <= 0 || prix > 1e9) continue;

      let offreId;
      if (url) {
        const r = await pool.query(
          `INSERT INTO offres (produit_id, marchand_id, prix, url_achat, scraped_at)
           VALUES ($1, $2, $3, $4, NOW())
           ON CONFLICT (marchand_id, url_achat) WHERE url_achat IS NOT NULL AND TRIM(url_achat) != ''
           DO UPDATE SET produit_id=EXCLUDED.produit_id, prix=EXCLUDED.prix, scraped_at=NOW()
           RETURNING id`,
          [p.produit_id, marchand_id, prix, url]
        );
        offreId = r.rows[0]?.id;
      } else {
        const r = await pool.query(
          `INSERT INTO offres (produit_id, marchand_id, prix, url_achat, scraped_at)
           VALUES ($1, $2, $3, $4, NOW())
           RETURNING id`,
          [p.produit_id, marchand_id, prix, null]
        );
        offreId = r.rows[0]?.id;
      }

      if (offreId) {
        await pool.query(
          `INSERT INTO historique_prix (offre_id, prix) VALUES ($1, $2)`,
          [offreId, prix]
        );
      }

      updated++;
    } catch (err) { console.error('[SYNC]', err.message); }
  }
  res.json({ success: true, updated });
});

module.exports = router;
