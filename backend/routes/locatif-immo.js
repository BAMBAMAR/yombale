// backend/routes/locatif-immo.js
// Gestion locative : Baux, Loyers/Échéances, Encaissements, Quittances & Maintenance

const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { enregistrerAgenceAuditLog } = require('../lib/auditLoggerImmo');
const {
  notifierConfirmationPaiementLoyerWhatsApp,
  notifierNouveauBailLocataireWhatsApp
} = require('../services/immo-whatsapp-notifications');
const wave = require('../services/wave');
const { genererPdfContratBailStream, genererTextesDefautBail } = require('../lib/immo-pdf-bail');
const multer = require('multer');
const uploadDoc = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
});
const { uploadDocumentBuffer } = require('../services/cloudinary');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { normalisePhone, sendWhatsAppTemplate, sendWhatsAppText } = require('../services/whatsapp');
const { genererOtpPhone, verifierOtpPhone } = require('../services/otp');

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
      conditions,
      clauses_personnalisees
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

    // Vérifier si un bail actif existe déjà sur ce bien
    const { rows: activeBaux } = await pool.query(
      `SELECT id FROM baux_immo WHERE bien_id = $1 AND agence_id = $2 AND statut = 'actif'`,
      [bien_id, agenceId]
    );
    if (activeBaux.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Ce bien fait déjà l'objet d'un contrat de bail actif en cours. Veuillez résilier le bail précédent avant d'en créer un nouveau."
      });
    }

    // Résoudre automatiquement le proprietaire_id depuis biens_immo si non transmis
    let resolvedProprioId = proprietaire_id || null;
    if (!resolvedProprioId) {
      const { rows: bRows } = await pool.query(
        'SELECT proprietaire_id FROM biens_immo WHERE id = $1 AND agence_id = $2',
        [bien_id, agenceId]
      );
      resolvedProprioId = bRows[0]?.proprietaire_id || null;
    }

    const cpData = clauses_personnalisees && typeof clauses_personnalisees === 'object' ? clauses_personnalisees : {};
    const finalConditions = conditions || cpData.article6_conditions || null;

    // 1. Insérer le bail
    const { rows: bailRows } = await pool.query(
      `INSERT INTO baux_immo (
        agence_id, bien_id, locataire_id, proprietaire_id, agent_id,
        date_debut, date_fin, duree_mois, loyer_mensuel, charges, depot_garantie,
        periodicite, jour_echeance, statut, conditions, clauses_personnalisees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'actif', $14, $15::jsonb)
      RETURNING *`,
      [
        agenceId,
        bien_id,
        locataire_id,
        resolvedProprioId,
        agent_id || req.user?.userId || req.user?.id,
        date_debut,
        endDate.toISOString().split('T')[0],
        nbMois,
        loyer,
        chargeVal,
        parseFloat(depot_garantie) || 0,
        periodicite,
        parseInt(jour_echeance, 10) || 5,
        finalConditions,
        JSON.stringify(cpData)
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

    // Notification WhatsApp automatique du locataire (Espace Locataire + détails du bail)
    setImmediate(() => {
      notifierNouveauBailLocataireWhatsApp({ bailId: bail.id }).catch((errWa) => {
        console.warn('[BAIL_WA_NOTIF_WARN]:', errWa.message);
      });
    });

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
      req.user?.userId || req.user?.id,
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

// ── PUT /api/locatif-immo/agence/:slugOrId/baux/:bailId — Modifier / Personnaliser un contrat de bail ──
router.put('/agence/:slugOrId/baux/:bailId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;
    const {
      loyer_mensuel,
      charges,
      depot_garantie,
      jour_echeance,
      duree_mois,
      date_fin,
      conditions,
      document_url,
      clauses_personnalisees
    } = req.body;

    // 1. Vérifier existence
    const { rows: existing } = await pool.query(
      'SELECT bx.*, b.titre AS bien_titre FROM baux_immo bx JOIN biens_immo b ON bx.bien_id = b.id WHERE bx.id = $1 AND bx.agence_id = $2',
      [bailId, agenceId]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const currentBail = existing[0];

    // Synchronisation conditions <-> clauses_personnalisees.article6_conditions
    let finalConditions = conditions !== undefined ? conditions : null;
    let finalClauses = null;
    if (clauses_personnalisees !== undefined) {
      finalClauses = typeof clauses_personnalisees === 'object' ? JSON.stringify(clauses_personnalisees) : clauses_personnalisees;
      if (clauses_personnalisees && clauses_personnalisees.article6_conditions !== undefined && conditions === undefined) {
        finalConditions = clauses_personnalisees.article6_conditions;
      }
    }

    // 2. Mettre à jour les champs autorisés
    const { rows: updated } = await pool.query(
      `UPDATE baux_immo
       SET loyer_mensuel = COALESCE($1, loyer_mensuel),
           charges = COALESCE($2, charges),
           depot_garantie = COALESCE($3, depot_garantie),
           jour_echeance = COALESCE($4, jour_echeance),
           duree_mois = COALESCE($5, duree_mois),
           date_fin = COALESCE($6, date_fin),
           conditions = COALESCE($7, conditions),
           document_url = COALESCE($8, document_url),
           clauses_personnalisees = COALESCE($9::jsonb, clauses_personnalisees),
           updated_at = NOW()
       WHERE id = $10 AND agence_id = $11
       RETURNING *`,
      [
        loyer_mensuel !== undefined ? parseFloat(loyer_mensuel) : null,
        charges !== undefined ? parseFloat(charges) : null,
        depot_garantie !== undefined ? parseFloat(depot_garantie) : null,
        jour_echeance !== undefined ? parseInt(jour_echeance, 10) : null,
        duree_mois !== undefined ? parseInt(duree_mois, 10) : null,
        date_fin || null,
        finalConditions,
        document_url !== undefined ? document_url : null,
        finalClauses,
        bailId,
        agenceId
      ]
    );

    // 3. Audit log
    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.userId || req.user?.id,
      null,
      'modification_bail',
      `Modification du contrat de bail pour "${currentBail.bien_titre}" (Loyer: ${updated[0].loyer_mensuel} FCFA, Jour échéance: ${updated[0].jour_echeance})`,
      { bail_id: bailId, modifications: req.body },
      req
    );

    res.json({
      success: true,
      message: 'Contrat de bail mis à jour avec succès.',
      bail: updated[0]
    });
  } catch (err) {
    console.error('[PUT /baux/:bailId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du bail' });
  }
});

// ── GET /api/locatif-immo/agence/:slugOrId/baux/:bailId/modeles-articles — Modèles légaux et clauses de bail ──
router.get('/agence/:slugOrId/baux/:bailId/modeles-articles', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;

    const { rows } = await pool.query(
      `SELECT bx.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.type_bien, b.surface_m2, b.nb_pieces, b.nb_chambres, b.reference AS bien_ref,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              c.email AS locataire_email, c.profession AS locataire_profession,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON COALESCE(bx.proprietaire_id, b.proprietaire_id) = p.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE bx.id = $1 AND bx.agence_id = $2`,
      [bailId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const b = rows[0];
    const defauts = genererTextesDefautBail(b);
    res.json({
      success: true,
      defauts,
      clauses_personnalisees: b.clauses_personnalisees || {},
      conditions: b.conditions || '',
      bail: b
    });
  } catch (err) {
    console.error('[GET /baux/:bailId/modeles-articles]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement modèles du bail' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/baux/:bailId/signer — Signature électronique agence / bailleur ──
router.post('/agence/:slugOrId/baux/:bailId/signer', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;
    const { signature, cachet, nom_signataire } = req.body;

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Signature requise' });
    }

    const { rows } = await pool.query(
      `UPDATE baux_immo
       SET signature_bailleur = $1,
           cachet_bailleur = COALESCE($2, cachet_bailleur),
           date_signature_bailleur = NOW(),
           nom_signataire_bailleur = $3,
           statut_signature = CASE WHEN signature_locataire IS NOT NULL THEN 'valide' ELSE 'signe_agence' END,
           updated_at = NOW()
       WHERE id = $4 AND agence_id = $5
       RETURNING *`,
      [signature, cachet || null, nom_signataire || req.user?.nom || 'L\'Agence Mandataire', bailId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    enregistrerAgenceAuditLog(
      agenceId,
      req.user?.userId || req.user?.id,
      null,
      'signature_bail_agence',
      `Signature électronique du contrat de bail ${bailId} par l'agence (${nom_signataire || 'Mandataire'})`,
      { bail_id: bailId },
      req
    );

    res.json({
      success: true,
      message: 'Bail signé avec succès par l\'agence.',
      bail: rows[0]
    });
  } catch (err) {
    console.error('[POST /baux/:bailId/signer]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la signature du bail' });
  }
});

// ── POST /api/locatif-immo/agence/:slugOrId/baux/:bailId/documents — Dépôt de pièce justificative (CNI, etc.) par l'agence ──
router.post('/agence/:slugOrId/baux/:bailId/documents', verifierToken, requireAgenceAccess(), uploadDoc.single('file'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId } = req.params;
    const { type_piece = 'autre', label } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Fichier requis' });
    }

    const { rows: bRows } = await pool.query(
      'SELECT id, locataire_id, pieces_jointes FROM baux_immo WHERE id = $1 AND agence_id = $2',
      [bailId, agenceId]
    );
    if (bRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const bail = bRows[0];
    const secureUrl = await uploadDocumentBuffer(file.buffer, 'documents_locatif', file.originalname);

    const docItem = {
      id: require('crypto').randomUUID(),
      type_piece,
      label: label || type_piece,
      nom_fichier: file.originalname,
      url: secureUrl,
      taille: file.size,
      mimetype: file.mimetype,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'agence',
      statut: 'valide',
      motif_rejet: null
    };

    const nextPieces = [...(bail.pieces_jointes || []), docItem];

    const { rows: updated } = await pool.query(
      'UPDATE baux_immo SET pieces_jointes = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *',
      [JSON.stringify(nextPieces), bailId]
    );

    // Synchronisation sur contacts_immo
    if (bail.locataire_id) {
      await pool.query(
        'UPDATE contacts_immo SET pieces_jointes = COALESCE(pieces_jointes, \'[]\'::jsonb) || $1::jsonb WHERE id = $2',
        [JSON.stringify([docItem]), bail.locataire_id]
      );
    }

    res.json({
      success: true,
      message: 'Pièce justificative ajoutée avec succès.',
      document: docItem,
      pieces_jointes: updated[0].pieces_jointes
    });
  } catch (err) {
    console.error('[POST /baux/:bailId/documents]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du téléversement du document' });
  }
});

