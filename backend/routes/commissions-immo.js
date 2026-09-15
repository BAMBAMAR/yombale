// backend/routes/commissions-immo.js
// Gestion des commissions et honoraires d'agence et des agents négociateurs
// Standard Hektor / Apimo

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/commissions-immo/agence/:slugOrId — Liste des commissions ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, search } = req.query;

    let query = `
      SELECT c.*,
             t.type_transaction, t.montant AS transaction_montant, t.date_transaction,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
             u.nom AS agent_nom, u.prenom AS agent_prenom, u.email AS agent_email
      FROM commissions_immo c
      JOIN transactions_immo t ON c.transaction_id = t.id
      JOIN biens_immo b ON t.bien_id = b.id
      LEFT JOIN utilisateurs u ON t.agent_id = u.id
      WHERE c.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND c.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (search && search.trim()) {
      query += ` AND (b.titre ILIKE $${pIdx} OR u.nom ILIKE $${pIdx} OR c.notes ILIKE $${pIdx})`;
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      total: rows.length,
      commissions: rows,
    });
  } catch (err) {
    console.error('[GET /api/commissions-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement commissions' });
  }
});

// ── GET /api/commissions-immo/agence/:slugOrId/stats — Synthèse financière des honoraires ──
router.get('/agence/:slugOrId/stats', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;

    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(montant_brut), 0) AS total_brut,
         COALESCE(SUM(montant_paye), 0) AS total_encaisse,
         COALESCE(SUM(montant_restant), 0) AS total_en_attente,
         COUNT(*) FILTER (WHERE statut = 'payee') AS nb_payees,
         COUNT(*) FILTER (WHERE statut = 'en_attente') AS nb_en_attente,
         COALESCE(SUM(montant_brut) FILTER (WHERE created_at >= date_trunc('month', CURRENT_DATE)), 0) AS brut_mois_courant
       FROM commissions_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    res.json({
      success: true,
      stats: rows[0] || {}
    });
  } catch (err) {
    console.error('[GET /api/commissions-immo/agence/:slugOrId/stats]', err.message);
    res.status(500).json({ success: false, error: 'Erreur statistiques commissions' });
  }
});

// ── GET /api/commissions-immo/agence/:slugOrId/:commissionId — Détail ──
router.get('/agence/:slugOrId/:commissionId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { commissionId } = req.params;

    const { rows } = await pool.query(
      `SELECT c.*,
              t.type_transaction, t.montant AS transaction_montant, t.date_transaction, t.date_cloture,
              b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville, b.prix_vente, b.prix_location,
              u.nom AS agent_nom, u.prenom AS agent_prenom, u.telephone AS agent_telephone
       FROM commissions_immo c
       JOIN transactions_immo t ON c.transaction_id = t.id
       JOIN biens_immo b ON t.bien_id = b.id
       LEFT JOIN utilisateurs u ON t.agent_id = u.id
       WHERE c.id = $1 AND c.agence_id = $2`,
      [commissionId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Commission introuvable' });
    }

    res.json({ success: true, commission: rows[0] });
  } catch (err) {
    console.error('[GET /api/commissions-immo/:commissionId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement commission' });
  }
});

// ── POST /api/commissions-immo/agence/:slugOrId — Créer une commission manuelle ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      transaction_id,
      montant_brut,
      repartition = [],
      frais_applicables = [],
      date_prevue,
      notes,
    } = req.body;

    if (!transaction_id || !montant_brut) {
      return res.status(400).json({ success: false, error: 'Transaction et Montant brut obligatoires' });
    }

    const { rows: tx } = await pool.query(
      `SELECT id FROM transactions_immo WHERE id = $1 AND agence_id = $2`,
      [transaction_id, agenceId]
    );
    if (tx.length === 0) {
      return res.status(400).json({ success: false, error: 'Transaction introuvable pour cette agence' });
    }

    const brut = Number(montant_brut);
    const { rows } = await pool.query(
      `INSERT INTO commissions_immo (
        agence_id, transaction_id, montant_brut, montant_net, montant_restant,
        repartition, frais_applicables, date_prevue, statut, notes
      ) VALUES ($1, $2, $3, $3, $3, $4, $5, $6, 'en_attente', $7)
      RETURNING *`,
      [
        agenceId,
        transaction_id,
        brut,
        JSON.stringify(repartition),
        JSON.stringify(frais_applicables),
        date_prevue || null,
        notes || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Commission enregistrée avec succès',
      commission: rows[0],
    });
  } catch (err) {
    console.error('[POST /api/commissions-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur enregistrement commission' });
  }
});

// ── PUT /api/commissions-immo/agence/:slugOrId/:commissionId/regler — Encaisser/Régler une commission ──
router.put('/agence/:slugOrId/:commissionId/regler', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { commissionId } = req.params;
    const { montant_verse, mode_reglement = 'virement', notes } = req.body;

    const { rows: exist } = await pool.query(
      `SELECT * FROM commissions_immo WHERE id = $1 AND agence_id = $2`,
      [commissionId, agenceId]
    );
    if (exist.length === 0) {
      return res.status(404).json({ success: false, error: 'Commission introuvable' });
    }

    const current = exist[0];
    const verse = Number(montant_verse) || (current.montant_restant || current.montant_brut);
    const totalPaye = (Number(current.montant_paye) || 0) + verse;
    const totalRestant = Math.max(0, Number(current.montant_brut) - totalPaye);
    const newStatut = totalRestant === 0 ? 'payee' : 'partiellement_payee';

    const noteAdd = `Règlement de ${verse} FCFA via ${mode_reglement} le ${new Date().toLocaleDateString('fr-FR')}. ${notes || ''}`.trim();
    const updatedNotes = current.notes ? `${current.notes}\n${noteAdd}` : noteAdd;

    const { rows } = await pool.query(
      `UPDATE commissions_immo SET
        montant_paye = $1,
        montant_restant = $2,
        statut = $3,
        date_paiement = CURRENT_DATE,
        notes = $4
       WHERE id = $5 AND agence_id = $6
       RETURNING *`,
      [totalPaye, totalRestant, newStatut, updatedNotes, commissionId, agenceId]
    );

    res.json({
      success: true,
      message: 'Règlement de la commission validé avec succès',
      commission: rows[0],
    });
  } catch (err) {
    console.error('[PUT /api/commissions-immo/:commissionId/regler]', err.message);
    res.status(500).json({ success: false, error: 'Erreur validation règlement commission' });
  }
});

// ── DELETE /api/commissions-immo/agence/:slugOrId/:commissionId — Supprimer ──
router.delete('/agence/:slugOrId/:commissionId', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { commissionId } = req.params;

    const { rowCount } = await pool.query(
      `DELETE FROM commissions_immo WHERE id = $1 AND agence_id = $2`,
      [commissionId, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Commission introuvable' });
    }

    res.json({ success: true, message: 'Commission supprimée avec succès' });
  } catch (err) {
    console.error('[DELETE /api/commissions-immo/:commissionId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression commission' });
  }
});

module.exports = router;
