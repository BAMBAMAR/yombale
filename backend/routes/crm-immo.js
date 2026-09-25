// backend/routes/crm-immo.js
// CRM Immobilier Nopalou : Contacts, Prospects, Visites, Bailleurs, Mandats & Offres

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { limiterEcriture } = require('../middlewares/rateLimit');
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

    const userId = req.user?.userId || req.user?.id;
    const ROLES_ACCES_COMPLET = ['admin_agence', 'directeur', 'gestionnaire_locatif'];
    const isAdmin = req.agenceMembre?.isOwner || ROLES_ACCES_COMPLET.includes(req.agenceMembre?.role);
    // Si l'utilisateur est un simple agent commercial, il ne voit QUE ses propres contacts assignés.
    // Si c'est un admin/directeur, il peut filtrer par agent_id ou voir tous les contacts de l'agence.
    const filtreAgentId = isAdmin ? (agent_id || null) : userId;

    let query = `
      SELECT c.*, u.nom AS agent_nom,
             (SELECT COUNT(*) FROM visites_immo v WHERE v.contact_id = c.id) AS nb_visites,
             (SELECT COUNT(*) FROM offres_immo o WHERE o.contact_id = c.id) AS nb_offres,
             COALESCE(
               (
                 SELECT json_agg(json_build_object(
                   'bail_id', bx.id,
                   'bien_id', bx.bien_id,
                   'bien_titre', b.titre,
                   'type_bien', b.type_bien,
                   'quartier', b.quartier,
                   'ville', b.ville,
                   'loyer_mensuel', bx.loyer_mensuel,
                   'charges', bx.charges,
                   'depot_garantie', bx.depot_garantie,
                   'date_debut', bx.date_debut,
                   'date_fin', bx.date_fin,
                   'jour_echeance', bx.jour_echeance,
                   'statut', bx.statut,
                   'nb_impayes', (SELECT COUNT(*) FROM loyers_echeances le WHERE le.bail_id = bx.id AND le.statut IN ('retard', 'impaye'))
                 ) ORDER BY bx.date_debut DESC)
                 FROM baux_immo bx
                 JOIN biens_immo b ON bx.bien_id = b.id
                 WHERE bx.locataire_id = c.id
               ), '[]'::json
             ) AS baux,
             (SELECT COUNT(*) FROM loyers_echeances le JOIN baux_immo bx ON le.bail_id = bx.id WHERE bx.locataire_id = c.id AND le.statut IN ('retard', 'impaye')) AS nb_impayes
      FROM contacts_immo c
      LEFT JOIN utilisateurs u ON c.agent_id = u.id
      WHERE c.agence_id = $1 AND COALESCE(c.actif, true) = true AND COALESCE(c.statut_crm, '') != 'archive'
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
    if (filtreAgentId) {
      query += ` AND c.agent_id = $${pIndex++}`;
      params.push(filtreAgentId);
    }
    if (search) {
      query += ` AND (c.nom ILIKE $${pIndex} OR c.prenom ILIKE $${pIndex} OR c.telephone ILIKE $${pIndex} OR c.email ILIKE $${pIndex})`;
      params.push(`%${search}%`);
      pIndex++;
    }

    query += ` ORDER BY c.created_at DESC`;

    const { rows } = await pool.query(query, params);

    const contacts = rows.map(c => {
      const bauxList = Array.isArray(c.baux) ? c.baux : [];
      const bauxActifs = bauxList.filter(b => b.statut === 'actif');
      const premierBail = bauxActifs[0] || bauxList[0];
      return {
        ...c,
        baux: bauxList,
        nb_baux: bauxList.length,
        nb_baux_actifs: bauxActifs.length,
        bien_titre: premierBail ? premierBail.bien_titre : null,
        bien_id: premierBail ? premierBail.bien_id : null,
        bail_id: premierBail ? premierBail.bail_id : null,
        loyer_mensuel: premierBail ? Number(premierBail.loyer_mensuel) : null,
        jour_echeance: premierBail ? premierBail.jour_echeance : null,
        date_debut: premierBail ? premierBail.date_debut : null,
        nb_impayes: parseInt(c.nb_impayes, 10) || 0,
      };
    });

    res.json({
      success: true,
      contacts
    });
  } catch (err) {
    console.error('[GET /api/crm-immo/agence/:slugOrId/contacts]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des contacts CRM' });
  }
});

// ── POST /api/crm-immo/public/lead ── Ingestion automatique de lead depuis annonce ou vitrine
router.post('/public/lead', limiterEcriture, async (req, res) => {
  try {
    const {
      annonce_id,
      bien_id,
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

    let cibleAgenceId = agence_id || req.query?.agence_id || req.query?.agence;
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

    // Si bien_id est fourni (ou si annonce_id était un bien_id de vitrine non synchronisé)
    const effectiveBienId = bien_id || (annonce_id && !annonceTitre ? annonce_id : null);
    if (effectiveBienId && !annonceTitre) {
      const { rows: bRows } = await pool.query(
        `SELECT b.id, b.titre, COALESCE(b.prix_location, b.prix_vente) AS prix, b.quartier, b.ville, b.type_bien,
                CASE WHEN b.prix_location IS NOT NULL THEN 'location' ELSE 'vente' END AS transaction,
                b.agence_id, b.agent_id
         FROM biens_immo b
         WHERE b.id = $1`,
        [effectiveBienId]
      );
      if (bRows.length > 0) {
        const b = bRows[0];
        if (!cibleAgenceId && b.agence_id) cibleAgenceId = b.agence_id;
        if (b.agent_id) cibleAgentId = b.agent_id;
        annonceTitre = b.titre;
        annoncePrix = b.prix;
        annonceQuartier = b.quartier || annonceQuartier;
        annonceTypeBien = b.type_bien;
        annonceTypeOp = b.transaction || annonceTypeOp;
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
      // 1. Repli sur la première agence active enregistrée
      const { rows: defaultAg } = await pool.query(
        `SELECT id FROM agences_immo WHERE statut = 'actif' ORDER BY created_at ASC LIMIT 1`
      );
      if (defaultAg.length > 0) {
        cibleAgenceId = defaultAg[0].id;
        console.log('[CRM IMMO] ℹ️ Lead réassigné à l\'agence active par défaut:', cibleAgenceId);
      } else {
        // 2. Sauvegarde de sécurité dans prospection_leads pour ne perdre aucun prospect
        await pool.query(
          `INSERT INTO prospection_leads (nom_boutique, contact_nom, telephone, quartier, ville, categorie, source, notes, statut, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'immo', 'lead_web_orphelin', $6, 'nouveau', NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [
            annonceTitre ? `Intérêt: ${annonceTitre.slice(0, 100)}` : 'Lead Immo Web',
            cleanNom,
            cleanTel,
            annonceQuartier,
            ville || 'Dakar',
            `Lead soumis depuis l'annonce ${annonce_id || 'inconnue'}. Message: ${message || ''}`
          ]
        ).catch(() => {});
        return res.json({ success: true, message: 'Votre demande a bien été transmise à nos conseillers immobiliers.' });
      }
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

    // Si c'est une demande de visite et qu'un bien est ciblé : enregistrer dans visites_immo et générer une alerte
    let visiteId = null;
    if (type_action === 'demande_visite' && effectiveBienId) {
      try {
        const { rows: vRows } = await pool.query(
          `INSERT INTO visites_immo (
            agence_id, bien_id, contact_id, agent_id, date_visite, duree_min, statut, notes
          ) VALUES (
            $1, $2, $3, $4, COALESCE($5::timestamptz, NOW() + INTERVAL '1 day'), 30, 'demande', $6
          ) RETURNING id`,
          [
            cibleAgenceId,
            effectiveBienId,
            contactId,
            cibleAgentId,
            req.body.date_visite || null,
            message || (req.body.creneau ? `Créneau souhaité : ${req.body.creneau}` : 'Demande de visite web')
          ]
        );
        if (vRows.length > 0) visiteId = vRows[0].id;

        await pool.query(
          `INSERT INTO notifications_immo (
            agence_id, type, titre, message, lien, priorite, metadonnees
          ) VALUES ($1, 'demande_visite', $2, $3, $4, 'urgente', $5)`,
          [
            cibleAgenceId,
            'Nouvelle demande de visite reçue',
            `${cleanNom} (${contactTel || 'Web'}) souhaite visiter "${annonceTitre || 'un bien'}"${req.body.date_visite ? ` le ${req.body.date_visite}` : ''}`,
            `/visites`,
            JSON.stringify({
              visite_id: visiteId,
              contact_id: contactId,
              bien_id: effectiveBienId,
              telephone: contactTel,
              message: message || null
            })
          ]
        );

        // Déclenchement automatique de la notification WhatsApp Agence & Prospect
        const { notifierDemandeVisiteAgence } = require('../services/immo-whatsapp-notifications');
        notifierDemandeVisiteAgence({
          agenceId: cibleAgenceId,
          contactNom: cleanNom,
          contactTel,
          annonceTitre,
          dateVisite: req.body.date_visite,
          creneau: req.body.creneau,
          message: message || null,
          visiteId
        }).catch(err => console.warn('[CRM_WA_NOTIF_WARN]', err.message));
      } catch (eNotif) {
        console.error('[DEMANDE_VISITE_NOTIF_ERR]', eNotif.message);
      }
    } else {
      try {
        await pool.query(
          `INSERT INTO notifications_immo (
            agence_id, type, titre, message, lien, priorite, metadonnees
          ) VALUES ($1, 'nouveau_lead', $2, $3, $4, 'normale', $5)`,
          [
            cibleAgenceId,
            'Nouveau prospect enregistré',
            `${cleanNom} (${contactTel || 'Direct'}) a manifesté son intérêt pour "${annonceTitre || 'l agence'}"`,
            `/prospects`,
            JSON.stringify({
              contact_id: contactId,
              bien_id: effectiveBienId,
              telephone: contactTel,
              type_action
            })
          ]
        );
      } catch (eNotif) {
        console.error('[LEAD_NOTIF_ERR]', eNotif.message);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Prospect et demande enregistrés avec succès',
      contactId,
      visiteId
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

    // Anti-doublon par numéro de téléphone dans la même agence
    const cleanPh = telephone ? String(telephone).replace(/\D/g, '') : '';
    const shortPh = cleanPh.length >= 9 ? cleanPh.slice(-9) : cleanPh;
    if (shortPh && !req.body.forcer_doublon) {
      const { rows: existants } = await pool.query(
        `SELECT id, nom, prenom, type_contact, telephone 
         FROM contacts_immo 
         WHERE agence_id = $1 AND RIGHT(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), 9) = $2 LIMIT 1`,
        [agenceId, shortPh]
      );
      if (existants.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_CONTACT',
          error: `Un contact avec ce numéro de téléphone existe déjà (${existants[0].prenom ? existants[0].prenom + ' ' : ''}${existants[0].nom}, ${existants[0].type_contact}).`,
          existant: existants[0]
        });
      }
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
        profession = COALESCE($16, profession),
        revenus_mensuels = COALESCE($17, revenus_mensuels),
        updated_at = NOW()
       WHERE id = $18 AND agence_id = $19
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
        data.profession !== undefined ? data.profession : null,
        data.revenus_mensuels !== undefined ? (data.revenus_mensuels ? parseFloat(data.revenus_mensuels) : null) : null,
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
    } else if (date === 'demandes') {
      query += ` AND v.statut = 'demande'`;
    }

    if (statut === 'demande' || date === 'demandes') {
      query += ` ORDER BY v.created_at DESC`;
    } else {
      query += ` ORDER BY v.date_visite ASC`;
    }

    const { rows } = await pool.query(query, params);

    // Calculer les compteurs rapides
    const countRes = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE statut = 'demande') AS nb_demandes,
        COUNT(*) FILTER (WHERE statut = 'confirmee') AS nb_confirmees,
        COUNT(*) FILTER (WHERE statut = 'realisee') AS nb_realisees
       FROM visites_immo WHERE agence_id = $1`,
      [agenceId]
    );

    res.json({
      success: true,
      visites: rows,
      statistiques: {
        nb_demandes: parseInt(countRes.rows[0]?.nb_demandes || '0', 10),
        nb_confirmees: parseInt(countRes.rows[0]?.nb_confirmees || '0', 10),
        nb_realisees: parseInt(countRes.rows[0]?.nb_realisees || '0', 10),
      }
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
    const { statut, resultat, notes, prochaine_action, date_visite, duree_min, lieu_rdv, agent_id } = req.body;

    const { rows } = await pool.query(
      `UPDATE visites_immo SET
        statut = COALESCE($1, statut),
        resultat = COALESCE($2, resultat),
        notes = COALESCE($3, notes),
        prochaine_action = COALESCE($4, prochaine_action),
        date_visite = COALESCE($5::timestamptz, date_visite),
        duree_min = COALESCE($6, duree_min),
        lieu_rdv = COALESCE($7, lieu_rdv),
        agent_id = COALESCE($8, agent_id),
        updated_at = NOW()
       WHERE id = $9 AND agence_id = $10
       RETURNING *`,
      [
        statut || null,
        resultat || null,
        notes !== undefined ? notes : null,
        prochaine_action !== undefined ? prochaine_action : null,
        date_visite || null,
        duree_min ? parseInt(duree_min, 10) : null,
        lieu_rdv || null,
        agent_id || null,
        visiteId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Visite introuvable.' });
    }

    if (statut === 'confirmee') {
      await pool.query(
        `UPDATE contacts_immo SET statut_crm = 'visite_programmee', updated_at = NOW() WHERE id = $1`,
        [rows[0].contact_id]
      );

      if (rows[0].contact_id) {
        try {
          const { rows: details } = await pool.query(
            `SELECT c.nom AS contact_nom, c.telephone AS contact_tel,
                    b.titre AS bien_titre,
                    u.nom AS agent_nom, u.telephone AS agent_tel
             FROM contacts_immo c
             LEFT JOIN biens_immo b ON b.id = $2
             LEFT JOIN utilisateurs u ON u.id = $3
             WHERE c.id = $1`,
            [rows[0].contact_id, rows[0].bien_id, rows[0].agent_id]
          );
          if (details[0]?.contact_tel) {
            const { notifierConfirmationVisite } = require('../services/immo-whatsapp-notifications');
            notifierConfirmationVisite({
              agenceId,
              contactNom: details[0].contact_nom,
              contactTel: details[0].contact_tel,
              bienTitre: details[0].bien_titre,
              dateVisite: rows[0].date_visite,
              heureVisite: rows[0].date_visite ? new Date(rows[0].date_visite).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : null,
              agentNom: details[0].agent_nom,
              agentTel: details[0].agent_tel
            }).catch(e => console.warn('[CONFIRM_VISITE_WA_ERR]', e.message));
          }
        } catch (eConfirm) {
          console.warn('[CONFIRM_VISITE_LOOKUP_ERR]', eConfirm.message);
        }
      }
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
    const { inclure_inactifs } = req.query;

    let query = `
      SELECT p.*,
             (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id) AS nb_biens_total,
             (SELECT COUNT(*) FROM biens_immo b WHERE b.proprietaire_id = p.id AND b.statut_occupation = 'loue') AS nb_biens_loues
      FROM proprietaires_immo p
      WHERE p.agence_id = $1
    `;

    if (inclure_inactifs !== 'true') {
      query += ` AND COALESCE(p.actif, true) = true`;
    }

    query += ` ORDER BY p.nom ASC`;

    const { rows } = await pool.query(query, [agenceId]);

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

    // Anti-doublon par numéro de téléphone dans la même agence
    const cleanPhProp = telephone ? String(telephone).replace(/\D/g, '') : '';
    const shortPhProp = cleanPhProp.length >= 9 ? cleanPhProp.slice(-9) : cleanPhProp;
    if (shortPhProp && !req.body.forcer_doublon) {
      const { rows: existantsProp } = await pool.query(
        `SELECT id, nom, prenom, telephone 
         FROM proprietaires_immo 
         WHERE agence_id = $1 AND RIGHT(REPLACE(REPLACE(telephone, ' ', ''), '+', ''), 9) = $2 LIMIT 1`,
        [agenceId, shortPhProp]
      );
      if (existantsProp.length > 0) {
        return res.status(409).json({
          success: false,
          code: 'DUPLICATE_BAILLEUR',
          error: `Un propriétaire avec ce numéro de téléphone existe déjà (${existantsProp[0].prenom ? existantsProp[0].prenom + ' ' : ''}${existantsProp[0].nom}).`,
          existant: existantsProp[0]
        });
      }
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

// ── DELETE /api/crm-immo/agence/:slugOrId/proprietaires/:id — Supprimer ou archiver un bailleur ──
router.delete('/agence/:slugOrId/proprietaires/:id', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;
    const { mode = 'auto' } = req.query; // 'auto', 'archive', 'force'

    // Vérifier si des biens sont encore rattachés
    const { rows: biens } = await pool.query(
      `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
      [id, agenceId]
    );
    const nbBiens = parseInt(biens[0]?.total, 10) || 0;

    // Vérifier si des baux sont rattachés
    const { rows: baux } = await pool.query(
      `SELECT COUNT(*) AS total FROM baux_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
      [id, agenceId]
    );
    const nbBaux = parseInt(baux[0]?.total, 10) || 0;

    if (nbBiens > 0 || nbBaux > 0 || mode === 'archive') {
      await pool.query(
        `UPDATE proprietaires_immo SET actif = false, updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
        [id, agenceId]
      );
      return res.json({
        success: true,
        message: `Propriétaire archivé avec succès. Les ${nbBiens} bien(s) et l'historique comptable sont conservés.`,
        action: 'archived',
        nbBiens,
        nbBaux
      });
    }

    const { rowCount } = await pool.query(
      `DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`,
      [id, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Propriétaire introuvable.' });
    }

    res.json({ success: true, message: 'Bailleur supprimé avec succès.', action: 'deleted' });
  } catch (err) {
    console.error('[DELETE /api/crm-immo/agence/:slugOrId/proprietaires/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression bailleur' });
  }
});

