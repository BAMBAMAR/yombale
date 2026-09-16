// backend/routes/locatif-immo.js
// Gestion locative : Baux, Loyers/Échéances, Encaissements, Quittances & Maintenance

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { enregistrerAgenceAuditLog } = require('../lib/auditLoggerImmo');

// ══════════════════════════════════════════════════════════════
// 1. BAUX IMMOBILIERS
// ══════════════════════════════════════════════════════════════

// ── GET /api/locatif-immo/agence/:slugOrId/baux ──
router.get('/agence/:slugOrId/baux', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut = 'actif' } = req.query;

    let query = `
      SELECT bx.*,
             b.titre AS bien_titre, b.type_bien, b.quartier AS bien_quartier, b.ville AS bien_ville,
             c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.whatsapp AS locataire_wa,
             p.nom AS proprietaire_nom, p.prenom AS proprietaire_prenom,
             (SELECT COUNT(*) FROM loyers_echeances le WHERE le.bail_id = bx.id AND le.statut IN ('retard', 'impaye')) AS nb_impayes
      FROM baux_immo bx
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      LEFT JOIN proprietaires_immo p ON bx.proprietaire_id = p.id
      WHERE bx.agence_id = $1
    `;
    const params = [agenceId];

    if (statut && statut !== 'tous') {
      query += ` AND bx.statut = $2`;
      params.push(statut);
    }

    query += ` ORDER BY bx.date_debut DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      baux: rows
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/agence/:slugOrId/baux]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des baux' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/baux — Créer un bail & générer les échéances ──
router.post('/agence/:slugOrId/baux', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      locataire_id,
      proprietaire_id,
      agent_id,
      date_debut,
      duree_mois = 12,
      loyer_mensuel,
      charges = 0,
      depot_garantie = 0,
      periodicite = 'mensuel',
      jour_echeance = 5,
      conditions
    } = req.body;

    if (!bien_id || !locataire_id || !date_debut || !loyer_mensuel) {
      return res.status(400).json({ success: false, error: 'Bien, locataire, date de début et loyer requis.' });
    }

    const loyer = parseFloat(loyer_mensuel);
    const chargeVal = parseFloat(charges) || 0;
    const montantTotalMensuel = loyer + chargeVal;
    const nbMois = parseInt(duree_mois, 10) || 12;

    // Calculer date_fin
    const startDate = new Date(date_debut);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + nbMois);

    // 1. Insérer le bail
    const { rows: bailRows } = await pool.query(
      `INSERT INTO baux_immo (
        agence_id, bien_id, locataire_id, proprietaire_id, agent_id,
        date_debut, date_fin, duree_mois, loyer_mensuel, charges, depot_garantie,
        periodicite, jour_echeance, statut, conditions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'actif', $14)
      RETURNING *`,
      [
        agenceId,
        bien_id,
        locataire_id,
        proprietaire_id || null,
        agent_id || req.user.userId,
        date_debut,
        endDate.toISOString().split('T')[0],
        nbMois,
        loyer,
        chargeVal,
        parseFloat(depot_garantie) || 0,
        periodicite,
        parseInt(jour_echeance, 10) || 5,
        conditions || null
      ]
    );

    const bail = bailRows[0];

    // 2. Mettre à jour l'occupation du bien en 'loue'
    await pool.query(
      `UPDATE biens_immo SET statut_occupation = 'loue', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
      [bien_id, agenceId]
    );

    // 3. Mettre à jour le type de contact en 'locataire'
    await pool.query(
      `UPDATE contacts_immo SET type_contact = 'locataire', statut_crm = 'gagne', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
      [locataire_id, agenceId]
    );

    // 4. Générer automatiquement les échéances mensuelles
    for (let i = 0; i < nbMois; i++) {
      const echeanceDate = new Date(startDate);
      echeanceDate.setMonth(echeanceDate.getMonth() + i);
      echeanceDate.setDate(parseInt(jour_echeance, 10) || 5);

      const periode = echeanceDate.toISOString().substring(0, 7); // 'YYYY-MM'
      const dateStr = echeanceDate.toISOString().split('T')[0];

      await pool.query(
        `INSERT INTO loyers_echeances (
          bail_id, agence_id, periode, date_echeance, montant_du, montant_paye, montant_restant, statut
        ) VALUES ($1, $2, $3, $4, $5, 0, $5, 'en_attente')
        ON CONFLICT DO NOTHING`,
        [bail.id, agenceId, periode, dateStr, montantTotalMensuel]
      );
    }

    res.status(201).json({
      success: true,
      message: `Bail créé avec succès (${nbMois} échéances générées)`,
      bail
    });
  } catch (err) {
    console.error('[POST /api/locatif-immo/agence/:slugOrId/baux]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la création du bail' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/baux/:bailId/resilier — Clôture anticipée / fin de bail ──
router.post('/agence/:slugOrId/baux/:bailId/resilier', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;
    const { motif = 'Fin de bail convenue' } = req.body;

    const { rows: bailRows } = await pool.query(
      `SELECT bx.*, b.titre AS bien_titre, c.nom AS locataire_nom 
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.id = $1 AND bx.agence_id = $2`,
      [bailId, agenceId]
    );

    if (bailRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable.' });
    }

    const bail = bailRows[0];

    // 1. Clôturer le bail
    const { rows: updatedBail } = await pool.query(
      `UPDATE baux_immo SET
        statut = 'resilie',
        date_fin = CURRENT_DATE,
        conditions = COALESCE(conditions, '') || $1,
        updated_at = NOW()
       WHERE id = $2 AND agence_id = $3
       RETURNING *`,
      [` [Résilié le ${new Date().toLocaleDateString('fr-FR')} - Motif : ${motif}]`, bailId, agenceId]
    );

    // 2. Libérer le bien pour le remettre en disponibilité
    await pool.query(
      `UPDATE biens_immo SET statut_occupation = 'disponible', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
      [bail.bien_id, agenceId]
    );

    // 3. Annuler les échéances de loyer futures qui étaient encore en attente
    await pool.query(
      `UPDATE loyers_echeances SET statut = 'annule', updated_at = NOW() 
       WHERE bail_id = $1 AND agence_id = $2 AND statut = 'en_attente' AND date_echeance > CURRENT_DATE`,
      [bailId, agenceId]
    );

    // 4. Audit log
    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id,
      null,
      'resiliation_bail',
      `Résiliation du bail ${bailId} pour le bien "${bail.bien_titre}" (Locataire : ${bail.locataire_nom}). Bien remis en disponibilité.`,
      { bail_id: bailId, bien_id: bail.bien_id, motif },
      req
    );

    res.json({
      success: true,
      message: 'Bail résilié avec succès. Le bien a été remis en statut disponible.',
      bail: updatedBail[0]
    });
  } catch (err) {
    console.error('[POST /baux/:bailId/resilier]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la résiliation du bail' });
  }
});

