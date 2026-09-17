// backend/routes/factures-immo.js
// Facturation Agence : Factures d'honoraires, de gestion locative, quittances et débours

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { enregistrerAgenceAuditLog } = require('../lib/auditLoggerImmo');

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

    const fac = rows[0];

    // Audit log
    await enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id || req.user?.userId,
      null,
      'creation_facture_immo',
      `Émission de la facture d'honoraires ${fac.numero_facture} (${fac.type_facture}) - Montant: ${fac.montant_ttc} FCFA pour ${fac.client_nom}`,
      { facture_id: fac.id, numero_facture: fac.numero_facture, montant_ttc: fac.montant_ttc, type_facture: fac.type_facture },
      req
    ).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Facture créée avec succès',
      facture: fac
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

    const fac = rows[0];

    // Audit log
    await enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id || req.user?.userId,
      null,
      'encaissement_facture_immo',
      `Règlement encaissé pour la facture d'honoraires ${fac.numero_facture} (${fac.montant_ttc} FCFA) via ${mode_paiement || 'wave'}`,
      { facture_id: fac.id, numero_facture: fac.numero_facture, mode_paiement },
      req
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Facture marquée comme payée',
      facture: fac
    });
  } catch (err) {
    console.error('[PATCH /api/factures-immo/agence/:slugOrId/:factureId/encaisser]', err.message);
    res.status(500).json({ success: false, error: 'Erreur encaissement facture' });
  }
});

// ── PUT /api/factures-immo/agence/:slugOrId/:factureId — Modifier une facture d'honoraires ──
router.put('/agence/:slugOrId/:factureId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { factureId } = req.params;
    const {
      client_nom,
      client_tel,
      client_email,
      type_facture,
      bien_id,
      montant_ht,
      taux_tva,
      timbre_fiscal,
      date_echeance,
      mode_paiement,
      statut,
      notes,
      lignes
    } = req.body;

    const { rows: existingRows } = await pool.query(
      `SELECT * FROM factures_immo WHERE id = $1 AND agence_id = $2`,
      [factureId, agenceId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facture introuvable' });
    }

    const current = existingRows[0];

    const ht = montant_ht !== undefined ? parseFloat(montant_ht) : parseFloat(current.montant_ht || 0);
    const tvaPct = taux_tva !== undefined ? parseFloat(taux_tva) : parseFloat(current.taux_tva || 0);
    const montantTva = (ht * tvaPct) / 100;
    const timbre = timbre_fiscal !== undefined ? parseFloat(timbre_fiscal) : parseFloat(current.timbre_fiscal || 0);
    const ttc = ht + montantTva + timbre;

    const { rows: updatedRows } = await pool.query(
      `UPDATE factures_immo SET
        client_nom = COALESCE($1, client_nom),
        client_tel = COALESCE($2, client_tel),
        client_email = COALESCE($3, client_email),
        type_facture = COALESCE($4, type_facture),
        bien_id = CASE WHEN $5::text = 'null' THEN NULL WHEN $5 IS NOT NULL THEN $5::uuid ELSE bien_id END,
        montant_ht = $6,
        taux_tva = $7,
        montant_tva = $8,
        timbre_fiscal = $9,
        montant_ttc = $10,
        date_echeance = COALESCE($11, date_echeance),
        mode_paiement = COALESCE($12, mode_paiement),
        statut = COALESCE($13, statut),
        notes = COALESCE($14, notes),
        lignes = COALESCE($15::jsonb, lignes),
        updated_at = NOW()
       WHERE id = $16 AND agence_id = $17
       RETURNING *`,
      [
        client_nom ? client_nom.trim() : null,
        client_tel !== undefined ? client_tel : null,
        client_email !== undefined ? client_email : null,
        type_facture || null,
        bien_id !== undefined ? bien_id : null,
        ht,
        tvaPct,
        montantTva,
        timbre,
        ttc,
        date_echeance || null,
        mode_paiement || null,
        statut || null,
        notes !== undefined ? notes : null,
        lignes ? JSON.stringify(Array.isArray(lignes) ? lignes : []) : null,
        factureId,
        agenceId
      ]
    );

    const fac = updatedRows[0];

    // Audit log
    await enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id || req.user?.userId,
      null,
      'modification_facture_immo',
      `Mise à jour de la facture ${fac.numero_facture} - Nouveau montant: ${fac.montant_ttc} FCFA (Statut: ${fac.statut})`,
      { facture_id: fac.id, numero_facture: fac.numero_facture, montant_ttc: fac.montant_ttc, statut: fac.statut },
      req
    ).catch(() => {});

    res.json({
      success: true,
      message: 'Facture mise à jour avec succès',
      facture: fac
    });
  } catch (err) {
    console.error('[PUT /api/factures-immo/agence/:slugOrId/:factureId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour facture' });
  }
});

// ── DELETE /api/factures-immo/agence/:slugOrId/:factureId — Supprimer ou annuler une facture ──
router.delete('/agence/:slugOrId/:factureId', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { factureId } = req.params;

    const { rows } = await pool.query(
      `DELETE FROM factures_immo WHERE id = $1 AND agence_id = $2 RETURNING *`,
      [factureId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Facture introuvable' });
    }

    res.json({
      success: true,
      message: 'Facture supprimée avec succès'
    });
  } catch (err) {
    console.error('[DELETE /api/factures-immo/agence/:slugOrId/:factureId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression facture' });
  }
});

// ── PATCH /api/factures-immo/agence/:slugOrId/batch-encaisser — Encaisser factures par lot ──
router.patch(
  ['/agence/:slugOrId/batch-encaisser', '/:slugOrId/batch-encaisser'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { factureIds, mode_paiement = 'wave' } = req.body;

      if (!Array.isArray(factureIds) || factureIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucune facture sélectionnée.' });
      }

      const { rows } = await pool.query(
        `UPDATE factures_immo
         SET statut = 'payee',
             mode_paiement = $1,
             updated_at = NOW()
         WHERE id = ANY($2::uuid[]) AND agence_id = $3
         RETURNING id`,
        [mode_paiement, factureIds, agenceId]
      );

      res.json({
        success: true,
        message: `${rows.length} facture(s) d'honoraires marquée(s) comme payée(s).`,
        count: rows.length
      });
    } catch (err) {
      console.error('[BATCH_ENCAISSER_FACTURES_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur encaissement groupé des factures' });
    }
  }
);

module.exports = router;