// ── PUT /api/locatif-immo/agence/:slugOrId/baux/:bailId/documents/:docId/statut — Valider / Rejeter un document ──
router.put('/agence/:slugOrId/baux/:bailId/documents/:docId/statut', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId, docId } = req.params;
    const { statut, motif_rejet } = req.body;

    const { rows: bRows } = await pool.query(
      'SELECT id, pieces_jointes FROM baux_immo WHERE id = $1 AND agence_id = $2',
      [bailId, agenceId]
    );
    if (bRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const currentPieces = bRows[0].pieces_jointes || [];
    const nextPieces = currentPieces.map(p => {
      if (p.id === docId) {
        return {
          ...p,
          statut: statut || p.statut,
          motif_rejet: statut === 'rejete' ? (motif_rejet || 'Document non conforme ou illisible') : null,
          verifie_le: new Date().toISOString()
        };
      }
      return p;
    });

    const { rows: updated } = await pool.query(
      'UPDATE baux_immo SET pieces_jointes = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING pieces_jointes',
      [JSON.stringify(nextPieces), bailId]
    );

    res.json({
      success: true,
      message: `Statut du document mis à jour (${statut}).`,
      pieces_jointes: updated[0].pieces_jointes
    });
  } catch (err) {
    console.error('[PUT /baux/:bailId/documents/:docId/statut]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du document' });
  }
});

// ── DELETE /api/locatif-immo/agence/:slugOrId/baux/:bailId/documents/:docId — Supprimer un document ──
router.delete('/agence/:slugOrId/baux/:bailId/documents/:docId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bailId, docId } = req.params;

    const { rows: bRows } = await pool.query(
      'SELECT id, pieces_jointes FROM baux_immo WHERE id = $1 AND agence_id = $2',
      [bailId, agenceId]
    );
    if (bRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable' });
    }

    const nextPieces = (bRows[0].pieces_jointes || []).filter(p => p.id !== docId);

    const { rows: updated } = await pool.query(
      'UPDATE baux_immo SET pieces_jointes = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING pieces_jointes',
      [JSON.stringify(nextPieces), bailId]
    );

    res.json({
      success: true,
      message: 'Document supprimé avec succès.',
      pieces_jointes: updated[0].pieces_jointes
    });
  } catch (err) {
    console.error('[DELETE /baux/:bailId/documents/:docId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du document' });
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
      req.user?.userId || req.user?.id,
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
      req.user?.userId || req.user?.id,
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
      req.user?.userId || req.user?.id,
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

// ══════════════════════════════════════════════════════════════
// 5. ESPACE LOCATAIRE GRAND PUBLIC (CONSULTATION & QUITTANCES)
// ══════════════════════════════════════════════════════════════

const cleanPdfText = (str) => String(str || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
const fmtPdfNum = (n) => {
  const num = Math.round(Number(n || 0));
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
const PDF_NAVY = '#1C2B4A';
const PDF_PRICE_GREEN = '#0A5C36';
const PDF_GRAY = '#4B5563';

function genererPdfQuittanceStream(res, d) {
  const quittanceRef = d.quittance_url || `QT-${d.periode}-${d.id.slice(0, 8).toUpperCase()}`;

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="quittance_${quittanceRef}.pdf"`);

  const doc = new PDFDocument({ margin: 45, size: 'A4' });
  doc.pipe(res);

  doc.fillColor(PDF_PRICE_GREEN).fontSize(7.5).font('Helvetica-Bold')
     .text("RÉPUBLIQUE DU SÉNÉGAL • CODE DES OBLIGATIONS CIVILES ET COMMERCIALES (COCC) • GESTION LOCATIVE CONFORME", 45, 40);

  doc.fillColor(PDF_NAVY).fontSize(18).font('Helvetica-Bold').text(d.agence_nom, 45, 58);
  let infoY = 80;
  doc.fontSize(8.5).font('Helvetica').fillColor(PDF_GRAY);
  if (d.numero_agrement) { doc.text(`Agrément Professionnel : ${d.numero_agrement}`, 45, infoY); infoY += 12; }
  if (d.agence_adresse) { doc.text(d.agence_adresse + (d.agence_ville ? `, ${d.agence_ville}` : ''), 45, infoY); infoY += 12; }
  if (d.agence_tel) { doc.text(`Tél : ${d.agence_tel}${d.agence_email ? ` • Email : ${d.agence_email}` : ''}`, 45, infoY); infoY += 12; }

  doc.moveTo(45, infoY + 6).lineTo(550, infoY + 6).strokeColor(PDF_NAVY).lineWidth(1.5).stroke();

  const titleY = infoY + 18;
  doc.fillColor(PDF_NAVY).fontSize(18).font('Helvetica-Bold').text('QUITTANCE DE LOYER', 45, titleY);
  doc.fillColor(PDF_GRAY).fontSize(9).font('Helvetica')
     .text(`Réf : ${quittanceRef}`, 45, titleY + 22)
     .text(`Période acquittée : ${d.periode}`, 45, titleY + 34)
     .text(`Date d'émission : ${new Date(d.date_paiement || d.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 45, titleY + 46);

  const partiesY = titleY + 70;
  doc.roundedRect(305, partiesY, 245, 95, 6).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text('LOCATAIRE (PRENEUR)', 315, partiesY + 10);
  doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold')
     .text(`${cleanPdfText(d.locataire_prenom)} ${cleanPdfText(d.locataire_nom)}`.trim(), 315, partiesY + 26);
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_GRAY)
     .text(`Téléphone : ${d.locataire_tel || 'N/A'}`, 315, partiesY + 42)
     .text(`Email : ${d.locataire_email || 'N/A'}`, 315, partiesY + 54)
     .text(`Bail Réf : ${d.bail_id ? d.bail_id.slice(0, 8).toUpperCase() : 'N/A'}`, 315, partiesY + 66);

  doc.roundedRect(45, partiesY, 250, 95, 6).fillColor('#F8FAFC').fillAndStroke('#E2E8F0');
  doc.fillColor(PDF_NAVY).fontSize(10).font('Helvetica-Bold').text('BIEN LOUÉ & PROPRIÉTAIRE', 55, partiesY + 10);
  doc.fillColor('#1F2937').fontSize(9.5).font('Helvetica-Bold')
     .text(cleanPdfText(d.bien_titre), 55, partiesY + 26, { width: 230 });
  let bY = partiesY + 42;
  if (d.bien_adresse || d.bien_quartier) {
    doc.font('Helvetica').fontSize(8.5).fillColor(PDF_GRAY)
       .text(`${d.bien_adresse || ''} ${d.bien_quartier ? `(${d.bien_quartier})` : ''} - ${d.bien_ville || 'Dakar'}`, 55, bY, { width: 230 });
    bY += 24;
  }
  const propNom = [d.bailleur_prenom, d.bailleur_nom].filter(Boolean).join(' ') || 'Propriétaire Mandant';
  doc.font('Helvetica').fontSize(8.5).fillColor(PDF_GRAY)
     .text(`Bailleur : ${propNom} (représenté)`, 55, bY);

  const tableY = partiesY + 115;
  doc.rect(45, tableY, 505, 24).fillColor(PDF_NAVY).fill();
  doc.fillColor('#FFFFFF').fontSize(9.5).font('Helvetica-Bold')
     .text('DÉSIGNATION DES SOMMES ACQUITTÉES', 55, tableY + 7)
     .text('PÉRIODE', 320, tableY + 7)
     .text('MONTANT', 465, tableY + 7, { align: 'right', width: 75 });

  let currentY = tableY + 24;
  const loyerNu = Math.max(Number(d.loyer_mensuel || d.montant_du) - Number(d.charges_bail || 0), 0);
  const charges = Number(d.charges_bail || 0);
  const timbre = 100;
  const totalPaye = Number(d.montant_paye || d.montant_du);

  doc.rect(45, currentY, 505, 22).fillColor('#F8F9FA').fill();
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica').text('Loyer principal d\'habitation', 55, currentY + 6);
  doc.fillColor(PDF_GRAY).fontSize(8.5).text(d.periode, 320, currentY + 6);
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(`${fmtPdfNum(loyerNu)} FCFA`, 440, currentY + 6, { align: 'right', width: 100 });
  currentY += 22;

  if (charges > 0) {
    doc.rect(45, currentY, 505, 22).fillColor('#F8F9FA').fill();
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica').text('Provisions pour charges locatives', 55, currentY + 6);
    doc.fillColor(PDF_GRAY).fontSize(8.5).text(d.periode, 320, currentY + 6);
    doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(`${fmtPdfNum(charges)} FCFA`, 440, currentY + 6, { align: 'right', width: 100 });
    currentY += 22;
  }

  doc.rect(45, currentY, 505, 22).fillColor('#F8F9FA').fill();
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica').text('Droit de timbre de quittance (COCC)', 55, currentY + 6);
  doc.fillColor(PDF_GRAY).fontSize(8.5).text('Légal', 320, currentY + 6);
  doc.fillColor('#1F2937').fontSize(9).font('Helvetica-Bold').text(`${fmtPdfNum(timbre)} FCFA`, 440, currentY + 6, { align: 'right', width: 100 });
  currentY += 22;

  doc.rect(45, currentY, 505, 28).fillColor('#ECFDF5').strokeColor(PDF_PRICE_GREEN).lineWidth(1).fillAndStroke();
  doc.fillColor(PDF_PRICE_GREEN).fontSize(11).font('Helvetica-Bold')
     .text('TOTAL INTÉGRALEMENT ACQUITTÉ', 55, currentY + 8)
     .text(`${fmtPdfNum(totalPaye)} FCFA`, 400, currentY + 8, { align: 'right', width: 140 });

  currentY += 38;
  doc.fillColor(PDF_GRAY).fontSize(8).font('Helvetica')
     .text(`Je soussigné, représentant de l'agence ${d.agence_nom}, mandataire du propriétaire, déclare avoir reçu de Monsieur / Madame ${d.locataire_nom} la somme de ${fmtPdfNum(totalPaye)} Francs CFA en règlement du loyer et des charges pour la période mentionnée ci-dessus.`, 45, currentY, { width: 505, align: 'justify' });

  const stampY = currentY + 40;
  doc.roundedRect(340, stampY, 210, 80, 4).strokeColor(PDF_NAVY).lineWidth(1).stroke();
  doc.fillColor(PDF_NAVY).fontSize(8.5).font('Helvetica-Bold')
     .text("POUR L'AGENCE (MANDATAIRE)", 350, stampY + 8, { align: 'center', width: 190 });
  doc.fillColor(PDF_GRAY).fontSize(8).font('Helvetica')
     .text(cleanPdfText(d.agence_nom), 350, stampY + 24, { align: 'center', width: 190 })
     .text(`Délivré le ${new Date(d.date_paiement || Date.now()).toLocaleDateString('fr-FR')}`, 350, stampY + 38, { align: 'center', width: 190 })
     .text("[ DOCUMENT OFFICIEL CERTIFIÉ ]", 350, stampY + 58, { align: 'center', width: 190 });

  doc.end();
}