// ── GET /api/crm-immo/agence/:slugOrId/proprietaires/:id/biens — Liste des biens d'un bailleur ──
router.get('/agence/:slugOrId/proprietaires/:id/biens', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;

    const { rows } = await pool.query(
      `SELECT b.id, b.titre, b.type_bien, b.statut_occupation,
              COALESCE(b.prix_location, 0) AS loyer_mensuel,
              COALESCE(b.charges, 0) AS charges_mensuelles,
              b.quartier, b.ville, b.adresse, b.surface_m2, b.nb_pieces,
              bx.id AS bail_actif_id, bx.loyer_mensuel AS bail_loyer,
              c.id AS locataire_id, c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_telephone
       FROM biens_immo b
       LEFT JOIN baux_immo bx ON bx.bien_id = b.id AND bx.statut = 'actif'
       LEFT JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE b.proprietaire_id = $1 AND b.agence_id = $2
       ORDER BY b.created_at DESC`,
      [id, agenceId]
    );

    res.json({ success: true, biens: rows });
  } catch (err) {
    console.error('[GET /proprietaires/:id/biens]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des biens du bailleur' });
  }
});

// ── PUT /api/crm-immo/agence/:slugOrId/visites/batch-statut — Mise à jour groupée statut visites ──
router.put(
  ['/agence/:slugOrId/visites/batch-statut', '/:slugOrId/visites/batch-statut'],
  verifierToken,
  requireAgenceAccess(),
  async (req, res) => {
    try {
      const agenceId = req.agence.id;
      const { visiteIds, statut } = req.body;

      if (!Array.isArray(visiteIds) || visiteIds.length === 0 || !statut) {
        return res.status(400).json({ success: false, error: 'Visites et statut requis.' });
      }

      await pool.query(
        `UPDATE visites_immo
         SET statut = $1, updated_at = NOW()
         WHERE id = ANY($2::uuid[]) AND agence_id = $3`,
        [statut, visiteIds, agenceId]
      );

      res.json({
        success: true,
        message: `${visiteIds.length} visite(s) marquée(s) comme "${statut}".`
      });
    } catch (err) {
      console.error('[BATCH_VISITES_STATUT_ERR]', err.message);
      res.status(500).json({ success: false, error: 'Erreur mise à jour groupée des visites' });
    }
  }
);


