// backend/routes/biens.js
// Gestion du portefeuille de biens immobiliers et publication d'annonces

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { trouverProspectsPourBien } = require('../services/matching-immo');

// ── GET /api/biens/public/agence/:slugOrId — Biens disponibles pour la vitrine publique ──
router.get('/public/agence/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const agenceQuery = isUUID
      ? `SELECT id, nom, slug, statut FROM agences_immo WHERE id = $1`
      : `SELECT id, nom, slug, statut FROM agences_immo WHERE slug = $1`;

    const { rows: agenceRows } = await pool.query(agenceQuery, [slugOrId]);
    if (agenceRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agence introuvable' });
    }

    const agenceId = agenceRows[0].id;
    const { rows: biens } = await pool.query(
      `SELECT id, reference, titre, type_bien, description, ville, quartier, adresse,
              prix_location, charges_mensuelles, caution_demandee, prix_vente,
              surface_m2, nb_pieces, nb_chambres, nb_salles_de_bain, etage, meuble, equipements,
              photos, statut_occupation, created_at
       FROM biens_immo
       WHERE agence_id = $1 AND statut = 'actif' AND statut_occupation = 'disponible'
       ORDER BY created_at DESC`,
      [agenceId]
    );

    res.json({
      success: true,
      biens
    });
  } catch (err) {
    console.error('[GET /api/biens/public/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des biens' });
  }
});

// ── GET /api/biens/agence/:slugOrId — Liste des biens de l'agence ──
router.get('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      type_bien,
      statut_occupation,
      statut = 'actif',
      ville,
      recherche,
      limit = 50,
      offset = 0
    } = req.query;

    let query = `
      SELECT b.*,
             p.nom AS proprietaire_nom, p.prenom AS proprietaire_prenom, p.telephone AS proprietaire_tel,
             u.nom AS agent_nom,
             ai.id AS annonce_publiee_id, ai.actif AS annonce_publiee_actif,
             (SELECT COUNT(*) FROM visites_immo v WHERE v.bien_id = b.id) AS nb_visites,
             (SELECT COUNT(*) FROM baux_immo bx WHERE bx.bien_id = b.id AND bx.statut = 'actif') AS nb_baux_actifs
      FROM biens_immo b
      LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
      LEFT JOIN utilisateurs u ON b.agent_id = u.id
      LEFT JOIN annonces_immo ai ON ai.bien_id = b.id AND ai.supprimee = false
      WHERE b.agence_id = $1
    `;
    const params = [agenceId];
    let pIndex = 2;

    if (statut && statut !== 'tous') {
      query += ` AND b.statut = $${pIndex++}`;
      params.push(statut);
    }
    if (statut_occupation && statut_occupation !== 'tous') {
      query += ` AND b.statut_occupation = $${pIndex++}`;
      params.push(statut_occupation);
    }
    if (type_bien && type_bien !== 'tous') {
      query += ` AND b.type_bien = $${pIndex++}`;
      params.push(type_bien);
    }
    if (ville) {
      query += ` AND b.ville ILIKE $${pIndex++}`;
      params.push(`%${ville}%`);
    }
    if (recherche) {
      query += ` AND (b.titre ILIKE $${pIndex} OR b.reference ILIKE $${pIndex} OR b.quartier ILIKE $${pIndex})`;
      params.push(`%${recherche}%`);
      pIndex++;
    }

    query += ` ORDER BY b.created_at DESC LIMIT $${pIndex++} OFFSET $${pIndex++}`;
    params.push(parseInt(limit, 10), parseInt(offset, 10));

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      biens: rows
    });
  } catch (err) {
    console.error('[GET /api/biens/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des biens' });
  }
});