// ── GET /api/locatif-immo/mes-locations — Espace Locataire connecté ──
router.get('/mes-locations', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Récupérer le profil utilisateur complet (email et téléphone essentiels pour le rapprochement)
    const { rows: uRows } = await pool.query(
      'SELECT id, email, telephone FROM utilisateurs WHERE id = $1',
      [userId]
    );
    const user = uRows[0] || {};
    const userEmail = (user.email || '').trim().toLowerCase();
    const cleanPh = String(user.telephone || '').replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    // Rapprochement automatique et persistant dans contacts_immo et proprietaires_immo
    if (shortPh && shortPh.length >= 9) {
      await pool.query(
        `UPDATE contacts_immo
         SET utilisateur_id = $1
         WHERE utilisateur_id IS NULL
           AND RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2`,
        [userId, shortPh]
      );
      await pool.query(
        `UPDATE proprietaires_immo
         SET utilisateur_id = $1
         WHERE utilisateur_id IS NULL
           AND RIGHT(REGEXP_REPLACE(telephone, '[^0-9]', '', 'g'), 9) = $2`,
        [userId, shortPh]
      );
    }
    if (userEmail && !userEmail.includes('@whatsapp.nopalou.com')) {
      await pool.query(
        `UPDATE contacts_immo
         SET utilisateur_id = $1
         WHERE utilisateur_id IS NULL
           AND LOWER(TRIM(email)) = $2`,
        [userId, userEmail]
      );
      await pool.query(
        `UPDATE proprietaires_immo
         SET utilisateur_id = $1
         WHERE utilisateur_id IS NULL
           AND LOWER(TRIM(email)) = $2`,
        [userId, userEmail]
      );
    }

    const query = `
      SELECT bx.id AS bail_id, bx.date_debut, bx.date_fin, bx.duree_mois, bx.loyer_mensuel, bx.charges, bx.depot_garantie, bx.jour_echeance, bx.statut AS statut_bail, bx.document_url,
             bx.pieces_jointes, bx.signature_locataire, bx.date_signature_locataire, bx.nom_signataire_locataire, bx.cachet_locataire,
             bx.signature_bailleur, bx.date_signature_bailleur, bx.nom_signataire_bailleur, bx.cachet_bailleur, bx.statut_signature,
             b.id AS bien_id, b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier, b.ville AS bien_ville, b.type_bien, b.photos AS bien_photos,
             a.id AS agence_id, a.nom AS agence_nom, a.slug AS agence_slug, a.telephone AS agence_tel, a.whatsapp AS agence_wa, a.email_contact AS agence_email,
             c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.email AS locataire_email,
             p.nom AS proprietaire_nom, p.prenom AS proprietaire_prenom, p.telephone AS proprietaire_tel,
             CASE
               WHEN COALESCE(bx.proprietaire_id, b.proprietaire_id) IN (
                 SELECT pr.id FROM proprietaires_immo pr
                 WHERE (
                   pr.utilisateur_id = $1
                   OR ($2 != '' AND LOWER(pr.email) = $2)
                   OR ($3 != '' AND RIGHT(REGEXP_REPLACE(pr.telephone, '[^0-9]', '', 'g'), 9) = $3)
                 )
               ) THEN 'bailleur'
               ELSE 'locataire'
             END AS role_vue
      FROM baux_immo bx
      JOIN biens_immo b ON bx.bien_id = b.id
      JOIN agences_immo a ON bx.agence_id = a.id
      JOIN contacts_immo c ON bx.locataire_id = c.id
      LEFT JOIN proprietaires_immo p ON p.id = COALESCE(bx.proprietaire_id, b.proprietaire_id)
      WHERE (
        c.utilisateur_id = $1
        OR ($2 != '' AND LOWER(c.email) = $2)
        OR ($3 != '' AND RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g'), 9) = $3)
        OR (
          COALESCE(bx.proprietaire_id, b.proprietaire_id) IN (
            SELECT pr.id FROM proprietaires_immo pr
            WHERE (
              pr.utilisateur_id = $1
              OR ($2 != '' AND LOWER(pr.email) = $2)
              OR ($3 != '' AND RIGHT(REGEXP_REPLACE(pr.telephone, '[^0-9]', '', 'g'), 9) = $3)
            )
          )
        )
      )
      ORDER BY bx.date_debut DESC
    `;

    const { rows: baux } = await pool.query(query, [userId, userEmail, shortPh]);

    const locations = [];
    for (const bail of baux) {
      const { rows: echeances } = await pool.query(
        `SELECT id, periode, date_echeance, montant_du, montant_paye, date_paiement, statut, mode_paiement, quittance_url
         FROM loyers_echeances
         WHERE bail_id = $1
         ORDER BY date_echeance DESC`,
        [bail.bail_id]
      );

      locations.push({
        bail_id: bail.bail_id,
        role_vue: bail.role_vue,
        date_debut: bail.date_debut,
        date_fin: bail.date_fin,
        duree_mois: bail.duree_mois,
        loyer_mensuel: Number(bail.loyer_mensuel),
        charges: Number(bail.charges || 0),
        depot_garantie: Number(bail.depot_garantie || 0),
        jour_echeance: bail.jour_echeance,
        statut_bail: bail.statut_bail,
        pieces_jointes: bail.pieces_jointes || [],
        signature_locataire: bail.signature_locataire,
        cachet_locataire: bail.cachet_locataire,
        date_signature_locataire: bail.date_signature_locataire,
        nom_signataire_locataire: bail.nom_signataire_locataire,
        signature_bailleur: bail.signature_bailleur,
        cachet_bailleur: bail.cachet_bailleur,
        date_signature_bailleur: bail.date_signature_bailleur,
        nom_signataire_bailleur: bail.nom_signataire_bailleur,
        statut_signature: bail.statut_signature || 'en_attente',
        contrat_url: `/api/locatif-immo/mes-locations/bail/${bail.bail_id}.pdf`,
        document_url: bail.document_url || null,
        bien: {
          id: bail.bien_id,
          titre: bail.bien_titre,
          adresse: bail.bien_adresse,
          quartier: bail.bien_quartier,
          ville: bail.bien_ville,
          type_bien: bail.type_bien,
          photos: bail.bien_photos,
        },
        agence: {
          id: bail.agence_id,
          nom: bail.agence_nom,
          slug: bail.agence_slug,
          telephone: bail.agence_tel,
          whatsapp: bail.agence_wa,
          email: bail.agence_email,
        },
        locataire: {
          nom: bail.locataire_nom,
          prenom: bail.locataire_prenom,
          telephone: bail.locataire_tel,
          email: bail.locataire_email,
        },
        proprietaire: {
          nom: bail.proprietaire_nom,
          prenom: bail.proprietaire_prenom,
          telephone: bail.proprietaire_tel,
        },
        echeances: echeances.map(e => ({
          id: e.id,
          periode: e.periode,
          date_echeance: e.date_echeance,
          montant_du: Number(e.montant_du),
          montant_paye: Number(e.montant_paye),
          date_paiement: e.date_paiement,
          statut: e.statut,
          mode_paiement: e.mode_paiement,
          quittance_url: e.statut === 'paye' ? `/api/locatif-immo/mes-locations/quittance/${e.id}.pdf` : null,
        })),
      });
    }

    res.json({ success: true, locations });
  } catch (err) {
    console.error('[GET /api/locatif-immo/mes-locations]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des locations' });
  }
});

