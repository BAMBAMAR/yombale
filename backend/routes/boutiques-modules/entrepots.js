// backend/routes/boutiques-modules/entrepots.js
// Gestion multi-entrepôts / multi-dépôts (Spec Audit Faiblesse 16)
const router = require('express').Router();
const { body, param } = require('express-validator');
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('../../middlewares/tenantSecurity');

// GET /api/boutiques/:id/entrepots — Lister les entrepôts de la boutique
router.get('/:id/entrepots', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    const bAccess = await checkBoutiqueAccess(id, req.user.userId);
    if (!bAccess && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { rows } = await pool.query(
      `SELECT * FROM boutique_entrepots WHERE boutique_id = $1 ORDER BY est_defaut DESC, nom ASC`,
      [id]
    );

    res.json({ success: true, entrepots: rows });
  } catch (err) {
    console.error('[ENTREPOTS GET ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des entrepôts' });
  }
});

// POST /api/boutiques/:id/entrepots — Créer un entrepôt
router.post(
  '/:id/entrepots',
  verifierToken,
  param('id').isUUID(),
  body('nom').trim().notEmpty().withMessage('Le nom de l’entrepôt est requis'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const bAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (!bAccess && !req.user?.is_admin) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const { nom, adresse, ville, responsable, telephone, est_defaut } = req.body;

      if (est_defaut) {
        await pool.query('UPDATE boutique_entrepots SET est_defaut = FALSE WHERE boutique_id = $1', [id]);
      }

      const { rows } = await pool.query(
        `INSERT INTO boutique_entrepots (boutique_id, nom, adresse, ville, responsable, telephone, est_defaut)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [id, nom, adresse || null, ville || 'Dakar', responsable || null, telephone || null, !!est_defaut]
      );

      res.status(201).json({ success: true, entrepot: rows[0] });
    } catch (err) {
      console.error('[ENTREPOTS POST ERR]', err);
      res.status(500).json({ error: 'Erreur lors de la création de l’entrepôt' });
    }
  }
);

// PUT /api/boutiques/:id/entrepots/:entrepotId — Modifier un entrepôt
router.put(
  '/:id/entrepots/:entrepotId',
  verifierToken,
  param('id').isUUID(),
  param('entrepotId').isUUID(),
  async (req, res) => {
    try {
      const { id, entrepotId } = req.params;
      const bAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (!bAccess && !req.user?.is_admin) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const { nom, adresse, ville, responsable, telephone, est_defaut, actif } = req.body;

      if (est_defaut) {
        await pool.query('UPDATE boutique_entrepots SET est_defaut = FALSE WHERE boutique_id = $1', [id]);
      }

      const { rows } = await pool.query(
        `UPDATE boutique_entrepots
         SET nom = COALESCE($1, nom),
             adresse = COALESCE($2, adresse),
             ville = COALESCE($3, ville),
             responsable = COALESCE($4, responsable),
             telephone = COALESCE($5, telephone),
             est_defaut = COALESCE($6, est_defaut),
             actif = COALESCE($7, actif),
             updated_at = NOW()
         WHERE id = $8 AND boutique_id = $9
         RETURNING *`,
        [nom, adresse, ville, responsable, telephone, est_defaut, actif, entrepotId, id]
      );

      if (rows.length === 0) return res.status(404).json({ error: 'Entrepôt introuvable' });

      res.json({ success: true, entrepot: rows[0] });
    } catch (err) {
      console.error('[ENTREPOTS PUT ERR]', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de l’entrepôt' });
    }
  }
);

// POST /api/boutiques/:id/entrepots/stocks — Mettre à jour le stock d'un produit dans un entrepôt
router.post(
  '/:id/entrepots/stocks',
  verifierToken,
  param('id').isUUID(),
  body('produit_id').isUUID(),
  body('entrepot_id').isUUID(),
  body('quantite').isInt({ min: 0 }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const bAccess = await checkBoutiqueAccess(id, req.user.userId);
      if (!bAccess && !req.user?.is_admin) {
        return res.status(403).json({ error: 'Accès refusé' });
      }

      const { produit_id, entrepot_id, quantite, seuil_alerte } = req.body;

      const { rows } = await pool.query(
        `INSERT INTO boutique_produit_stocks_entrepots (boutique_id, produit_id, entrepot_id, quantite, seuil_alerte)
         VALUES ($1, $2, $3, $4, COALESCE($5, 5))
         ON CONFLICT (produit_id, entrepot_id)
         DO UPDATE SET quantite = EXCLUDED.quantite, seuil_alerte = EXCLUDED.seuil_alerte, updated_at = NOW()
         RETURNING *`,
        [id, produit_id, entrepot_id, quantite, seuil_alerte]
      );

      // Met à jour la quantité totale agrégée du produit
      await pool.query(
        `UPDATE boutique_produits
         SET stock_quantite = (
           SELECT COALESCE(SUM(quantite), 0) FROM boutique_produit_stocks_entrepots WHERE produit_id = $1
         )
         WHERE id = $1 AND boutique_id = $2`,
        [produit_id, id]
      );

      res.json({ success: true, stock: rows[0] });
    } catch (err) {
      console.error('[ENTREPOTS STOCK ERR]', err);
      res.status(500).json({ error: 'Erreur lors de la mise à jour du stock entrepôt' });
    }
  }
);

// GET /api/boutiques/:id/entrepots/stocks — Récupérer la répartition des stocks par entrepôt
router.get('/:id/entrepots/stocks', verifierToken, param('id').isUUID(), async (req, res) => {
  try {
    const { id } = req.params;
    const bAccess = await checkBoutiqueAccess(id, req.user.userId);
    if (!bAccess && !req.user?.is_admin) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const { rows } = await pool.query(
      `SELECT s.*, e.nom as entrepot_nom, p.nom as produit_nom
       FROM boutique_produit_stocks_entrepots s
       JOIN boutique_entrepots e ON e.id = s.entrepot_id
       JOIN boutique_produits p ON p.id = s.produit_id
       WHERE s.boutique_id = $1
       ORDER BY p.nom ASC, e.nom ASC`,
      [id]
    );

    res.json({ success: true, stocks: rows });
  } catch (err) {
    console.error('[ENTREPOTS STOCKS GET ERR]', err);
    res.status(500).json({ error: 'Erreur lors de la récupération des stocks entrepôts' });
  }
});

module.exports = router;
