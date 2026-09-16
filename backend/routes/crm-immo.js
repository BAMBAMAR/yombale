// backend/routes/crm-immo.js
// CRM Immobilier Nopalou : Contacts, Prospects, Visites, Bailleurs, Mandats & Offres

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { trouverBiensPourProspect } = require('../services/matching-immo');

// ══════════════════════════════════════════════════════════════
// 1. CONTACTS & PROSPECTS (Pipeline CRM)
// ══════════════════════════════════════════════════════════════

// ── GET /api/crm-immo/agence/:slugOrId/contacts ──
router.get('/agence/:slugOrId/contacts', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut_crm, type_contact = 'prospect', agent_id, search } = req.query;

    let query = `
      SELECT c.*, u.nom AS agent_nom,
             (SELECT COUNT(*) FROM visites_immo v WHERE v.contact_id = c.id) AS nb_visites,
             (SELECT COUNT(*) FROM offres_immo o WHERE o.contact_id = c.id) AS nb_offres
      FROM contacts_immo c
      LEFT JOIN utilisateurs u ON c.agent_id = u.id
      WHERE c.agence_id = $1
    `;
    const params = [agenceId];
    let pIndex = 2;

    if (type_contact && type_contact !== 'tous') {
      query += ` AND c.type_contact = $${pIndex++}`;
      params.push(type_contact);
    }
    if (statut_crm && statut_crm !== 'tous') {
      query += ` AND c.statut_crm = $${pIndex++}`;
      params.push(statut_crm);
    }
    if (agent_id) {
      query += ` AND c.agent_id = $${pIndex++}`;
      params.push(agent_id);
    }
    if (search) {
      query += ` AND (c.nom ILIKE $${pIndex} OR c.prenom ILIKE $${pIndex} OR c.telephone ILIKE $${pIndex} OR c.email ILIKE $${pIndex})`;
      params.push(`%${search}%`);
      pIndex++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      contacts: rows
    });
  } catch (err) {
    console.error('[GET /api/crm-immo/agence/:slugOrId/contacts]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des contacts CRM' });
  }
});