// ── GET /api/locatif-immo/mes-locations/quittance/:loyerId.pdf — Téléchargement Quittance Locataire & Bailleur ──
router.get('/mes-locations/quittance/:loyerId.pdf', verifierToken, async (req, res) => {
  try {
    const { loyerId } = req.params;
    const userId = req.user.userId || req.user.id;

    const { rows: uRows } = await pool.query(
      'SELECT id, email, telephone FROM utilisateurs WHERE id = $1',
      [userId]
    );
    const user = uRows[0] || {};
    const userEmail = (user.email || '').trim().toLowerCase();
    const cleanPh = String(user.telephone || '').replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows } = await pool.query(
      `SELECT le.*,
              bx.id AS bail_id, bx.loyer_mensuel, bx.charges AS charges_bail, bx.depot_garantie,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier, b.ville AS bien_ville, b.reference AS bien_reference,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.email AS locataire_email,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON COALESCE(bx.proprietaire_id, b.proprietaire_id) = p.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1
         AND (
           c.utilisateur_id = $2
           OR ($3 != '' AND LOWER(c.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g'), 9) = $4)
           OR p.utilisateur_id = $2
           OR ($3 != '' AND LOWER(p.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g'), 9) = $4)
           OR EXISTS (SELECT 1 FROM agence_membres am WHERE am.agence_id = a.id AND am.utilisateur_id = $2)
         )`,
      [loyerId, userId, userEmail, shortPh]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quittance de loyer introuvable ou accès non autorisé' });
    }

    const d = rows[0];
    genererPdfQuittanceStream(res, d);
  } catch (err) {
    console.error('[GET /api/locatif-immo/mes-locations/quittance/:loyerId.pdf]', err.message);
    res.status(500).json({ success: false, error: 'Erreur génération quittance' });
  }
});

// ── GET /api/locatif-immo/mes-locations/bail/:bailId.pdf — Téléchargement Contrat de Bail Locataire & Propriétaire ──
router.get('/mes-locations/bail/:bailId.pdf', verifierToken, async (req, res) => {
  try {
    const { bailId } = req.params;
    const userId = req.user.userId || req.user.id;

    const { rows: uRows } = await pool.query(
      'SELECT id, email, telephone FROM utilisateurs WHERE id = $1',
      [userId]
    );
    const user = uRows[0] || {};
    const userEmail = (user.email || '').trim().toLowerCase();
    const cleanPh = String(user.telephone || '').replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows } = await pool.query(
      `SELECT bx.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.type_bien, b.surface_m2, b.nb_pieces, b.nb_chambres, b.reference AS bien_ref,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              c.email AS locataire_email, c.profession AS locataire_profession,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON COALESCE(bx.proprietaire_id, b.proprietaire_id) = p.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE bx.id = $1
         AND (
           c.utilisateur_id = $2
           OR ($3 != '' AND LOWER(c.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g'), 9) = $4)
           OR p.utilisateur_id = $2
           OR ($3 != '' AND LOWER(p.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(p.telephone, '[^0-9]', '', 'g'), 9) = $4)
           OR EXISTS (SELECT 1 FROM agence_membres am WHERE am.agence_id = a.id AND am.utilisateur_id = $2)
         )`,
      [bailId, userId, userEmail, shortPh]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable ou accès non autorisé' });
    }

    const b = rows[0];
    genererPdfContratBailStream(res, b);
  } catch (err) {
    console.error('[GET /api/locatif-immo/mes-locations/bail/:bailId.pdf]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du téléchargement du contrat de bail' });
  }
});

