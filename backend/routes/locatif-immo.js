// backend/routes/locatif-immo.js
// Gestion locative : Baux, Loyers/Échéances, Encaissements, Quittances & Maintenance

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

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
    const montantPayeTotal = Number(loyer.montant_paye) + Number(montant || loyer.montant_du);
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

    // 3. Ventilation mensuelle (6 derniers mois)
    const { rows: historiqueMois } = await pool.query(
      `SELECT 
        periode,
        COALESCE(SUM(montant_paye), 0) AS encaisse,
        COALESCE(SUM(montant_du), 0) AS attendu,
        COUNT(*) AS nb_echeances
       FROM loyers_echeances
       WHERE agence_id = $1
       GROUP BY periode
       ORDER BY periode DESC
       LIMIT 6`,
      [agenceId]
    );

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