// ── POST /api/crm-immo/public/lead ── Ingestion automatique de lead depuis annonce ou vitrine
router.post('/public/lead', async (req, res) => {
  try {
    const {
      annonce_id,
      agence_id,
      nom,
      prenom = '',
      telephone,
      whatsapp,
      email,
      message,
      type_action = 'whatsapp_click', // 'whatsapp_click', 'demande_visite', 'demande_info'
      type_operation,
      budget,
      ville,
      quartier
    } = req.body;

    const contactTel = telephone || whatsapp;
    if (!contactTel && !nom) {
      return res.status(400).json({ success: false, error: 'Numéro de téléphone ou nom requis.' });
    }

    let cibleAgenceId = agence_id;
    let cibleAgentId = null;
    let annonceTitre = '';
    let annoncePrix = null;
    let annonceQuartier = quartier || '';
    let annonceTypeBien = null;
    let annonceTypeOp = type_operation || 'location';

    // Si une annonce_id est fournie, récupérer les infos de l'annonce et de l'agence associée
    if (annonce_id) {
      const { rows: adRows } = await pool.query(
        `SELECT ai.id, ai.titre, ai.prix, ai.quartier, ai.ville, ai.type_bien, ai.transaction,
                ai.agence_id, b.agent_id
         FROM annonces_immo ai
         LEFT JOIN biens_immo b ON ai.bien_id = b.id
         WHERE ai.id = $1`,
        [annonce_id]
      );
      if (adRows.length > 0) {
        const ad = adRows[0];
        if (!cibleAgenceId && ad.agence_id) cibleAgenceId = ad.agence_id;
        cibleAgentId = ad.agent_id;
        annonceTitre = ad.titre;
        annoncePrix = ad.prix;
        annonceQuartier = ad.quartier || annonceQuartier;
        annonceTypeBien = ad.type_bien;
        annonceTypeOp = ad.transaction || annonceTypeOp;
      }
    }

    // Si toujours pas d'agence_id, rechercher si le slug a été passé dans agence_id
    if (cibleAgenceId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cibleAgenceId)) {
      const { rows: agRows } = await pool.query(
        `SELECT id FROM agences_immo WHERE slug = $1 LIMIT 1`,
        [cibleAgenceId]
      );
      if (agRows.length > 0) cibleAgenceId = agRows[0].id;
      else cibleAgenceId = null;
    }

    if (!cibleAgenceId) {
      return res.status(400).json({ success: false, error: 'Agence cible introuvable pour ce lead.' });
    }

    const cleanTel = String(contactTel || '').replace(/\D/g, '');
    const cleanNom = String(nom || (cleanTel ? `Prospect ${cleanTel.slice(-4)}` : 'Prospect Web')).trim();

    // Vérifier si ce contact existe déjà dans l'agence (déduplication par téléphone)
    let contactId = null;
    if (cleanTel) {
      const { rows: existRows } = await pool.query(
        `SELECT id, notes FROM contacts_immo 
         WHERE agence_id = $1 AND (REPLACE(REPLACE(telephone, ' ', ''), '+', '') LIKE '%' || $2 OR REPLACE(REPLACE(whatsapp, ' ', ''), '+', '') LIKE '%' || $2)
         LIMIT 1`,
        [cibleAgenceId, cleanTel.slice(-8)]
      );
      if (existRows.length > 0) {
        contactId = existRows[0].id;
        const noteAdd = `\n[${new Date().toLocaleDateString('fr-FR')} - ${type_action}] Intérêt pour : ${annonceTitre || 'Bien'}${annoncePrix ? ` (${annoncePrix} FCFA)` : ''}${message ? ` - Message: ${message}` : ''}`;
        await pool.query(
          `UPDATE contacts_immo 
           SET notes = COALESCE(notes, '') || $1,
               updated_at = NOW()
           WHERE id = $2`,
          [noteAdd, contactId]
        );
      }
    }

    // Si non trouvé, créer le nouveau prospect
    if (!contactId) {
      const initialNotes = `[${new Date().toLocaleDateString('fr-FR')} - Création via ${type_action}]\n` +
        `Bien : ${annonceTitre || 'Contact direct'}\n` +
        (annoncePrix ? `Prix : ${annoncePrix} FCFA\n` : '') +
        (message ? `Message initial : ${message}\n` : '');

      const { rows: newContact } = await pool.query(
        `INSERT INTO contacts_immo (
          agence_id, type_contact, nom, prenom, telephone, whatsapp, email,
          statut_crm, budget_max, type_operation, type_bien_souhaite,
          quartiers_souhaites, agent_id, source, notes
        ) VALUES (
          $1, 'prospect', $2, $3, $4, $5, $6,
          'nouveau', $7, $8, $9,
          $10, $11, 'annonce_web', $12
        ) RETURNING id`,
        [
          cibleAgenceId,
          cleanNom,
          prenom,
          contactTel,
          whatsapp || contactTel,
          email || null,
          budget || annoncePrix || null,
          annonceTypeOp,
          annonceTypeBien,
          JSON.stringify(annonceQuartier ? [annonceQuartier] : []),
          cibleAgentId,
          initialNotes
        ]
      );
      contactId = newContact[0].id;
    }

    res.status(201).json({
      success: true,
      message: 'Prospect enregistré dans le CRM de l\'agence avec succès',
      contactId
    });
  } catch (err) {
    console.error('[POST /api/crm-immo/public/lead]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de l\'enregistrement du lead' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/contacts ──
router.post('/agence/:slugOrId/contacts', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      type_contact = 'prospect',
      nom,
      prenom,
      telephone,
      whatsapp,
      email,
      profession,
      revenus_mensuels,
      statut_crm = 'nouveau',
      budget_min,
      budget_max,
      type_operation = 'location',
      type_bien_souhaite,
      surface_min,
      nb_chambres_min,
      villes_souhaitees = ['Dakar'],
      quartiers_souhaites = [],
      meuble_souhaite,
      delai = 'immediat',
      agent_id,
      source = 'direct',
      probabilite = 50,
      prochaine_action,
      prochaine_action_le,
      notes
    } = req.body;

    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du contact est obligatoire.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO contacts_immo (
        agence_id, type_contact, nom, prenom, telephone, whatsapp, email,
        profession, revenus_mensuels, statut_crm,
        budget_min, budget_max, type_operation, type_bien_souhaite,
        surface_min, nb_chambres_min, villes_souhaitees, quartiers_souhaites,
        meuble_souhaite, delai, agent_id, source, probabilite,
        prochaine_action, prochaine_action_le, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18,
        $19, $20, $21, $22, $23,
        $24, $25, $26
      ) RETURNING *`,
      [
        agenceId,
        type_contact,
        nom.trim(),
        prenom ? prenom.trim() : null,
        telephone ? telephone.trim() : null,
        whatsapp ? whatsapp.trim() : null,
        email ? email.trim() : null,
        profession || null,
        revenus_mensuels ? parseFloat(revenus_mensuels) : null,
        statut_crm,
        budget_min ? parseFloat(budget_min) : null,
        budget_max ? parseFloat(budget_max) : null,
        type_operation,
        type_bien_souhaite || null,
        surface_min ? parseFloat(surface_min) : null,
        nb_chambres_min ? parseInt(nb_chambres_min, 10) : null,
        JSON.stringify(Array.isArray(villes_souhaitees) ? villes_souhaitees : ['Dakar']),
        JSON.stringify(Array.isArray(quartiers_souhaites) ? quartiers_souhaites : []),
        meuble_souhaite !== undefined ? meuble_souhaite : null,
        delai,
        agent_id || req.user.userId,
        source,
        probabilite ? parseInt(probabilite, 10) : 50,
        prochaine_action || null,
        prochaine_action_le || null,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Contact enregistré avec succès dans le CRM',
      contact: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/crm-immo/agence/:slugOrId/contacts]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la création du contact' });
  }
});

// ── PUT /api/crm-immo/agence/:slugOrId/contacts/:contactId ──
router.put('/agence/:slugOrId/contacts/:contactId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { contactId } = req.params;
    const data = req.body;

    const { rows } = await pool.query(
      `UPDATE contacts_immo SET
        nom = COALESCE($1, nom),
        prenom = COALESCE($2, prenom),
        telephone = COALESCE($3, telephone),
        whatsapp = COALESCE($4, whatsapp),
        email = COALESCE($5, email),
        statut_crm = COALESCE($6, statut_crm),
        budget_min = COALESCE($7, budget_min),
        budget_max = COALESCE($8, budget_max),
        type_operation = COALESCE($9, type_operation),
        type_bien_souhaite = COALESCE($10, type_bien_souhaite),
        probabilite = COALESCE($11, probabilite),
        prochaine_action = COALESCE($12, prochaine_action),
        prochaine_action_le = COALESCE($13, prochaine_action_le),
        notes = COALESCE($14, notes),
        agent_id = COALESCE($15, agent_id),
        updated_at = NOW()
       WHERE id = $16 AND agence_id = $17
       RETURNING *`,
      [
        data.nom ? data.nom.trim() : null,
        data.prenom !== undefined ? data.prenom : null,
        data.telephone !== undefined ? data.telephone : null,
        data.whatsapp !== undefined ? data.whatsapp : null,
        data.email !== undefined ? data.email : null,
        data.statut_crm || null,
        data.budget_min !== undefined ? (data.budget_min ? parseFloat(data.budget_min) : null) : null,
        data.budget_max !== undefined ? (data.budget_max ? parseFloat(data.budget_max) : null) : null,
        data.type_operation || null,
        data.type_bien_souhaite || null,
        data.probabilite !== undefined ? parseInt(data.probabilite, 10) : null,
        data.prochaine_action !== undefined ? data.prochaine_action : null,
        data.prochaine_action_le || null,
        data.notes !== undefined ? data.notes : null,
        data.agent_id !== undefined ? data.agent_id : null,
        contactId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Contact introuvable dans cette agence.' });
    }

    res.json({
      success: true,
      message: 'Contact mis à jour avec succès',
      contact: rows[0]
    });
  } catch (err) {
    console.error('[PUT /api/crm-immo/agence/:slugOrId/contacts/:contactId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour du contact' });
  }
});

// ── GET /api/crm-immo/agence/:slugOrId/contacts/:contactId/matching ──
router.get('/agence/:slugOrId/contacts/:contactId/matching', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { contactId } = req.params;

    const matches = await trouverBiensPourProspect(contactId, agenceId, 20);

    res.json({
      success: true,
      biens_matches: matches
    });
  } catch (err) {
    console.error('[GET /api/crm-immo/agence/:slugOrId/contacts/:contactId/matching]', err.message);
    res.status(500).json({ success: false, error: 'Erreur matching biens' });
  }
});

// ══════════════════════════════════════════════════════════════
// 2. VISITES IMMOBILIÈRES
// ══════════════════════════════════════════════════════════════

// ── GET /api/crm-immo/agence/:slugOrId/visites ──
router.get('/agence/:slugOrId/visites', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { statut, date, bien_id } = req.query;

    let query = `
      SELECT v.*,
             b.titre AS bien_titre, b.type_bien, b.quartier AS bien_quartier, b.ville AS bien_ville,
             c.nom AS contact_nom, c.prenom AS contact_prenom, c.telephone AS contact_tel, c.whatsapp AS contact_wa,
             u.nom AS agent_nom
      FROM visites_immo v
      JOIN biens_immo b ON v.bien_id = b.id
      JOIN contacts_immo c ON v.contact_id = c.id
      LEFT JOIN utilisateurs u ON v.agent_id = u.id
      WHERE v.agence_id = $1
    `;
    const params = [agenceId];
    let pIndex = 2;

    if (statut && statut !== 'tous') {
      query += ` AND v.statut = $${pIndex++}`;
      params.push(statut);
    }
    if (bien_id) {
      query += ` AND v.bien_id = $${pIndex++}`;
      params.push(bien_id);
    }
    if (date === 'aujourdhui') {
      query += ` AND v.date_visite::date = CURRENT_DATE`;
    } else if (date === 'a_venir') {
      query += ` AND v.date_visite >= NOW()`;
    }

    query += ` ORDER BY v.date_visite ASC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      visites: rows
    });
  } catch (err) {
    console.error('[GET /api/crm-immo/agence/:slugOrId/visites]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des visites' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/visites ──
router.post('/agence/:slugOrId/visites', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      bien_id,
      contact_id,
      agent_id,
      date_visite,
      duree_min = 30,
      lieu_rdv,
      notes
    } = req.body;

    if (!bien_id || !contact_id || !date_visite) {
      return res.status(400).json({ success: false, error: 'Bien, prospect et date de visite requis.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO visites_immo (
        agence_id, bien_id, contact_id, agent_id, date_visite, duree_min, lieu_rdv, notes, statut
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'confirmee')
      RETURNING *`,
      [
        agenceId,
        bien_id,
        contact_id,
        agent_id || req.user.userId,
        date_visite,
        parseInt(duree_min, 10) || 30,
        lieu_rdv || null,
        notes || null
      ]
    );

    // Mettre à jour le statut CRM du contact en 'visite_programmee'
    await pool.query(
      `UPDATE contacts_immo SET statut_crm = 'visite_programmee', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
      [contact_id, agenceId]
    );

    res.status(201).json({
      success: true,
      message: 'Visite programmée avec succès',
      visite: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/crm-immo/agence/:slugOrId/visites]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création de la visite' });
  }
});

// ── PUT /api/crm-immo/agence/:slugOrId/visites/:visiteId ──
router.put('/agence/:slugOrId/visites/:visiteId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { visiteId } = req.params;
    const { statut, resultat, notes, prochaine_action } = req.body;

    const { rows } = await pool.query(
      `UPDATE visites_immo SET
        statut = COALESCE($1, statut),
        resultat = COALESCE($2, resultat),
        notes = COALESCE($3, notes),
        prochaine_action = COALESCE($4, prochaine_action),
        updated_at = NOW()
       WHERE id = $5 AND agence_id = $6
       RETURNING *`,
      [
        statut || null,
        resultat || null,
        notes !== undefined ? notes : null,
        prochaine_action !== undefined ? prochaine_action : null,
        visiteId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Visite introuvable.' });
    }

    res.json({
      success: true,
      message: 'Visite mise à jour avec succès',
      visite: rows[0]
    });
  } catch (err) {
    console.error('[PUT /api/crm-immo/agence/:slugOrId/visites/:visiteId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour visite' });
  }
});