// ── DELETE /api/crm-immo/agence/:slugOrId/contacts/:id — Supprimer ou archiver un contact/locataire ──
router.delete('/agence/:slugOrId/contacts/:id', verifierToken, requireAgenceAccess('agent'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { id } = req.params;
    const { mode = 'auto' } = req.query; // 'auto', 'archive', 'force'

    // Vérifier si des baux sont rattachés
    const { rows: baux } = await pool.query(
      `SELECT COUNT(*) AS total, 
              COUNT(*) FILTER (WHERE statut = 'actif') AS actifs
       FROM baux_immo WHERE locataire_id = $1 AND agence_id = $2`,
      [id, agenceId]
    );

    const nbBaux = parseInt(baux[0]?.total, 10) || 0;
    const nbActifs = parseInt(baux[0]?.actifs, 10) || 0;

    // Si le locataire a des baux actifs, interdire la suppression physique
    if (nbActifs > 0 && mode !== 'archive') {
      return res.status(400).json({
        success: false,
        error: `Impossible de supprimer ce locataire : il possède ${nbActifs} bail(s) actif(s) en cours. Résiliez d'abord ses baux.`,
        code: 'HAS_ACTIVE_LEASES'
      });
    }

    // Si le locataire a un historique de baux passés (même résiliés), basculer en archivé pour préserver l'historique légal et comptable
    if (nbBaux > 0 || mode === 'archive') {
      await pool.query(
        `UPDATE contacts_immo SET actif = false, statut_crm = 'archive', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
        [id, agenceId]
      );
      return res.json({
        success: true,
        message: 'Locataire archivé avec succès. L\'historique contractuel et les quittances sont préservés.',
        action: 'archived'
      });
    }

    // 0 bail rattaché : suppression physique autorisée
    const { rowCount } = await pool.query(
      `DELETE FROM contacts_immo WHERE id = $1 AND agence_id = $2`,
      [id, agenceId]
    );

    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Contact introuvable.' });
    }

    res.json({ success: true, message: 'Contact supprimé définitivement avec succès.', action: 'deleted' });
  } catch (err) {
    console.error('[DELETE /api/crm-immo/agence/:slugOrId/contacts/:id]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du contact.' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/contacts/batch-delete — Suppression ou archivage groupé ──
router.post('/agence/:slugOrId/contacts/batch-delete', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Liste d\'identifiants requise.' });
    }

    let nbSupprimes = 0;
    let nbArchives = 0;

    for (const cId of ids) {
      const { rows: baux } = await pool.query(
        `SELECT COUNT(*) AS total FROM baux_immo WHERE locataire_id = $1 AND agence_id = $2`,
        [cId, agenceId]
      );
      if (parseInt(baux[0]?.total, 10) > 0) {
        await pool.query(
          `UPDATE contacts_immo SET actif = false, statut_crm = 'archive', updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
          [cId, agenceId]
        );
        nbArchives++;
      } else {
        await pool.query(`DELETE FROM contacts_immo WHERE id = $1 AND agence_id = $2`, [cId, agenceId]);
        nbSupprimes++;
      }
    }

    res.json({
      success: true,
      message: `Traitement terminé : ${nbSupprimes} supprimé(s), ${nbArchives} archivé(s).`,
      nbSupprimes,
      nbArchives
    });
  } catch (err) {
    console.error('[POST /contacts/batch-delete]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression groupée contacts.' });
  }
});