// ── POST /api/locatif-immo/mes-locations/bail/:bailId/signer — Signature électronique locataire connecté ──
router.post('/mes-locations/bail/:bailId/signer', verifierToken, async (req, res) => {
  try {
    const { bailId } = req.params;
    const { signature, cachet, nom_signataire } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!signature) {
      return res.status(400).json({ success: false, error: 'Signature requise' });
    }

    const { rows: uRows } = await pool.query('SELECT id, email, telephone, prenom, nom FROM utilisateurs WHERE id = $1', [userId]);
    const user = uRows[0] || {};
    const userEmail = (user.email || '').trim().toLowerCase();
    const cleanPh = String(user.telephone || '').replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows: check } = await pool.query(
      `SELECT bx.id, bx.locataire_id, c.prenom, c.nom
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.id = $1
         AND (
           c.utilisateur_id = $2
           OR ($3 != '' AND LOWER(c.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g'), 9) = $4)
         )`,
      [bailId, userId, userEmail, shortPh]
    );

    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Bail introuvable ou vous n\'êtes pas le preneur désigné' });
    }

    const locName = nom_signataire || `${check[0].prenom || ''} ${check[0].nom || ''}`.trim() || `${user.prenom || ''} ${user.nom || ''}`.trim() || 'Le Preneur';

    const { rows: updated } = await pool.query(
      `UPDATE baux_immo
       SET signature_locataire = $1,
           cachet_locataire = COALESCE($2, cachet_locataire),
           date_signature_locataire = NOW(),
           nom_signataire_locataire = $3,
           statut_signature = CASE WHEN signature_bailleur IS NOT NULL THEN 'valide' ELSE 'signe_locataire' END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [signature, cachet || null, locName, bailId]
    );

    res.json({
      success: true,
      message: 'Contrat de bail signé électroniquement avec succès.',
      bail: updated[0]
    });
  } catch (err) {
    console.error('[POST /mes-locations/bail/:bailId/signer]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la signature du contrat' });
  }
});

// ── POST /api/locatif-immo/mes-locations/bail/:bailId/documents — Dépôt de pièce justificative (CNI...) locataire connecté ──
router.post('/mes-locations/bail/:bailId/documents', verifierToken, uploadDoc.single('file'), async (req, res) => {
  try {
    const { bailId } = req.params;
    const { type_piece = 'autre', label } = req.body;
    const userId = req.user.userId || req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Fichier requis' });
    }

    const { rows: uRows } = await pool.query('SELECT id, email, telephone FROM utilisateurs WHERE id = $1', [userId]);
    const user = uRows[0] || {};
    const userEmail = (user.email || '').trim().toLowerCase();
    const cleanPh = String(user.telephone || '').replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows: check } = await pool.query(
      `SELECT bx.id, bx.locataire_id, bx.pieces_jointes
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.id = $1
         AND (
           c.utilisateur_id = $2
           OR ($3 != '' AND LOWER(c.email) = $3)
           OR ($4 != '' AND RIGHT(REGEXP_REPLACE(c.telephone, '[^0-9]', '', 'g'), 9) = $4)
         )`,
      [bailId, userId, userEmail, shortPh]
    );

    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Bail introuvable' });
    }

    const secureUrl = await uploadDocumentBuffer(file.buffer, 'documents_locatif', file.originalname);

    const docItem = {
      id: require('crypto').randomUUID(),
      type_piece,
      label: label || type_piece,
      nom_fichier: file.originalname,
      url: secureUrl,
      taille: file.size,
      mimetype: file.mimetype,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'locataire',
      statut: 'en_attente',
      motif_rejet: null
    };

    const nextPieces = [...(check[0].pieces_jointes || []), docItem];

    const { rows: updated } = await pool.query(
      'UPDATE baux_immo SET pieces_jointes = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING pieces_jointes',
      [JSON.stringify(nextPieces), bailId]
    );

    if (check[0].locataire_id) {
      await pool.query(
        'UPDATE contacts_immo SET pieces_jointes = COALESCE(pieces_jointes, \'[]\'::jsonb) || $1::jsonb WHERE id = $2',
        [JSON.stringify([docItem]), check[0].locataire_id]
      );
    }

    res.json({
      success: true,
      message: 'Document versé avec succès. En attente de validation par l\'agence.',
      document: docItem,
      pieces_jointes: updated[0].pieces_jointes
    });
  } catch (err) {
    console.error('[POST /mes-locations/bail/:bailId/documents]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du versement du document' });
  }
});

// ── GET /api/locatif-immo/public/echeance/:echeanceId — Détails publics pour paiement de loyer ──
router.get('/public/echeance/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const { rows } = await pool.query(
      `SELECT le.id, le.periode, le.date_echeance, le.montant_du, le.montant_paye, le.montant_restant,
              le.statut, le.quittance_url,
              ba.id AS bail_id, ba.loyer_mensuel, ba.charges, ba.conditions AS bail_conditions,
              ba.depot_garantie, ba.jour_echeance, ba.date_debut, ba.date_fin,
              ba.pieces_jointes, ba.signature_locataire, ba.date_signature_locataire, ba.nom_signataire_locataire, ba.cachet_locataire,
              ba.signature_bailleur, ba.date_signature_bailleur, ba.nom_signataire_bailleur, ba.cachet_bailleur, ba.statut_signature,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier, b.ville AS bien_ville,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.whatsapp AS agence_wa, a.slug AS agence_slug, a.logo_url AS agence_logo
       FROM loyers_echeances le
       JOIN baux_immo ba ON le.bail_id = ba.id
       JOIN biens_immo b ON ba.bien_id = b.id
       JOIN contacts_immo c ON ba.locataire_id = c.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1`,
      [echeanceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance de loyer introuvable' });
    }

    const ech = rows[0];
    res.json({
      success: true,
      echeance: {
        id: ech.id,
        periode: ech.periode,
        date_echeance: ech.date_echeance,
        montant_du: Number(ech.montant_du || ech.loyer_mensuel),
        montant_paye: Number(ech.montant_paye || 0),
        montant_restant: Number(ech.montant_restant || 0),
        statut: ech.statut,
        quittance_url: ech.statut === 'paye' ? `/api/locatif-immo/public/quittance/${ech.id}.pdf` : null,
        loyer_mensuel: Number(ech.loyer_mensuel),
        charges: Number(ech.charges || 0),
        bien: {
          titre: ech.bien_titre,
          adresse: ech.bien_adresse,
          quartier: ech.bien_quartier,
          ville: ech.bien_ville,
        },
        locataire: {
          nom: ech.locataire_nom,
          prenom: ech.locataire_prenom,
          telephone: ech.locataire_tel,
        },
        agence: {
          nom: ech.agence_nom,
          telephone: ech.agence_tel,
          whatsapp: ech.agence_wa,
          slug: ech.agence_slug,
          logo_url: ech.agence_logo,
        },
        bail: {
          id: ech.bail_id,
          pdf_url: `/api/locatif-immo/public/echeance/${ech.id}/bail.pdf`,
          conditions: ech.bail_conditions,
          depot_garantie: Number(ech.depot_garantie || 0),
          jour_echeance: ech.jour_echeance,
          date_debut: ech.date_debut,
          date_fin: ech.date_fin,
          pieces_jointes: ech.pieces_jointes || [],
          signature_locataire: ech.signature_locataire,
          cachet_locataire: ech.cachet_locataire,
          date_signature_locataire: ech.date_signature_locataire,
          signature_bailleur: ech.signature_bailleur,
          cachet_bailleur: ech.cachet_bailleur,
          date_signature_bailleur: ech.date_signature_bailleur,
          statut_signature: ech.statut_signature || 'en_attente',
        }
      }
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/public/echeance/:echeanceId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des détails de l\'échéance' });
  }
});

// ── GET /api/locatif-immo/public/echeance/:echeanceId/bail.pdf — Téléchargement direct Contrat de Bail public via échéance ──
router.get('/public/echeance/:echeanceId/bail.pdf', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const { rows } = await pool.query(
      `SELECT bx.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.type_bien, b.surface_m2, b.nb_pieces, b.nb_chambres, b.reference AS bien_ref,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              c.email AS locataire_email, c.profession AS locataire_profession,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON COALESCE(bx.proprietaire_id, b.proprietaire_id) = p.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE le.id = $1`,
      [echeanceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable pour cette échéance' });
    }

    const b = rows[0];
    genererPdfContratBailStream(res, b);
  } catch (err) {
    console.error('[GET /api/locatif-immo/public/echeance/:echeanceId/bail.pdf]', err.message);
    res.status(500).json({ success: false, error: 'Erreur génération contrat de bail' });
  }
});

// ── GET /api/locatif-immo/public/bail/:bailId.pdf — Téléchargement direct Contrat de Bail avec vérification téléphone/token ──
router.get('/public/bail/:bailId.pdf', async (req, res) => {
  try {
    const { bailId } = req.params;
    const { tel } = req.query;
    const cleanPh = tel ? String(tel).replace(/\D/g, '') : '';
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows } = await pool.query(
      `SELECT bx.*,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.type_bien, b.surface_m2, b.nb_pieces, b.nb_chambres, b.reference AS bien_ref,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel,
              c.email AS locataire_email, c.profession AS locataire_profession,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              p.adresse AS bailleur_adresse,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM baux_immo bx
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON COALESCE(bx.proprietaire_id, b.proprietaire_id) = p.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE bx.id = $1
         AND (
           $2 = ''
           OR RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $2
           OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $2
           OR RIGHT(REGEXP_REPLACE(COALESCE(p.telephone, ''), '[^0-9]', '', 'g'), 9) = $2
         )`,
      [bailId, shortPh]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contrat de bail introuvable ou accès non autorisé' });
    }

    const b = rows[0];
    genererPdfContratBailStream(res, b);
  } catch (err) {
    console.error('[GET /api/locatif-immo/public/bail/:bailId.pdf]', err.message);
    res.status(500).json({ success: false, error: 'Erreur génération contrat de bail' });
  }
});

// ── POST /api/locatif-immo/public/bail/:bailId/signer — Signature électronique sans compte (par téléphone) ──
router.post('/public/bail/:bailId/signer', async (req, res) => {
  try {
    const { bailId } = req.params;
    const { tel, signature, cachet, nom_signataire } = req.body;

    if (!tel || !signature) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone et signature requis' });
    }

    const cleanPh = String(tel).replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows: check } = await pool.query(
      `SELECT bx.id, bx.locataire_id, c.prenom, c.nom
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.id = $1
         AND (
           RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $2
           OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $2
         )`,
      [bailId, shortPh]
    );

    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Bail introuvable ou numéro de téléphone non correspondant' });
    }

    const locName = nom_signataire || `${check[0].prenom || ''} ${check[0].nom || ''}`.trim() || 'Le Preneur';

    const { rows: updated } = await pool.query(
      `UPDATE baux_immo
       SET signature_locataire = $1,
           cachet_locataire = COALESCE($2, cachet_locataire),
           date_signature_locataire = NOW(),
           nom_signataire_locataire = $3,
           statut_signature = CASE WHEN signature_bailleur IS NOT NULL THEN 'valide' ELSE 'signe_locataire' END,
           updated_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [signature, cachet || null, locName, bailId]
    );

    res.json({
      success: true,
      message: 'Contrat de bail signé électroniquement avec succès.',
      bail: updated[0]
    });
  } catch (err) {
    console.error('[POST /public/bail/:bailId/signer]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la signature du contrat' });
  }
});

// ── POST /api/locatif-immo/public/bail/:bailId/documents — Dépôt de pièce justificative (CNI...) sans compte ──
router.post('/public/bail/:bailId/documents', uploadDoc.single('file'), async (req, res) => {
  try {
    const { bailId } = req.params;
    const { tel, type_piece = 'autre', label } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, error: 'Fichier requis' });
    }
    if (!tel) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone requis' });
    }

    const cleanPh = String(tel).replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const { rows: check } = await pool.query(
      `SELECT bx.id, bx.locataire_id, bx.pieces_jointes
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.id = $1
         AND (
           RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $2
           OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $2
         )`,
      [bailId, shortPh]
    );

    if (check.length === 0) {
      return res.status(404).json({ success: false, error: 'Bail introuvable ou numéro de téléphone non correspondant' });
    }

    const secureUrl = await uploadDocumentBuffer(file.buffer, 'documents_locatif', file.originalname);

    const docItem = {
      id: require('crypto').randomUUID(),
      type_piece,
      label: label || type_piece,
      nom_fichier: file.originalname,
      url: secureUrl,
      taille: file.size,
      mimetype: file.mimetype,
      uploaded_at: new Date().toISOString(),
      uploaded_by: 'locataire',
      statut: 'en_attente',
      motif_rejet: null
    };

    const nextPieces = [...(check[0].pieces_jointes || []), docItem];

    const { rows: updated } = await pool.query(
      'UPDATE baux_immo SET pieces_jointes = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING pieces_jointes',
      [JSON.stringify(nextPieces), bailId]
    );

    if (check[0].locataire_id) {
      await pool.query(
        'UPDATE contacts_immo SET pieces_jointes = COALESCE(pieces_jointes, \'[]\'::jsonb) || $1::jsonb WHERE id = $2',
        [JSON.stringify([docItem]), check[0].locataire_id]
      );
    }

    res.json({
      success: true,
      message: 'Document versé avec succès. En attente de vérification par l\'agence.',
      document: docItem,
      pieces_jointes: updated[0].pieces_jointes
    });
  } catch (err) {
    console.error('[POST /public/bail/:bailId/documents]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du versement du document' });
  }
});

