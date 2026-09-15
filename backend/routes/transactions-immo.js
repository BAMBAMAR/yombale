// backend/routes/transactions-immo.js
// Pipeline de transactions immobilières (Vente, Location, VEFA, Terrains)
// Étapes notariales : Offre acceptée -> Compromis -> Séquestre -> Acte authentique -> Clôture
// Standard Hektor / Apimo

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { enregistrerAgenceAuditLog } = require('../lib/auditLoggerImmo');

// ── GET /api/transactions-immo/agence/:slugOrId — Liste des transactions ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, type_transaction, search } = req.query;

    let query = `
      SELECT t.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
             b.photos AS bien_images, b.reference AS bien_reference,
             v.nom AS vendeur_nom, v.telephone AS vendeur_telephone, v.email AS vendeur_email,
             a.nom AS acheteur_nom, a.telephone AS acheteur_telephone, a.email AS acheteur_email,
             u.nom AS agent_nom, u.prenom AS agent_prenom,
             courtier.nom AS courtier_nom, courtier.prenom AS courtier_prenom, courtier.telephone AS courtier_telephone,
             c.id AS commission_id, c.montant_brut AS commission_montant, c.statut AS commission_statut
      FROM transactions_immo t
      JOIN biens_immo b ON t.bien_id = b.id
      LEFT JOIN proprietaires_immo v ON t.vendeur_id = v.id
      LEFT JOIN contacts_immo a ON t.acheteur_id = a.id
      LEFT JOIN utilisateurs u ON t.agent_id = u.id
      LEFT JOIN utilisateurs courtier ON t.courtier_id = courtier.id
      LEFT JOIN commissions_immo c ON c.transaction_id = t.id
      WHERE t.agence_id = $1
    `;
    const params = [agenceId];
    let pIdx = 2;

    if (statut && statut !== 'tous') {
      query += ` AND t.statut = $${pIdx++}`;
      params.push(statut);
    }
    if (type_transaction && type_transaction !== 'tous') {
      query += ` AND t.type_transaction = $${pIdx++}`;
      params.push(type_transaction);
    }
    if (search && search.trim()) {
      query += ` AND (b.titre ILIKE $${pIdx} OR v.nom ILIKE $${pIdx} OR a.nom ILIKE $${pIdx})`;
      params.push(`%${search.trim()}%`);
      pIdx++;
    }

    query += ` ORDER BY t.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      total: rows.length,
      transactions: rows,
    });
  } catch (err) {
    console.error('[GET /api/transactions-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement transactions' });
  }
});

// ── GET /api/transactions-immo/agence/:slugOrId/pipeline — Résumé pipeline notaire ──
router.get('/agence/:slugOrId/pipeline', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE statut = 'en_cours') AS total_en_cours,
         COUNT(*) FILTER (WHERE statut = 'compromis_signe') AS total_compromis,
         COUNT(*) FILTER (WHERE statut = 'sequestre_depose') AS total_sequestre,
         COUNT(*) FILTER (WHERE statut = 'acte_authentique') AS total_acte_authentique,
         COUNT(*) FILTER (WHERE statut = 'cloturee') AS total_cloturees,
         COALESCE(SUM(montant) FILTER (WHERE statut != 'annulee'), 0) AS volume_affaires_total,
         COALESCE(SUM(montant) FILTER (WHERE statut = 'cloturee'), 0) AS volume_affaires_cloture
       FROM transactions_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    res.json({
      success: true,
      pipeline: rows[0] || {}
    });
  } catch (err) {
    console.error('[GET /api/transactions-immo/agence/:slugOrId/pipeline]', err.message);
    res.status(500).json({ success: false, error: 'Erreur calcul pipeline' });
  }
});

// ── GET /api/transactions-immo/agence/:slugOrId/:txId — Détail d'une transaction ──
router.get('/agence/:slugOrId/:txId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { txId } = req.params;

    const { rows } = await pool.query(
      `SELECT t.*,
              b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville,
              b.prix_vente, b.prix_location, b.surface_m2, b.photos AS bien_images,
              v.nom AS vendeur_nom, v.telephone AS vendeur_telephone, v.email AS vendeur_email, v.adresse AS vendeur_adresse,
              a.nom AS acheteur_nom, a.telephone AS acheteur_telephone, a.email AS acheteur_email,
              u.nom AS agent_nom, u.prenom AS agent_prenom, u.telephone AS agent_telephone,
              courtier.nom AS courtier_nom, courtier.prenom AS courtier_prenom, courtier.telephone AS courtier_telephone,
              m.type_mandat, m.taux_commission AS mandat_taux_commission,
              o.montant AS offre_montant, o.conditions AS offre_conditions
       FROM transactions_immo t
       JOIN biens_immo b ON t.bien_id = b.id
       LEFT JOIN proprietaires_immo v ON t.vendeur_id = v.id
       LEFT JOIN contacts_immo a ON t.acheteur_id = a.id
       LEFT JOIN utilisateurs u ON t.agent_id = u.id
       LEFT JOIN utilisateurs courtier ON t.courtier_id = courtier.id
       LEFT JOIN mandats_immo m ON t.mandat_id = m.id
       LEFT JOIN offres_immo o ON t.offre_id = o.id
       WHERE t.id = $1 AND t.agence_id = $2`,
      [txId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction introuvable' });
    }

    res.json({ success: true, transaction: rows[0] });
  } catch (err) {
    console.error('[GET /api/transactions-immo/:txId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement transaction' });
  }
});

// ── POST /api/transactions-immo/agence/:slugOrId — Créer une transaction ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      offre_id,
      mandat_id,
      vendeur_id,
      acheteur_id,
      agent_id,
      courtier_id,
      type_transaction = 'vente',
      montant,
      date_transaction = new Date().toISOString().split('T')[0],
      documents = [],
      notes,
    } = req.body;

    if (!bien_id || !montant) {
      return res.status(400).json({ success: false, error: 'Bien et Montant obligatoires' });
    }

    const assignedAgent = agent_id || req.user.userId;

    const { rows } = await pool.query(
      `INSERT INTO transactions_immo (
        agence_id, bien_id, offre_id, mandat_id, vendeur_id, acheteur_id,
        agent_id, courtier_id, type_transaction, montant, date_transaction,
        statut, documents, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'en_cours', $12, $13)
      RETURNING *`,
      [
        agenceId,
        bien_id,
        offre_id || null,
        mandat_id || null,
        vendeur_id || null,
        acheteur_id || null,
        assignedAgent,
        courtier_id || null,
        type_transaction,
        montant,
        date_transaction,
        JSON.stringify(documents),
        notes || null,
      ]
    );

    // Mettre à jour le statut du bien en 'sous_offre' ou 'compromis'
    await pool.query(
      `UPDATE biens_immo SET statut = 'sous_offre', updated_at = NOW() WHERE id = $1`,
      [bien_id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaction initiée avec succès',
      transaction: rows[0],
    });
  } catch (err) {
    console.error('[POST /api/transactions-immo/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création transaction' });
  }
});

// ── PUT /api/transactions-immo/agence/:slugOrId/:txId — Avancer une transaction ou la clôturer ──
router.put('/agence/:slugOrId/:txId', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { txId } = req.params;
    const {
      statut,
      montant,
      date_cloture,
      documents,
      notes,
    } = req.body;

    const { rows: exist } = await pool.query(
      `SELECT * FROM transactions_immo WHERE id = $1 AND agence_id = $2`,
      [txId, agenceId]
    );
    if (exist.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction introuvable' });
    }

    const currentTx = exist[0];
    const newStatut = statut || currentTx.statut;
    const isClosing = newStatut === 'cloturee' && currentTx.statut !== 'cloturee';

    const { rows } = await pool.query(
      `UPDATE transactions_immo SET
        statut = COALESCE($1, statut),
        montant = COALESCE($2, montant),
        date_cloture = COALESCE($3, date_cloture),
        documents = COALESCE($4, documents),
        notes = COALESCE($5, notes),
        updated_at = NOW()
       WHERE id = $6 AND agence_id = $7
       RETURNING *`,
      [
        statut,
        montant,
        isClosing ? (date_cloture || new Date().toISOString().split('T')[0]) : date_cloture,
        documents ? JSON.stringify(documents) : null,
        notes,
        txId,
        agenceId,
      ]
    );

    // Si clôturée : marquer le bien comme vendu/loué et générer la commission si non existante
    if (isClosing) {
      const statutBien = currentTx.type_transaction === 'location' ? 'loue' : 'vendu';
      await pool.query(
        `UPDATE biens_immo SET statut = $1, updated_at = NOW() WHERE id = $2`,
        [statutBien, currentTx.bien_id]
      );

      // Calculer commission auto
      const { rows: comExist } = await pool.query(
        `SELECT id FROM commissions_immo WHERE transaction_id = $1`,
        [txId]
      );

      if (comExist.length === 0) {
        // Taux par défaut de l'agence (ex 5% vente, 10% location)
        const { rows: aRows } = await pool.query(`SELECT parametres FROM agences_immo WHERE id = $1`, [agenceId]);
        const params = aRows[0]?.parametres || {};
        const rate = currentTx.type_transaction === 'vente'
          ? (Number(params.taux_commission_vente_defaut) || 5)
          : (Number(params.taux_commission_location_defaut) || 10);

        const montantCom = Math.round((currentTx.montant * rate) / 100);

        await pool.query(
          `INSERT INTO commissions_immo (
            agence_id, transaction_id, montant_brut, montant_net, montant_restant, statut, notes
          ) VALUES ($1, $2, $3, $3, $3, 'en_attente', $4)`,
          [
            agenceId,
            txId,
            montantCom,
            `Commission automatique (${rate}%) suite à la clôture de la transaction`
          ]
        );
      }
    }

    res.json({
      success: true,
      message: 'Transaction mise à jour avec succès',
      transaction: rows[0],
    });
  } catch (err) {
    console.error('[PUT /api/transactions-immo/:txId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour transaction' });
  }
});

// ── DELETE /api/transactions-immo/agence/:slugOrId/:txId — Annuler/Supprimer une transaction ──
router.delete('/agence/:slugOrId/:txId', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { txId } = req.params;

    const { rows: txRows } = await pool.query(
      `SELECT bien_id FROM transactions_immo WHERE id = $1 AND agence_id = $2`,
      [txId, agenceId]
    );

    if (txRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Transaction introuvable' });
    }

    // Remettre le bien en actif
    await pool.query(
      `UPDATE biens_immo SET statut = 'actif', updated_at = NOW() WHERE id = $1`,
      [txRows[0].bien_id]
    );

    await pool.query(`DELETE FROM transactions_immo WHERE id = $1 AND agence_id = $2`, [txId, agenceId]);

    res.json({ success: true, message: 'Transaction supprimée et bien remis en ligne' });
  } catch (err) {
    console.error('[DELETE /api/transactions-immo/:txId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression transaction' });
  }
});

module.exports = router;