// ══════════════════════════════════════════════════════════════
// 3. PROPRIÉTAIRES / BAILLEURS
// ══════════════════════════════════════════════════════════════

// ── GET /api/crm-immo/agence/:slugOrId/proprietaires ──
router.get('/agence/:slugOrId/proprietaires', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { rows } = await pool.query(
      `SELECT p.*,
              (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id) AS nb_biens_total,
              (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id AND b.statut_occupation = 'loue') AS nb_biens_loues
       FROM proprietaires_immo p
       WHERE p.agence_id = $1
       ORDER BY p.nom ASC`,
      [agenceId]
    );

    res.json({
      success: true,
      proprietaires: rows
    });
  } catch (err) {
    console.error('[GET /api/crm-immo/agence/:slugOrId/proprietaires]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des bailleurs' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/proprietaires ──
router.post('/agence/:slugOrId/proprietaires', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { nom, prenom, telephone, whatsapp, email, adresse, type_bailleur = 'particulier', iban, notes } = req.body;

    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Le nom du propriétaire/bailleur est requis.' });
    }

    const { rows } = await pool.query(
      `INSERT INTO proprietaires_immo (
        agence_id, nom, prenom, telephone, whatsapp, email, adresse, type_bailleur, iban, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        agenceId,
        nom.trim(),
        prenom ? prenom.trim() : null,
        telephone ? telephone.trim() : null,
        whatsapp ? whatsapp.trim() : null,
        email ? email.trim() : null,
        adresse || null,
        type_bailleur,
        iban || null,
        notes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Propriétaire/Bailleur ajouté avec succès',
      proprietaire: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/crm-immo/agence/:slugOrId/proprietaires]', err.message);
    res.status(500).json({ success: false, error: 'Erreur création du propriétaire' });
  }
});

// ── PUT /api/crm-immo/agence/:slugOrId/proprietaires/:id — Modifier un bailleur ──
router.put('/agence/:slugOrId/proprietaires/:id', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;
    const { nom, prenom, telephone, whatsapp, email, adresse, type_bailleur, iban, notes } = req.body;

    const { rows } = await pool.query(
      `UPDATE proprietaires_immo SET
        nom = COALESCE($1, nom),
        prenom = COALESCE($2, prenom),
        telephone = COALESCE($3, telephone),
        whatsapp = COALESCE($4, whatsapp),
        email = COALESCE($5, email),
        adresse = COALESCE($6, adresse),
        type_bailleur = COALESCE($7, type_bailleur),
        iban = COALESCE($8, iban),
        notes = COALESCE($9, notes),
        updated_at = NOW()
       WHERE id = $10 AND agence_id = $11
       RETURNING *`,
      [
        nom ? nom.trim() : null,
        prenom ? prenom.trim() : null,
        telephone ? telephone.trim() : null,
        whatsapp ? whatsapp.trim() : null,
        email ? email.trim() : null,
        adresse || null,
        type_bailleur || null,
        iban || null,
        notes || null,
        id,
        agenceId,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Propriétaire introuvable.' });
    }

    res.json({
      success: true,
      message: 'Propriétaire mis à jour avec succès',
      proprietaire: rows[0],
    });
  } catch (err) {
    console.error('[PUT /api/crm-immo/agence/:slugOrId/proprietaires/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour bailleur' });
  }
});

// ── DELETE /api/crm-immo/agence/:slugOrId/proprietaires/:id — Supprimer un bailleur ──
router.delete('/agence/:slugOrId/proprietaires/:id', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;

    // Vérifier si des biens sont encore rattachés
    const { rows: biens } = await pool.query(
      `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
      [id, agenceId]
    );

    if (parseInt(biens[0]?.total, 10) > 0) {
      return res.status(400).json({
        success: false,
        error: `Impossible de supprimer ce bailleur : ${biens[0].total} bien(s) lui sont encore rattachés. Réassignez ou archivez d'abord ses biens.`,
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`,
      [id, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Propriétaire introuvable.' });
    }

    res.json({ success: true, message: 'Bailleur supprimé avec succès' });
  } catch (err) {
    console.error('[DELETE /api/crm-immo/agence/:slugOrId/proprietaires/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression bailleur' });
  }
});

module.exports = router;