// ── POST /api/locatif-immo/public/demander-otp — Envoi d'un code OTP WhatsApp de sécurisation portail locataire ──
router.post('/public/demander-otp', async (req, res) => {
  try {
    const { tel } = req.body;
    if (!tel) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone requis.' });
    }

    const cleanPh = String(tel).replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    if (shortPh.length < 8) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone incomplet ou invalide.' });
    }

    // 1. Vérifier si un locataire avec bail existe pour ce numéro
    const { rows: contactRows } = await pool.query(
      `SELECT c.id, c.prenom, c.nom, c.telephone, c.whatsapp
       FROM contacts_immo c
       WHERE (
         RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
         OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $1
       )
       LIMIT 1`,
      [shortPh]
    );

    if (contactRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun contrat de location associé à ce numéro. Veuillez vérifier votre numéro ou contacter votre agence.'
      });
    }

    const contact = contactRows[0];
    const targetPhone = contact.whatsapp || contact.telephone || tel;
    const normPhone = normalisePhone(targetPhone);

    // 2. Générer le code OTP
    const code = await genererOtpPhone(normPhone, 'locataire_portal');
    console.log(`[LOCATIF OTP] Code généré pour ${normPhone.slice(0, 4)}**** (${contact.prenom || ''} ${contact.nom || ''})`);

    // 3. Envoyer par WhatsApp
    try {
      await sendWhatsAppTemplate(normPhone, 'nopalou_auth_otp', [
        {
          type: 'body',
          parameters: [{ type: 'text', text: code }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: code }],
        },
      ]);
    } catch {
      try {
        await sendWhatsAppText(
          normPhone,
          `🔐 *Nopalou Immo — Code de Sécurité*\n\nVoici votre code pour accéder à votre contrat de bail et quittances :\n👉 *${code}* 👈\n\n⏱️ Expire dans 10 minutes.\n⚠️ Ne partagez ce code avec personne.`
        );
      } catch (textErr) {
        console.warn('[LOCATIF OTP SEND ERR]', textErr.message);
      }
    }

    const telAffiche = normPhone.length > 6 
      ? `${normPhone.slice(0, 5)} *** ** ${normPhone.slice(-2)}`
      : normPhone;

    res.json({
      success: true,
      message: `Code de sécurité envoyé par WhatsApp au ${telAffiche}.`,
      telephoneMasque: telAffiche,
      telephone: normPhone,
      dev_code: process.env.NODE_ENV !== 'production' ? code : undefined
    });
  } catch (err) {
    console.error('[POST /public/demander-otp]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi du code de sécurité' });
  }
});

// ── POST /api/locatif-immo/public/verifier-otp — Validation de l'OTP et déverrouillage de la session locataire ──
router.post('/public/verifier-otp', async (req, res) => {
  try {
    const { tel, code } = req.body;
    if (!tel || !code) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone et code de sécurité requis.' });
    }

    const normPhone = normalisePhone(tel);
    const cleanPh = String(tel).replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    const verif = await verifierOtpPhone(normPhone, 'locataire_portal', code);
    if (!verif.valide) {
      return res.status(verif.tropDeTentatives ? 429 : 400).json({
        success: false,
        error: verif.error || 'Code de sécurité incorrect ou expiré.'
      });
    }

    // 1. Trouver les baux associés à ce locataire
    const { rows: baux } = await pool.query(
      `SELECT bx.id, bx.loyer_mensuel, bx.charges, bx.depot_garantie, bx.jour_echeance,
              bx.date_debut, bx.date_fin, bx.statut, bx.conditions,
              bx.pieces_jointes, bx.signature_locataire, bx.date_signature_locataire, bx.nom_signataire_locataire, bx.cachet_locataire,
              bx.signature_bailleur, bx.date_signature_bailleur, bx.nom_signataire_bailleur, bx.cachet_bailleur, bx.statut_signature,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.photos AS bien_photos, b.reference AS bien_ref,
              c.id AS contact_id, c.nom AS locataire_nom, c.prenom AS locataire_prenom,
              c.telephone AS locataire_tel, c.whatsapp AS locataire_wa, c.email AS locataire_email,
              c.utilisateur_id AS contact_utilisateur_id,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.whatsapp AS agence_wa,
              a.slug AS agence_slug, a.logo_url AS agence_logo
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE (
         RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
         OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $1
       )
       ORDER BY bx.created_at DESC`,
      [shortPh]
    );

    if (baux.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun contrat de location actif ou historique trouvé pour ce numéro de téléphone.'
      });
    }

    const bailIds = baux.map(b => b.id);
    const { rows: echeances } = await pool.query(
      `SELECT id, bail_id, periode, date_echeance, montant_du, montant_paye, montant_restant,
              statut, quittance_url, date_paiement, mode_paiement
       FROM loyers_echeances
       WHERE bail_id = ANY($1)
       ORDER BY date_echeance ASC`,
      [bailIds]
    );

    // 2. Provisioning / Liaison compte utilisateur pour session sécurisée JWT
    const contact = baux[0];
    const withPlus = '+' + normPhone;
    const candidateEmail = contact.locataire_email && !contact.locataire_email.includes('example.com')
      ? contact.locataire_email.trim().toLowerCase()
      : `${shortPh}@whatsapp.nopalou.com`;

    let user = null;

    // Si le contact est déjà lié à un utilisateur existant
    if (contact.contact_utilisateur_id) {
      const { rows: uLinked } = await pool.query(
        'SELECT id, nom, email, telephone FROM utilisateurs WHERE id = $1',
        [contact.contact_utilisateur_id]
      );
      if (uLinked.length > 0) {
        user = uLinked[0];
      }
    }

    // Sinon recherche par téléphone ou par email
    if (!user) {
      const { rows: existingUsers } = await pool.query(
        `SELECT id, nom, email, telephone FROM utilisateurs
         WHERE telephone = $1 OR telephone = $2 OR telephone = $3 OR email = $4 LIMIT 1`,
        [normPhone, withPlus, shortPh, candidateEmail]
      );
      if (existingUsers.length > 0) {
        user = existingUsers[0];
      }
    }

    // Création atomique sans colonne 'role' (qui n'existe pas dans la table utilisateurs)
    if (!user) {
      const userNom = [contact.locataire_prenom, contact.locataire_nom].filter(Boolean).join(' ') || 'Locataire Nopalou';
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPassword, 12);
      try {
        const { rows: newUserRows } = await pool.query(
          `INSERT INTO utilisateurs (nom, email, mot_de_passe_hash, telephone, email_verifie)
           VALUES ($1, $2, $3, $4, true)
           ON CONFLICT (telephone) DO UPDATE SET nom = EXCLUDED.nom
           RETURNING id, nom, email, telephone`,
          [userNom, candidateEmail, hash, normPhone]
        );
        user = newUserRows[0];
      } catch (insertErr) {
        // En cas de conflit sur l'email, récupérer le compte existant associé à cet email
        const { rows: fallbackRows } = await pool.query(
          'SELECT id, nom, email, telephone FROM utilisateurs WHERE email = $1 LIMIT 1',
          [candidateEmail]
        );
        if (fallbackRows.length > 0) {
          user = fallbackRows[0];
        } else {
          throw insertErr;
        }
      }
    }

    if (!user) {
      const { rows: recheck } = await pool.query(
        'SELECT id, nom, email, telephone FROM utilisateurs WHERE telephone = $1 OR telephone = $2 LIMIT 1',
        [normPhone, shortPh]
      );
      user = recheck[0];
    }

    if (user && contact.contact_id) {
      await pool.query(
        'UPDATE contacts_immo SET utilisateur_id = $1 WHERE id = $2 AND (utilisateur_id IS NULL OR utilisateur_id != $1)',
        [user.id, contact.contact_id]
      );
    }

    // 3. Émission du jeton d'authentification officiel JWT
    const token = jwt.sign(
      { userId: user.id, role: 'locataire', tel: shortPh, type: 'locataire_portal' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const bauxAvecEcheances = baux.map(b => {
      const eches = echeances.filter(e => e.bail_id === b.id);
      return {
        id: b.id,
        bien_titre: b.bien_titre,
        bien_adresse: b.bien_adresse,
        bien_quartier: b.bien_quartier,
        bien_ville: b.bien_ville,
        bien_photos: b.bien_photos || [],
        bien_ref: b.bien_ref,
        loyer_mensuel: Number(b.loyer_mensuel),
        charges: Number(b.charges || 0),
        depot_garantie: Number(b.depot_garantie || 0),
        jour_echeance: b.jour_echeance,
        date_debut: b.date_debut,
        date_fin: b.date_fin,
        statut: b.statut,
        conditions: b.conditions,
        pieces_jointes: b.pieces_jointes || [],
        signature_locataire: b.signature_locataire,
        cachet_locataire: b.cachet_locataire,
        date_signature_locataire: b.date_signature_locataire,
        nom_signataire_locataire: b.nom_signataire_locataire,
        signature_bailleur: b.signature_bailleur,
        cachet_bailleur: b.cachet_bailleur,
        date_signature_bailleur: b.date_signature_bailleur,
        nom_signataire_bailleur: b.nom_signataire_bailleur,
        statut_signature: b.statut_signature || 'en_attente',
        contrat_pdf_url: `/api/locatif-immo/mes-locations/bail/${b.id}.pdf?token=${encodeURIComponent(token)}`,
        agence: {
          nom: b.agence_nom,
          telephone: b.agence_tel,
          whatsapp: b.agence_wa,
          slug: b.agence_slug,
          logo_url: b.agence_logo
        },
        echeances: eches.map(ech => ({
          id: ech.id,
          periode: ech.periode,
          date_echeance: ech.date_echeance,
          montant_du: Number(ech.montant_du),
          montant_paye: Number(ech.montant_paye || 0),
          montant_restant: Number(ech.montant_restant || 0),
          statut: ech.statut,
          quittance_url: ech.statut === 'paye' ? `/api/locatif-immo/mes-locations/quittance/${ech.id}.pdf?token=${encodeURIComponent(token)}` : null,
          lien_paiement: `/payer-loyer/${ech.id}`
        }))
      };
    });

    res.json({
      success: true,
      message: 'Authentification réussie. Session sécurisée déverrouillée.',
      token,
      user,
      locataire: {
        nom: contact.locataire_nom,
        prenom: contact.locataire_prenom,
        telephone: contact.locataire_tel,
        whatsapp: contact.locataire_wa
      },
      baux: bauxAvecEcheances
    });
  } catch (err) {
    console.error('[POST /public/verifier-otp]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la validation du code' });
  }
});

