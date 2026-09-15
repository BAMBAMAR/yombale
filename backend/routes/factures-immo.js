// backend/routes/factures-immo.js
// Facturation Agence : Factures d'honoraires, de gestion locative, quittances et débours

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

// ── GET /api/factures-immo/agence/:slugOrId ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, type } = req.query;

    let query = `
      SELECT f.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville
      FROM factures_immo f
      LEFT JOIN biens_immo b ON f.bien_id = b.id
      WHERE f.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND f.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (type && type !== 'tous') {
      query += ` AND f.type_facture = $${pIdx++}`;
      params.push(type);
    }

    query += ` ORDER BY f.date_emission DESC, f.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      factures: rows
    });
  } catch (err) {
    console.error('[GET /api/factures-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des factures' });
  }
});

// ── POST /api/factures-immo/agence/:slugOrId ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      type_facture = 'honoraires',
      client_nom,
      client_tel,
      client_email,
      bien_id,
      montant_ht,
      taux_tva = 0,
      timbre_fiscal = 0,
      date_echeance,
      mode_paiement = 'wave',
      lignes = [],
      notes
    } = req.body;

    if (!client_nom || !montant_ht) {
      return res.status(400).json({ success: false, error: 'Nom du client et montant HT obligatoires.' });
    }

    const ht = parseFloat(montant_ht) || 0;
    const tvaPct = parseFloat(taux_tva) || 0;
    const montantTva = (ht * tvaPct) / 100;
    const timbre = parseFloat(timbre_fiscal) || 0;
    const ttc = ht + montantTva + timbre;

    const numFacture = `FACT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const { rows } = await pool.query(
      `INSERT INTO factures_immo (
        agence_id, numero_facture, type_facture, client_nom, client_tel, client_email,
        bien_id, montant_ht, taux_tva, montant_tva, timbre_fiscal, montant_ttc,
        statut, date_emission, date_echeance, mode_paiement, lignes, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'en_attente', CURRENT_DATE, $13, $14, $15, $16)
      RETURNING *`,
      [
        agenceId,
        numFacture,
        type_facture,
        client_nom.trim(),
        client_tel || null,
        client_email || null,
        bien_id || null,
        ht,
        tvaPct,
        montantTva,
        timbre,
        ttc,
        date_echeance || null,
        mode_paiement,
        JSON.stringify(Array.isArray(lignes) ? lignes : []),
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      facture: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/factures-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création facture' });
  }
});

// ── PATCH /api/factures-immo/agence/:slugOrId/:factureId/encaisser ──
router.patch('/agence/:slugOrId/:factureId/encaisser', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { factureId } = req.params;
    const { mode_paiement } = req.body;

    const { rows } = await pool.query(
      `UPDATE factures_immo SET
        statut = 'payee',
        mode_paiement = COALESCE($1, mode_paiement),
        updated_at = NOW()
       WHERE id = $2 AND agence_id = $3
       RETURNING *`,
      [mode_paiement || null, factureId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facture introuvable' });
    }

    res.json({
      success: true,
      message: 'Facture marquée comme payée',
      facture: rows[0]
    });
  } catch (err) {
    console.error('[PATCH /api/factures-immo/agence/:slugOrId/:factureId/encaisser]', err.message);
    res.status(500).json({ success: false, error: 'Erreur encaissement facture' });
  }
});

module.exports = router;