// ── POST /api/biens/agence/:slugOrId — Créer un bien immobilier ──
router.post('/agence/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      proprietaire_id,
      agent_id,
      reference,
      type_bien = 'appartement',
      sous_type,
      titre,
      description,
      adresse,
      quartier,
      ville = 'Dakar',
      region = 'Dakar',
      surface_m2,
      surface_terrain,
      nb_pieces = 1,
      nb_chambres = 1,
      nb_sdb = 1,
      nb_salons = 1,
      etage,
      ascenseur = false,
      parking = false,
      gardien = false,
      piscine = false,
      terrasse = false,
      balcon = false,
      climatisation = false,
      meuble = false,
      equipements = [],
      etat = 'bon',
      disponible_le,
      statut_occupation = 'disponible',
      prix_location,
      prix_vente,
      charges = 0,
      depot_garantie = 0,
      photos = [],
      videos = [],
      notes_internes
    } = req.body;

    if (!titre || titre.trim().length < 3) {
      return res.status(400).json({ success: false, error: 'Le titre du bien est obligatoire.' });
    }

    // Générer référence automatique si non fournie
    let ref = reference;
    if (!ref) {
      const prefix = (req.agence.nom || 'IMMO').substring(0, 3).toUpperCase();
      ref = `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    }

    const { rows } = await pool.query(
      `INSERT INTO biens_immo (
        agence_id, proprietaire_id, agent_id, reference, type_bien, sous_type,
        titre, description, adresse, quartier, ville, region,
        surface_m2, surface_terrain, nb_pieces, nb_chambres, nb_sdb, nb_salons, etage,
        ascenseur, parking, gardien, piscine, terrasse, balcon, climatisation, meuble,
        equipements, etat, disponible_le, statut_occupation,
        prix_location, prix_vente, charges, depot_garantie,
        photos, videos, notes_internes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31,
        $32, $33, $34, $35,
        $36, $37, $38
      ) RETURNING *`,
      [
        agenceId,
        proprietaire_id || null,
        agent_id || req.user.userId,
        ref,
        type_bien,
        sous_type || null,
        titre.trim(),
        description || null,
        adresse || null,
        quartier || null,
        ville.trim(),
        region.trim(),
        surface_m2 ? parseFloat(surface_m2) : null,
        surface_terrain ? parseFloat(surface_terrain) : null,
        nb_pieces ? parseInt(nb_pieces, 10) : 1,
        nb_chambres ? parseInt(nb_chambres, 10) : 1,
        nb_sdb ? parseInt(nb_sdb, 10) : 1,
        nb_salons ? parseInt(nb_salons, 10) : 1,
        etage ? parseInt(etage, 10) : null,
        !!ascenseur,
        !!parking,
        !!gardien,
        !!piscine,
        !!terrasse,
        !!balcon,
        !!climatisation,
        !!meuble,
        JSON.stringify(Array.isArray(equipements) ? equipements : []),
        etat || 'bon',
        disponible_le || null,
        statut_occupation || 'disponible',
        prix_location ? parseFloat(prix_location) : null,
        prix_vente ? parseFloat(prix_vente) : null,
        charges ? parseFloat(charges) : 0,
        depot_garantie ? parseFloat(depot_garantie) : 0,
        JSON.stringify(Array.isArray(photos) ? photos : []),
        JSON.stringify(Array.isArray(videos) ? videos : []),
        notes_internes || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Bien ajouté au portefeuille avec succès',
      bien: rows[0]
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de l'enregistrement du bien" });
  }
});

// ── GET /api/biens/agence/:slugOrId/:bienId — Fiche détaillée d'un bien ──
router.get('/agence/:slugOrId/:bienId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const { rows } = await pool.query(
      `SELECT b.*,
              p.nom AS proprietaire_nom, p.prenom AS proprietaire_prenom, p.telephone AS proprietaire_tel, p.whatsapp AS proprietaire_wa,
              u.nom AS agent_nom, u.email AS agent_email, u.telephone AS agent_tel,
              ai.id AS annonce_publiee_id, ai.actif AS annonce_publiee_actif, ai.sponsorisee AS annonce_sponsorisee
       FROM biens_immo b
       LEFT JOIN proprietaires_immo p ON b.proprietaire_id = p.id
       LEFT JOIN utilisateurs u ON b.agent_id = u.id
       LEFT JOIN annonces_immo ai ON ai.bien_id = b.id AND ai.supprimee = false
       WHERE b.id = $1 AND b.agence_id = $2`,
      [bienId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bien immobilier introuvable.' });
    }

    // Récupérer les visites associées
    const { rows: visites } = await pool.query(
      `SELECT v.*, c.nom AS contact_nom, c.prenom AS contact_prenom, c.telephone AS contact_tel
       FROM visites_immo v
       JOIN contacts_immo c ON v.contact_id = c.id
       WHERE v.bien_id = $1 ORDER BY v.date_visite DESC LIMIT 10`,
      [bienId]
    );

    // Récupérer les baux associés
    const { rows: baux } = await pool.query(
      `SELECT bx.*, c.nom AS locataire_nom, c.prenom AS locataire_prenom, c.telephone AS locataire_tel
       FROM baux_immo bx
       JOIN contacts_immo c ON bx.locataire_id = c.id
       WHERE bx.bien_id = $1 ORDER BY bx.date_debut DESC`,
      [bienId]
    );

    res.json({
      success: true,
      bien: rows[0],
      visites,
      baux
    });
  } catch (err) {
    console.error('[GET /api/biens/agence/:slugOrId/:bienId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement fiche bien' });
  }
});

// ── PUT /api/biens/agence/:slugOrId/:bienId — Mettre à jour un bien ──
router.put('/agence/:slugOrId/:bienId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;
    const data = req.body;

    const { rows } = await pool.query(
      `UPDATE biens_immo SET
        titre = COALESCE($1, titre),
        description = COALESCE($2, description),
        type_bien = COALESCE($3, type_bien),
        sous_type = COALESCE($4, sous_type),
        adresse = COALESCE($5, adresse),
        quartier = COALESCE($6, quartier),
        ville = COALESCE($7, ville),
        surface_m2 = COALESCE($8, surface_m2),
        nb_pieces = COALESCE($9, nb_pieces),
        nb_chambres = COALESCE($10, nb_chambres),
        nb_sdb = COALESCE($11, nb_sdb),
        statut_occupation = COALESCE($12, statut_occupation),
        prix_location = COALESCE($13, prix_location),
        prix_vente = COALESCE($14, prix_vente),
        charges = COALESCE($15, charges),
        depot_garantie = COALESCE($16, depot_garantie),
        photos = COALESCE($17::jsonb, photos),
        meuble = COALESCE($18, meuble),
        statut = COALESCE($19, statut),
        notes_internes = COALESCE($20, notes_internes),
        proprietaire_id = COALESCE($21, proprietaire_id),
        agent_id = COALESCE($22, agent_id),
        updated_at = NOW()
       WHERE id = $23 AND agence_id = $24
       RETURNING *`,
      [
        data.titre ? data.titre.trim() : null,
        data.description !== undefined ? data.description : null,
        data.type_bien || null,
        data.sous_type || null,
        data.adresse !== undefined ? data.adresse : null,
        data.quartier !== undefined ? data.quartier : null,
        data.ville || null,
        data.surface_m2 ? parseFloat(data.surface_m2) : null,
        data.nb_pieces ? parseInt(data.nb_pieces, 10) : null,
        data.nb_chambres ? parseInt(data.nb_chambres, 10) : null,
        data.nb_sdb ? parseInt(data.nb_sdb, 10) : null,
        data.statut_occupation || null,
        data.prix_location !== undefined ? (data.prix_location ? parseFloat(data.prix_location) : null) : null,
        data.prix_vente !== undefined ? (data.prix_vente ? parseFloat(data.prix_vente) : null) : null,
        data.charges !== undefined ? parseFloat(data.charges) : null,
        data.depot_garantie !== undefined ? parseFloat(data.depot_garantie) : null,
        data.photos ? JSON.stringify(data.photos) : null,
        data.meuble !== undefined ? !!data.meuble : null,
        data.statut || null,
        data.notes_internes !== undefined ? data.notes_internes : null,
        data.proprietaire_id !== undefined ? (data.proprietaire_id || null) : null,
        data.agent_id !== undefined ? (data.agent_id || null) : null,
        bienId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bien introuvable dans cette agence.' });
    }

    res.json({
      success: true,
      message: 'Bien mis à jour avec succès',
      bien: rows[0]
    });
  } catch (err) {
    console.error('[PUT /api/biens/agence/:slugOrId/:bienId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la mise à jour du bien' });
  }
});

// ── POST /api/biens/agence/:slugOrId/:bienId/publier — Publier ou synchroniser l'annonce publique ──
router.post('/agence/:slugOrId/:bienId/publier', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const { rows: bienRows } = await pool.query(
      `SELECT * FROM biens_immo WHERE id = $1 AND agence_id = $2`,
      [bienId, agenceId]
    );

    if (bienRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bien introuvable.' });
    }

    const bien = bienRows[0];
    const isLocation = !!bien.prix_location;
    const prix = isLocation ? bien.prix_location : (bien.prix_vente || 0);
    const transaction = isLocation ? 'location' : 'vente';

    // Vérifier si une annonce existe déjà pour ce bien
    const { rows: existingAds } = await pool.query(
      `SELECT id FROM annonces_immo WHERE bien_id = $1`,
      [bienId]
    );

    let adId;
    if (existingAds.length > 0) {
      adId = existingAds[0].id;
      await pool.query(
        `UPDATE annonces_immo SET
          titre = $1,
          type_bien = $2,
          transaction = $3,
          prix = $4,
          surface_m2 = $5,
          nb_pieces = $6,
          nb_chambres = $7,
          ville = $8,
          quartier = $9,
          description = $10,
          photos = $11,
          contact_nom = $12,
          contact_tel = $13,
          actif = true,
          supprimee = false,
          meuble = $14,
          updated_at = NOW()
         WHERE id = $15`,
        [
          bien.titre,
          bien.type_bien,
          transaction,
          prix,
          bien.surface_m2 ? Math.round(bien.surface_m2) : null,
          bien.nb_pieces,
          bien.nb_chambres,
          bien.ville,
          bien.quartier,
          bien.description,
          JSON.stringify(bien.photos || []),
          req.agence.nom,
          req.agence.telephone || req.agence.whatsapp,
          bien.meuble,
          adId
        ]
      );
    } else {
      const { rows: newAd } = await pool.query(
        `INSERT INTO annonces_immo (
          bien_id, agence_id, utilisateur_id, titre, type_bien, transaction,
          prix, surface_m2, nb_pieces, nb_chambres, ville, quartier,
          description, photos, source, actif, meuble, contact_nom, contact_tel
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12,
          $13, $14, 'utilisateur', true, $15, $16, $17
        ) RETURNING id`,
        [
          bien.id,
          agenceId,
          req.user.userId,
          bien.titre,
          bien.type_bien,
          transaction,
          prix,
          bien.surface_m2 ? Math.round(bien.surface_m2) : null,
          bien.nb_pieces,
          bien.nb_chambres,
          bien.ville,
          bien.quartier,
          bien.description,
          JSON.stringify(bien.photos || []),
          bien.meuble,
          req.agence.nom,
          req.agence.telephone || req.agence.whatsapp
        ]
      );
      adId = newAd[0].id;
    }

    res.json({
      success: true,
      message: 'Annonce publiée avec succès sur la marketplace Nopalou Immobilier',
      annonce_id: adId
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/:bienId/publier]', err.message);
    res.status(500).json({ success: false, error: "Erreur publication de l'annonce" });
  }
});

// ── GET /api/biens/agence/:slugOrId/:bienId/matching — Prospects matchés ──
router.get('/agence/:slugOrId/:bienId/matching', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const matches = await trouverProspectsPourBien(bienId, agenceId, 20);

    res.json({
      success: true,
      prospects_matches: matches
    });
  } catch (err) {
    console.error('[GET /api/biens/agence/:slugOrId/:bienId/matching]', err.message);
    res.status(500).json({ success: false, error: 'Erreur matching prospects' });
  }
});

module.exports = router;