// ── GET /api/locatif-immo/public/locataire-lookup — Consultation portail locataire par téléphone ──
router.get('/public/locataire-lookup', async (req, res) => {
  try {
    const { tel } = req.query;
    if (!tel) {
      return res.status(400).json({ success: false, error: 'Veuillez renseigner un numéro de téléphone' });
    }

    const cleanPh = String(tel).replace(/\D/g, '');
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;

    if (shortPh.length < 8) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone incomplet' });
    }

    const { rows: baux } = await pool.query(
      `SELECT bx.id, bx.loyer_mensuel, bx.charges, bx.depot_garantie, bx.jour_echeance,
              bx.date_debut, bx.date_fin, bx.statut, bx.conditions,
              bx.pieces_jointes, bx.signature_locataire, bx.date_signature_locataire, bx.nom_signataire_locataire, bx.cachet_locataire,
              bx.signature_bailleur, bx.date_signature_bailleur, bx.nom_signataire_bailleur, bx.cachet_bailleur, bx.statut_signature,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier,
              b.ville AS bien_ville, b.photos AS bien_photos, b.reference AS bien_ref,
              c.id AS contact_id, c.nom AS locataire_nom, c.prenom AS locataire_prenom,
              c.telephone AS locataire_tel, c.whatsapp AS locataire_wa,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.whatsapp AS agence_wa,
              a.slug AS agence_slug, a.logo_url AS agence_logo
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN agences_immo a ON bx.agence_id = a.id
       WHERE (
         RIGHT(REGEXP_REPLACE(COALESCE(c.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
         OR RIGHT(REGEXP_REPLACE(COALESCE(c.whatsapp, ''), '[^0-9]', '', 'g'), 9) = $1
       )
       ORDER BY bx.created_at DESC`,
      [shortPh]
    );

    if (baux.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Aucun contrat de location actif ou historique trouvé pour ce numéro de téléphone.'
      });
    }

    const bailIds = baux.map(b => b.id);
    const { rows: echeances } = await pool.query(
      `SELECT id, bail_id, periode, date_echeance, montant_du, montant_paye, montant_restant,
              statut, quittance_url, date_paiement, mode_paiement
       FROM loyers_echeances
       WHERE bail_id = ANY($1)
       ORDER BY date_echeance ASC`,
      [bailIds]
    );

    const bauxAvecEcheances = baux.map(b => {
      const eches = echeances.filter(e => e.bail_id === b.id);
      return {
        id: b.id,
        bien_titre: b.bien_titre,
        bien_adresse: b.bien_adresse,
        bien_quartier: b.bien_quartier,
        bien_ville: b.bien_ville,
        bien_photos: b.bien_photos || [],
        bien_ref: b.bien_ref,
        loyer_mensuel: Number(b.loyer_mensuel),
        charges: Number(b.charges || 0),
        depot_garantie: Number(b.depot_garantie || 0),
        jour_echeance: b.jour_echeance,
        date_debut: b.date_debut,
        date_fin: b.date_fin,
        statut: b.statut,
        conditions: b.conditions,
        pieces_jointes: b.pieces_jointes || [],
        signature_locataire: b.signature_locataire,
        cachet_locataire: b.cachet_locataire,
        date_signature_locataire: b.date_signature_locataire,
        nom_signataire_locataire: b.nom_signataire_locataire,
        signature_bailleur: b.signature_bailleur,
        cachet_bailleur: b.cachet_bailleur,
        date_signature_bailleur: b.date_signature_bailleur,
        nom_signataire_bailleur: b.nom_signataire_bailleur,
        statut_signature: b.statut_signature || 'en_attente',
        contrat_pdf_url: `/api/locatif-immo/public/bail/${b.id}.pdf?tel=${encodeURIComponent(shortPh)}`,
        agence: {
          nom: b.agence_nom,
          telephone: b.agence_tel,
          whatsapp: b.agence_wa,
          slug: b.agence_slug,
          logo_url: b.agence_logo
        },
        echeances: eches.map(ech => ({
          id: ech.id,
          periode: ech.periode,
          date_echeance: ech.date_echeance,
          montant_du: Number(ech.montant_du),
          montant_paye: Number(ech.montant_paye || 0),
          montant_restant: Number(ech.montant_restant || 0),
          statut: ech.statut,
          quittance_url: ech.statut === 'paye' ? `/api/locatif-immo/public/quittance/${ech.id}.pdf` : null,
          lien_paiement: `/payer-loyer/${ech.id}`
        }))
      };
    });

    res.json({
      success: true,
      locataire: {
        nom: baux[0].locataire_nom,
        prenom: baux[0].locataire_prenom,
        telephone: baux[0].locataire_tel,
        whatsapp: baux[0].locataire_wa
      },
      baux: bauxAvecEcheances
    });
  } catch (err) {
    console.error('[GET /api/locatif-immo/public/locataire-lookup]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la recherche des baux du locataire' });
  }
});

// ── GET /api/locatif-immo/public/quittance/:loyerId.pdf — Téléchargement Quittance public certifié ──
router.get('/public/quittance/:loyerId.pdf', async (req, res) => {
  try {
    const { loyerId } = req.params;

    const { rows } = await pool.query(
      `SELECT le.*,
              bx.id AS bail_id, bx.loyer_mensuel, bx.charges AS charges_bail, bx.depot_garantie,
              b.titre AS bien_titre, b.adresse AS bien_adresse, b.quartier AS bien_quartier, b.ville AS bien_ville, b.reference AS bien_reference,
              c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel, c.email AS locataire_email,
              p.nom AS bailleur_nom, p.prenom AS bailleur_prenom, p.telephone AS bailleur_tel,
              a.nom AS agence_nom, a.telephone AS agence_tel, a.email_contact AS agence_email,
              a.adresse AS agence_adresse, a.ville AS agence_ville, a.numero_agrement
       FROM loyers_echeances le
       JOIN baux_immo bx ON le.bail_id = bx.id
       JOIN biens_immo b ON bx.bien_id = b.id
       JOIN contacts_immo c ON bx.locataire_id = c.id
       LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
       JOIN agences_immo a ON le.agence_id = a.id
       WHERE le.id = $1 AND le.statut = 'paye'`,
      [loyerId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Quittance introuvable ou loyer non acquitté' });
    }

    const d = rows[0];
    genererPdfQuittanceStream(res, d);
  } catch (err) {
    console.error('[GET /api/locatif-immo/public/quittance/:loyerId.pdf]', err.message);
    res.status(500).json({ success: false, error: 'Erreur génération quittance' });
  }
});

// ── POST /api/locatif-immo/public/payer-loyer/:echeanceId — Paiement 1-clic Wave / Déclaration ──
router.post('/public/payer-loyer/:echeanceId', async (req, res) => {
  try {
    const { echeanceId } = req.params;
    const { methode_paiement = 'Wave', reference_paiement, notes } = req.body;

    const { rows: echRows } = await pool.query(
      `SELECT le.*, ba.agence_id, ba.bien_id, ba.locataire_id
       FROM loyers_echeances le
       JOIN baux_immo ba ON le.bail_id = ba.id
       WHERE le.id = $1`,
      [echeanceId]
    );

    if (echRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Échéance de loyer introuvable' });
    }

    const ech = echRows[0];
    if (ech.statut === 'paye') {
      return res.json({
        success: true,
        message: 'Loyer déjà acquitté',
        quittance_url: `/api/locatif-immo/mes-locations/quittance/${ech.id}.pdf`
      });
    }

    const montantPaye = Number(ech.montant_du);
    const methodeLower = String(methode_paiement).toLowerCase();

    // 1. Paiement en ligne Wave direct avec validation par webhook signé
    if (methodeLower === 'wave') {
      try {
        const clientRef = `loyer_${echeanceId}_${Date.now()}`;
        const session = await wave.createCheckoutSession({
          amount:           montantPaye,
          currency:         'XOF',
          success_url:      `${process.env.FRONTEND_URL}/payer-loyer/${echeanceId}?statut=succes`,
          error_url:        `${process.env.FRONTEND_URL}/payer-loyer/${echeanceId}?statut=erreur`,
          client_reference: clientRef,
        });

        return res.json({
          success: true,
          en_ligne: true,
          wave_url: session.wave_url,
          session_id: session.session_id,
          message: 'Session de paiement Wave initialisée'
        });
      } catch (waveErr) {
        console.error('[Wave Payer Loyer Init Err]:', waveErr.message);
        // Fallback sécurisé en cas d'indisponibilité temporaire de l'API Wave
      }
    }

    // 2. Déclaration manuelle / hors-ligne (Espèces, Chèque, Virement) :
    // SÉCURITÉ P0 : NE JAMAIS marquer comme 'paye' sans validation de la passerelle ou du bailleur !
    await pool.query(
      `UPDATE loyers_echeances
       SET statut = 'en_attente_validation',
           mode_paiement = $1,
           reference_paiement = $2,
           notes = CONCAT(COALESCE(notes, ''), ' [Déclaration locataire le ', NOW()::date::text, ' : ', $3::text, ']'),
           updated_at = NOW()
       WHERE id = $4`,
      [methode_paiement, reference_paiement || `DEC-${Date.now()}`, notes || '', echeanceId]
    );

    return res.json({
      success: true,
      en_attente_validation: true,
      message: 'Déclaration de règlement transmise avec succès. Votre quittance officielle sera émise dès confirmation par l’agence / bailleur.'
    });
  } catch (err) {
    console.error('[POST /api/locatif-immo/public/payer-loyer/:echeanceId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur traitement du paiement de loyer' });
  }
});