// ── POST /api/crm-immo/agence/:slugOrId/proprietaires/batch-delete — Suppression ou archivage groupé bailleurs ──
router.post('/agence/:slugOrId/proprietaires/batch-delete', verifierToken, requireAgenceAccess('directeur'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Liste d\'identifiants requise.' });
    }

    let nbSupprimes = 0;
    let nbArchives = 0;

    for (const pId of ids) {
      const { rows: biens } = await pool.query(
        `SELECT COUNT(*) AS total FROM biens_immo WHERE proprietaire_id = $1 AND agence_id = $2`,
        [pId, agenceId]
      );
      if (parseInt(biens[0]?.total, 10) > 0) {
        await pool.query(
          `UPDATE proprietaires_immo SET actif = false, updated_at = NOW() WHERE id = $1 AND agence_id = $2`,
          [pId, agenceId]
        );
        nbArchives++;
      } else {
        await pool.query(`DELETE FROM proprietaires_immo WHERE id = $1 AND agence_id = $2`, [pId, agenceId]);
        nbSupprimes++;
      }
    }

    res.json({
      success: true,
      message: `Traitement terminé : ${nbSupprimes} bailleur(s) supprimé(s), ${nbArchives} archivé(s).`,
      nbSupprimes,
      nbArchives
    });
  } catch (err) {
    console.error('[POST /proprietaires/batch-delete]', err.message);
    res.status(500).json({ success: false, error: 'Erreur suppression groupée bailleurs.' });
  }
});

module.exports = router;

