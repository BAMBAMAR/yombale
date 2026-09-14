// backend/routes/boutiques-modules/boutiques-retours.js
const router = require('express').Router();
const { pool } = require('../../models/db');
const { verifierToken } = require('../../middlewares/auth');
const { checkBoutiqueAccess } = require('./helpers');

// ── GET /api/boutiques/:id/retours (Marchand Authentifié)
router.get('/:id/retours', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const { limit = 50, offset = 0, search } = req.query;
    let query = `SELECT * FROM boutique_retours WHERE boutique_id = $1`;
    const params = [bq.id];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (produit_nom ILIKE $${params.length} OR reference_origine ILIKE $${params.length} OR motif ILIKE $${params.length})`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const r = await pool.query(query, params);

    const statsRes = await pool.query(
      `SELECT
         COUNT(*) as total_retours,
         COALESCE(SUM(montant_fcfa), 0) as montant_total_retours,
         COUNT(*) FILTER (WHERE type_compensation = 'avoir') as nb_avoirs,
         COUNT(*) FILTER (WHERE type_compensation = 'remboursement') as nb_remboursements
       FROM boutique_retours WHERE boutique_id = $1`,
      [bq.id]
    );

    res.json({
      success: true,
      retours: r.rows,
      stats: statsRes.rows[0]
    });
  } catch (err) {
    console.error('[GET RETOURS ERR]', err);
    res.status(500).json({ error: 'Erreur lors du chargement des retours' });
  }
});

// ── POST /api/boutiques/:id/retours (Marchand Authentifié)
router.post('/:id/retours', verifierToken, async (req, res) => {
  try {
    const bq = await checkBoutiqueAccess(req.params.id, req.user.userId);
    if (!bq) return res.status(403).json({ error: 'Accès refusé' });

    const {
      reference_origine,
      produit_id,
      produit_nom,
      quantite = 1,
      motif,
      action_stock = 'remis_en_stock',
      type_compensation = 'avoir',
      montant_fcfa = 0,
      effectue_par
    } = req.body;

    if (!produit_nom || !motif) {
      return res.status(400).json({ error: 'Le nom du produit et le motif de retour sont requis' });
    }

    const qty = parseInt(quantite, 10) || 1;
    const montant = parseFloat(montant_fcfa) || 0;

    // 1. Enregistrer le retour
    const insertRes = await pool.query(
      `INSERT INTO boutique_retours (
         boutique_id, reference_origine, produit_id, produit_nom,
         quantite, motif, action_stock, type_compensation, montant_fcfa, effectue_par
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        bq.id,
        reference_origine || null,
        produit_id || null,
        produit_nom.trim(),
        qty,
        motif.trim(),
        action_stock,
        type_compensation,
        montant,
        effectue_par || null
      ]
    );

    // 2. Si réintégration en stock, incrémenter le stock du produit si produit_id valide
    if (action_stock === 'remis_en_stock' && produit_id) {
      await pool.query(
        `UPDATE boutique_produits
         SET stock_quantite = COALESCE(stock_quantite, 0) + $1, updated_at = NOW()
         WHERE id = $2 AND boutique_id = $3`,
        [qty, produit_id, bq.id]
      );
    }

    res.status(201).json({
      success: true,
      retour: insertRes.rows[0],
      stock_reintegre: action_stock === 'remis_en_stock' && !!produit_id
    });
  } catch (err) {
    console.error('[POST RETOUR ERR]', err);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du retour' });
  }
});

module.exports = router;