// ── POST /api/locatif-immo/agence/:slugOrId/loyers/batch-encaisser — Encaissement groupé ──
router.post(
  ['/agence/:slugOrId/loyers/batch-encaisser', '/:slugOrId/loyers/batch-encaisser'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { loyerIds, mode_paiement = 'wave' } = req.body;

      if (!Array.isArray(loyerIds) || loyerIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun loyer sélectionné.' });
      }

      const { rows } = await pool.query(
        `UPDATE loyers_echeances
         SET statut = 'paye',
             montant_paye = montant_du,
             montant_restant = 0,
             date_paiement = NOW(),
             mode_paiement = $1,
             updated_at = NOW()
         WHERE id = ANY($2::uuid[]) AND agence_id = $3
         RETURNING id`,
        [mode_paiement, loyerIds, agenceId]
      );

      // Déclencher les notifications de quittance pour chaque loyer
      for (const row of rows) {
        notifierConfirmationPaiementLoyerWhatsApp({
          loyerId: row.id,
          methodePaiement: mode_paiement
        }).catch(() => {});
      }

      res.json({
        success: true,
        message: `${rows.length} loyer(s) encaissé(s) avec succès.`,
        count: rows.length
      });
    } catch (err) {
      console.error('[BATCH_ENCAISSER_LOYERS_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur encaissement groupé des loyers' });
    }
  }
);

// ── POST /api/locatif-immo/agence/:slugOrId/loyers/batch-relance — Relance WhatsApp groupée ──
router.post(
  ['/agence/:slugOrId/loyers/batch-relance', '/:slugOrId/loyers/batch-relance'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { loyerIds } = req.body;

      if (!Array.isArray(loyerIds) || loyerIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun loyer sélectionné.' });
      }

      const { notifierRelanceLoyerWhatsApp } = require('../services/immo-whatsapp-notifications');
      let envoyes = 0;

      for (const id of loyerIds) {
        try {
          const ok = await notifierRelanceLoyerWhatsApp({ agenceId, loyerId: id });
          if (ok) envoyes++;
        } catch (e) {
          console.warn('[BATCH_RELANCE_LOYER_WARN]', id, e.message);
        }
      }

      res.json({
        success: true,
        message: `${envoyes} rappel(s) WhatsApp envoyé(s) avec succès.`,
        envoyes
      });
    } catch (err) {
      console.error('[BATCH_RELANCE_LOYERS_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur lors de la relance groupée' });
    }
  }
);

// ── POST /api/locatif-immo/agence/:slugOrId/baux/:id/resilier — Résiliation unitaire d'un bail ──
router.post(
  ['/agence/:slugOrId/baux/:id/resilier', '/:slugOrId/baux/:id/resilier'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { id } = req.params;
      const { motif = 'Résiliation de bail' } = req.body || {};

      const { rows: baux } = await pool.query(
        `SELECT id, bien_id FROM baux_immo WHERE id = $1 AND agence_id = $2`,
        [id, agenceId]
      );

      if (!baux[0]) {
        return res.status(404).json({ success: false, error: 'Bail introuvable.' });
      }

      const bienId = baux[0].bien_id;

      // 1. Mettre fin au bail
      await pool.query(
        `UPDATE baux_immo SET statut = 'resilie', date_fin = CURRENT_DATE, updated_at = NOW()
         WHERE id = $1 AND agence_id = $2`,
        [id, agenceId]
      );

      // 2. Libérer le bien associé
      if (bienId) {
        await pool.query(
          `UPDATE biens_immo SET statut_occupation = 'disponible', updated_at = NOW()
           WHERE id = $1 AND agence_id = $2`,
          [bienId, agenceId]
        );
      }

      // 3. Annuler les échéances de loyer futures
      await pool.query(
        `UPDATE loyers_echeances SET statut = 'annule', updated_at = NOW()
         WHERE bail_id = $1 AND agence_id = $2 AND statut = 'en_attente' AND date_echeance > CURRENT_DATE`,
        [id, agenceId]
      );

      res.json({
        success: true,
        message: 'Contrat de bail résilié avec succès. Le bien associé a été libéré.',
        motif
      });
    } catch (err) {
      console.error('[RESILIER_BAIL_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur lors de la résiliation du bail' });
    }
  }
);

// ── POST /api/locatif-immo/agence/:slugOrId/baux/batch-resilier — Résiliation groupée de baux ──
router.post(
  ['/agence/:slugOrId/baux/batch-resilier', '/:slugOrId/baux/batch-resilier'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { bailIds, motif = 'Résiliation groupée' } = req.body;

      if (!Array.isArray(bailIds) || bailIds.length === 0) {
        return res.status(400).json({ success: false, error: 'Aucun bail sélectionné.' });
      }

      const { rows: baux } = await pool.query(
        `SELECT id, bien_id FROM baux_immo WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
        [bailIds, agenceId]
      );

      // Résilier les baux
      await pool.query(
        `UPDATE baux_immo SET statut = 'resilie', date_fin = CURRENT_DATE, updated_at = NOW()
         WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
        [bailIds, agenceId]
      );

      // Libérer les biens associés
      const bienIds = baux.map(b => b.bien_id).filter(Boolean);
      if (bienIds.length > 0) {
        await pool.query(
          `UPDATE biens_immo SET statut_occupation = 'disponible', updated_at = NOW()
           WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
          [bienIds, agenceId]
        );
      }

      // Annuler les échéances de loyer futures
      await pool.query(
        `UPDATE loyers_echeances SET statut = 'annule', updated_at = NOW()
         WHERE bail_id = ANY($1::uuid[]) AND agence_id = $2 AND statut = 'en_attente' AND date_echeance > CURRENT_DATE`,
        [bailIds, agenceId]
      );

      res.json({
        success: true,
        message: `${baux.length} bail(s) résilié(s). Les biens associés ont été libérés.`,
        count: baux.length
      });
    } catch (err) {
      console.error('[BATCH_RESILIER_BAUX_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur résiliation groupée' });
    }
  }
);

// ── PATCH /api/locatif-immo/agence/:slugOrId/maintenance/batch-statut — Statut groupé tickets ──
router.patch(
  ['/agence/:slugOrId/maintenance/batch-statut', '/:slugOrId/maintenance/batch-statut'],
  verifierToken,
  requireAgenceAccess('agent'),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { ticketIds, statut } = req.body;

      if (!Array.isArray(ticketIds) || ticketIds.length === 0 || !statut) {
        return res.status(400).json({ success: false, error: 'Tickets et statut requis.' });
      }

      const dateRes = statut === 'resolu' ? 'CURRENT_DATE' : 'NULL';
      await pool.query(
        `UPDATE maintenance_immo
         SET statut = $1,
             date_resolution = ${dateRes},
             updated_at = NOW()
         WHERE id = ANY($2::uuid[]) AND agence_id = $3`,
        [statut, ticketIds, agenceId]
      );

      res.json({
        success: true,
        message: `${ticketIds.length} ticket(s) mis à jour vers le statut "${statut}".`
      });
    } catch (err) {
      console.error('[BATCH_MAINTENANCE_STATUT_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur mise à jour tickets' });
    }
  }
);

module.exports = router;