// ══════════════════════════════════════════════════════════════
// 2. LOYERS / ÉCHÉANCES & ENCAISSEMENTS
// ══════════════════════════════════════════════════════════════

// ── GET /api/locatif-immo/agence/:slugOrId/loyers ──
router.get('/agence/:slugOrId/loyers', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { periode, statut, bail_id } = req.query;

    let query = `
      SELECT le.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier,
             c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.whatsapp AS locataire_wa
      FROM loyers_echeances le
      JOIN baux_immo bx ON le.bail_id = bx.id
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      WHERE le.agence_id = $1
    `;
    const params = [agenceId];
    let pIndex = 2;

    if (periode) {
      query += ` AND le.periode = $${pIndex++}`;
      params.push(periode);
    }
    if (statut && statut !== 'tous') {
      query += ` AND le.statut = $${pIndex++}`;
      params.push(statut);
    }
    if (bail_id) {
      query += ` AND le.bail_id = $${pIndex++}`;
      params.push(bail_id);
    }

    query += ` ORDER BY le.date_echeance DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      loyers: rows
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/agence/:slugOrId/loyers]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des échéances' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/loyers/:loyerId/encaisser ──
router.post('/agence/:slugOrId/loyers/:loyerId/encaisser', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { loyerId } = req.params;
    const { montant, mode_paiement = 'wave', reference_paiement, notes } = req.body;

    const { rows: loyerRows } = await pool.query(
      `SELECT le.*, bx.bien_id, bx.locataire_id 
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       WHERE le.id = $1 AND le.agence_id = $2`,
      [loyerId, agenceId]
    );

    if (loyerRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance de loyer introuvable.' });
    }

    const loyer = loyerRows[0];

    // Idempotence & sécurité : empêcher le double encaissement si déjà soldé
    if (loyer.statut === 'paye' && Number(loyer.montant_restant) <= 0) {
      return res.status(400).json({ success: false, error: 'Cette échéance est déjà intégralement réglée.' });
    }

    const versement = Number(montant) || Number(loyer.montant_restant || loyer.montant_du);
    const montantPayeTotal = Math.min(Number(loyer.montant_du), Number(loyer.montant_paye || 0) + versement);
    const montantRestant = Math.max(0, Number(loyer.montant_du) - montantPayeTotal);
    const nouveauStatut = montantRestant === 0 ? 'paye' : 'partiel';
    const quittanceRef = `QUITTANCE-${loyer.periode}-${Date.now().toString(36).toUpperCase()}`;

    const { rows: updatedRows } = await pool.query(
      `UPDATE loyers_echeances SET
        montant_paye = $1,
        montant_restant = $2,
        statut = $3,
        date_paiement = CURRENT_DATE,
        mode_paiement = $4,
        reference_paiement = $5,
        quittance_url = $6,
        notes = COALESCE($7, notes),
        updated_at = NOW()
       WHERE id = $8 AND agence_id = $9
       RETURNING *`,
      [
        montantPayeTotal,
        montantRestant,
        nouveauStatut,
        mode_paiement,
        reference_paiement || null,
        quittanceRef,
        notes || null,
        loyerId,
        agenceId
      ]
    );

    // Audit log
    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id,
      null,
      'loyer_encaisse',
      `Encaissement de loyer : ${quittanceRef} (${montantPayeTotal} FCFA via ${mode_paiement || 'wave'})`,
      { loyer_id: loyerId, montant: montantPayeTotal, mode: mode_paiement, quittance: quittanceRef },
      req
    );

    res.json({
      success: true,
      message: 'Paiement de loyer enregistré avec succès',
      quittance_reference: quittanceRef,
      loyer: updatedRows[0]
    });
  } catch (err) {
    console.error('[POST /api/locatif-immo/agence/:slugOrId/loyers/:loyerId/encaisser]', err.message);
    res.status(500).json({ success: false, error: 'Erreur enregistrement encaissement' });
  }
});

// ── PUT /api/locatif-immo/agence/:slugOrId/loyers/:loyerId — Modifier une quittance / échéance de loyer ──
router.put('/agence/:slugOrId/loyers/:loyerId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { loyerId } = req.params;
    const {
      montant_du,
      montant_paye,
      date_echeance,
      date_paiement,
      mode_paiement,
      reference_paiement,
      statut,
      notes
    } = req.body;

    const { rows: existingRows } = await pool.query(
      `SELECT * FROM loyers_echeances WHERE id = $1 AND agence_id = $2`,
      [loyerId, agenceId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance de loyer introuvable' });
    }

    const current = existingRows[0];

    const du = montant_du !== undefined ? parseFloat(montant_du) : parseFloat(current.montant_du || 0);
    const paye = montant_paye !== undefined ? parseFloat(montant_paye) : parseFloat(current.montant_paye || 0);
    const restant = Math.max(0, du - paye);

    let finalStatut = statut;
    if (!finalStatut) {
      if (restant === 0 && paye > 0) {
        finalStatut = 'paye';
      } else if (paye > 0 && restant > 0) {
        finalStatut = 'partiel';
      } else {
        finalStatut = current.statut;
      }
    }

    let finalQuittanceUrl = current.quittance_url;
    if (paye > 0 && !finalQuittanceUrl) {
      finalQuittanceUrl = `QUITTANCE-${current.periode}-${Date.now().toString(36).toUpperCase()}`;
    }

    const { rows: updatedRows } = await pool.query(
      `UPDATE loyers_echeances SET
        montant_du = $1,
        montant_paye = $2,
        montant_restant = $3,
        date_echeance = COALESCE($4, date_echeance),
        date_paiement = CASE WHEN $5::text = 'null' THEN NULL WHEN $5 IS NOT NULL THEN $5::date ELSE date_paiement END,
        mode_paiement = COALESCE($6, mode_paiement),
        reference_paiement = COALESCE($7, reference_paiement),
        statut = $8,
        quittance_url = $9,
        notes = COALESCE($10, notes),
        updated_at = NOW()
       WHERE id = $11 AND agence_id = $12
       RETURNING *`,
      [
        du,
        paye,
        restant,
        date_echeance || null,
        date_paiement !== undefined ? date_paiement : null,
        mode_paiement || null,
        reference_paiement !== undefined ? reference_paiement : null,
        finalStatut,
        finalQuittanceUrl,
        notes !== undefined ? notes : null,
        loyerId,
        agenceId
      ]
    );

    const loy = updatedRows[0];

    // Audit log
    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id,
      null,
      'modification_quittance_loyer',
      `Modification de la quittance / échéance ${loy.periode} - Payé: ${loy.montant_paye} FCFA / Dû: ${loy.montant_du} FCFA (${loy.statut})`,
      { loyer_id: loyerId, montant_paye: loy.montant_paye, statut: loy.statut },
      req
    );

    res.json({
      success: true,
      message: 'Quittance et échéance de loyer mises à jour avec succès',
      loyer: loy
    });
  } catch (err) {
    console.error('[PUT /api/locatif-immo/agence/:slugOrId/loyers/:loyerId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour de la quittance' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/loyers/:loyerId/relance — Relance de paiement ──
router.post('/agence/:slugOrId/loyers/:loyerId/relance', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { loyerId } = req.params;

    const { rows } = await pool.query(
      `UPDATE loyers_echeances SET
        rappels_envoyes = rappels_envoyes + 1,
        dernier_rappel = NOW(),
        statut = CASE WHEN statut = 'en_attente' AND date_echeance < CURRENT_DATE THEN 'retard' ELSE statut END,
        updated_at = NOW()
       WHERE id = $1 AND agence_id = $2
       RETURNING *`,
      [loyerId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance introuvable.' });
    }

    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.id,
      null,
      'loyer_relance',
      `Relance de paiement de loyer envoyée pour la période ${rows[0].periode}`,
      { loyer_id: loyerId, periode: rows[0].periode },
      req
    );

    // Déclencher le rappel WhatsApp automatique au locataire
    const { notifierRelanceLoyerWhatsApp } = require('../services/immo-whatsapp-notifications');
    notifierRelanceLoyerWhatsApp({ agenceId, loyerId }).catch(err => {
      console.warn('[LOYER_RELANCE_WA_WARN]', err.message);
    });

    res.json({
      success: true,
      message: 'Relance de paiement envoyée avec succès',
      loyer: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/locatif-immo/agence/:slugOrId/loyers/:loyerId/relance]', err.message);
    res.status(500).json({ success: false, error: 'Erreur envoi de la relance' });
  }
});

// ══════════════════════════════════════════════════════════════
// 3. MAINTENANCE / INCIDENTS
// ══════════════════════════════════════════════════════════════

// ── GET /api/locatif-immo/agence/:slugOrId/maintenance ──
router.get('/agence/:slugOrId/maintenance', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut = 'tous' } = req.query;

    let query = `
      SELECT m.*,
             b.titre AS bien_titre, b.quartier AS bien_quartier, b.ville AS bien_ville
      FROM maintenance_immo m
      JOIN biens_immo b ON m.bien_id = b.id
      WHERE m.agence_id = $1
    `;
    const params = [agenceId];

    if (statut && statut !== 'tous') {
      query += ` AND m.statut = $2`;
      params.push(statut);
    }

    query += ` ORDER BY m.date_signal DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      tickets: rows
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/agence/:slugOrId/maintenance]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des tickets de maintenance' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/maintenance ──
router.post('/agence/:slugOrId/maintenance', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      bail_id,
      type = 'autre',
      description,
      priorite = 'normale',
      demandeur = 'locataire',
      technicien,
      cout_estime,
      a_charge_de = 'proprietaire',
      photos = []
    } = req.body;

    if (!bien_id || !description) {
      return res.status(400).json({ success: false, error: 'Bien et description obligatoires.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO maintenance_immo (
        agence_id, bien_id, bail_id, type, description, priorite,
        demandeur, technicien, cout_estime, a_charge_de, photos, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'signale')
      RETURNING *`,
      [
        agenceId,
        bien_id,
        bail_id || null,
        type,
        description.trim(),
        priorite,
        demandeur,
        technicien || null,
        cout_estime ? parseFloat(cout_estime) : null,
        a_charge_de,
        JSON.stringify(Array.isArray(photos) ? photos : [])
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Ticket de maintenance enregistré',
      ticket: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/locatif-immo/agence/:slugOrId/maintenance]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création ticket maintenance' });
  }
});

// ── PATCH /api/locatif-immo/agence/:slugOrId/maintenance/:ticketId — Mettre à jour un ticket ──
router.patch('/agence/:slugOrId/maintenance/:ticketId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { ticketId } = req.params;
    const { statut, technicien, cout_reel, a_charge_de } = req.body;

    const { rows } = await pool.query(
      `UPDATE maintenance_immo SET
        statut = COALESCE($1, statut),
        technicien = COALESCE($2, technicien),
        cout_reel = COALESCE($3, cout_reel),
        a_charge_de = COALESCE($4, a_charge_de),
        date_resolution = CASE WHEN $1 = 'resolu' THEN CURRENT_DATE ELSE date_resolution END,
        updated_at = NOW()
       WHERE id = $5 AND agence_id = $6
       RETURNING *`,
      [
        statut || null,
        technicien || null,
        cout_reel ? parseFloat(cout_reel) : null,
        a_charge_de || null,
        ticketId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Ticket introuvable.' });
    }

    res.json({
      success: true,
      message: 'Ticket mis à jour',
      ticket: rows[0]
    });
  } catch (err) {
    console.error('[PATCH /api/locatif-immo/agence/:slugOrId/maintenance/:ticketId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour ticket' });
  }
});

// ══════════════════════════════════════════════════════════════
// 4. COMPTABILITÉ & BILAN FINANCIER IMMOBILIER
// ══════════════════════════════════════════════════════════════

// ── GET /api/locatif-immo/agence/:slugOrId/compta ──
router.get('/agence/:slugOrId/compta', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const p = req.agence.parametres || {};
    const tauxCom = Number(p.taux_commission_location_defaut) || 10;

    // 1. Total Loyers Encaissés
    const { rows: loyersEncaisse } = await pool.query(
      `SELECT 
        COALESCE(SUM(montant_paye), 0) AS total_encaisse,
        COALESCE(SUM(montant_du), 0) AS total_attendu,
        COUNT(*) FILTER (WHERE statut = 'paye') AS nb_quittances_emises,
        COUNT(*) FILTER (WHERE statut IN ('retard', 'impaye')) AS nb_impayes,
        COALESCE(SUM(montant_restant) FILTER (WHERE statut IN ('retard', 'impaye')), 0) AS total_impayes
       FROM loyers_echeances
       WHERE agence_id = $1`,
      [agenceId]
    );

    const totalEncaisse = Number(loyersEncaisse[0]?.total_encaisse || 0);
    const honorairesEstimes = Math.round((totalEncaisse * tauxCom) / 100);
    const reversementBailleurs = totalEncaisse - honorairesEstimes;

    // 2. Dépenses de maintenance
    const { rows: depensesMaintenance } = await pool.query(
      `SELECT COALESCE(SUM(cout_reel), 0) AS total_maintenance
       FROM maintenance_immo
       WHERE agence_id = $1 AND statut = 'resolu'`,
      [agenceId]
    );

    // 3. Commissions sur Transactions & Ventes
    const { rows: commVente } = await pool.query(
      `SELECT 
        COALESCE(SUM(montant_brut), 0) AS total_commissions_brutes,
        COALESCE(SUM(montant_net), 0) AS total_commissions_nettes,
        COALESCE(SUM(montant_paye), 0) AS total_commissions_payees
       FROM commissions_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    // 4. Factures d'honoraires & débours
    const { rows: factStats } = await pool.query(
      `SELECT 
        COALESCE(SUM(montant_ttc), 0) AS total_facture_ttc,
        COALESCE(SUM(montant_ttc) FILTER (WHERE statut = 'payee'), 0) AS total_facture_encaisse,
        COUNT(*) AS nb_factures_total,
        COUNT(*) FILTER (WHERE statut = 'payee') AS nb_factures_payees
       FROM factures_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    // 5. Ventilation mensuelle (mois échus et mois en cours, max 12 périodes)
    const { rows: historiqueMois } = await pool.query(
      `SELECT 
        periode,
        COALESCE(SUM(montant_paye), 0) AS encaisse,
        COALESCE(SUM(montant_du), 0) AS attendu,
        COUNT(*) AS nb_echeances
       FROM loyers_echeances
       WHERE agence_id = $1 AND periode <= TO_CHAR(CURRENT_DATE + INTERVAL '1 month', 'YYYY-MM')
       GROUP BY periode
       ORDER BY periode DESC
       LIMIT 12`,
      [agenceId]
    );

    const commVenteBrutes = Number(commVente[0]?.total_commissions_brutes || 0);
    const commVentePayees = Number(commVente[0]?.total_commissions_payees || 0);
    const facturesEncaissees = Number(factStats[0]?.total_facture_encaisse || 0);

    res.json({
      success: true,
      bilan: {
        total_loyers_encaisses: totalEncaisse,
        total_loyers_attendus: Number(loyersEncaisse[0]?.total_attendu || 0),
        total_impayes: Number(loyersEncaisse[0]?.total_impayes || 0),
        nb_impayes: Number(loyersEncaisse[0]?.nb_impayes || 0),
        nb_quittances_emises: Number(loyersEncaisse[0]?.nb_quittances_emises || 0),
        taux_commission_moyen: tauxCom,
        honoraires_gestion_bruts: honorairesEstimes,
        reversement_bailleurs_net: reversementBailleurs,
        total_depenses_travaux: Number(depensesMaintenance[0]?.total_maintenance || 0),
        commissions_vente_brutes: commVenteBrutes,
        commissions_vente_payees: commVentePayees,
        factures_honoraires_encaisses: facturesEncaissees,
        chiffre_affaires_global: honorairesEstimes + commVentePayees + facturesEncaissees,
        historique_mensuel: historiqueMois.map(m => ({
          ...m,
          encaisse: Number(m.encaisse),
          attendu: Number(m.attendu),
          honoraires: Math.round((Number(m.encaisse) * tauxCom) / 100)
        }))
      }
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/agence/:slugOrId/compta]', err.message);
    res.status(500).json({ success: false, error: 'Erreur calcul comptabilité agence' });
  }
});

module.exports = router;
