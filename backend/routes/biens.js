// backend/routes/biens.js
// Gestion du portefeuille de biens immobiliers et publication d'annonces

const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});
const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});
const { uploadBuffer, uploadVideoBuffer } = require('../services/cloudinary');
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const { trouverProspectsPourBien } = require('../services/matching-immo');
const { notifierMatchingProspectsAgenceWhatsApp } = require('../services/immo-whatsapp-notifications');

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
      `SELECT b.id, b.reference, b.titre, b.type_bien, b.description, b.ville, b.quartier, b.adresse,
              b.prix_location, b.charges, b.depot_garantie, b.prix_vente,
              b.surface_m2, b.nb_pieces, b.nb_chambres, b.nb_sdb, b.etage, b.meuble, b.equipements,
              b.photos, b.videos, b.statut_occupation, b.created_at,
              ai.id AS annonce_publiee_id
       FROM biens_immo b
       LEFT JOIN annonces_immo ai ON ai.bien_id = b.id AND ai.supprimee = false
       WHERE b.agence_id = $1 AND b.statut = 'actif' AND b.statut_occupation = 'disponible'
       ORDER BY b.created_at DESC`,
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

    const bienCree = rows[0];

    // Notification proactive de matching CRM WhatsApp (déclenchée en tâche de fond)
    setImmediate(async () => {
      try {
        const prospects = await trouverProspectsPourBien(bienCree.id, agenceId, 5);
        const qualifies = (prospects || []).filter(p => (p.score_matching || 0) >= 65);
        if (qualifies.length > 0) {
          await notifierMatchingProspectsAgenceWhatsApp({
            bien: bienCree,
            prospects: qualifies,
            agence: req.agence
          });
        }
      } catch (errMatch) {
        console.warn('[BIENS_MATCHING_POST_WARN]:', errMatch.message);
      }
    });

    res.status(201).json({
      success: true,
      message: 'Bien ajouté au portefeuille avec succès',
      bien: bienCree
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de l'enregistrement du bien" });
  }
});

// ── POST /api/biens/agence/:slugOrId/upload-photos — Téléversement de photos (multipart ou base64) ──
router.post('/agence/:slugOrId/upload-photos', verifierToken, requireAgenceAccess(), upload.array('photos', 10), async (req, res) => {
  try {
    const urls = [];

    // 1. Fichiers envoyés en multipart (f.buffer)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const url = await uploadBuffer(file.buffer, 'biens_immo');
          if (url) urls.push(url);
        } catch (uErr) {
          console.error('[UPLOAD_PHOTO_CLOUDINARY_ERR]', uErr.message);
        }
      }
    }

    // 2. Images envoyées en base64 JSON ({ images: [dataUrl, ...] } ou { photos: [...] })
    const base64List = (req.body && (req.body.images || req.body.photos)) || [];
    if (Array.isArray(base64List) && base64List.length > 0) {
      for (const item of base64List) {
        try {
          if (typeof item === 'string') {
            if (item.startsWith('http://') || item.startsWith('https://')) {
              urls.push(item);
            } else {
              const base64Data = item.replace(/^data:image\/\w+;base64,/, '');
              const buffer = Buffer.from(base64Data, 'base64');
              const url = await uploadBuffer(buffer, 'biens_immo');
              if (url) urls.push(url);
            }
          }
        } catch (bErr) {
          console.error('[UPLOAD_BASE64_PHOTO_ERR]', bErr.message);
        }
      }
    }

    res.json({
      success: true,
      urls,
      count: urls.length
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/upload-photos]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du téléversement des photos' });
  }
});

// ── POST /api/biens/agence/:slugOrId/upload-video — Téléversement ou enregistrement d'une vidéo ──
router.post('/agence/:slugOrId/upload-video', verifierToken, requireAgenceAccess(), uploadVideo.single('video'), async (req, res) => {
  try {
    let videoUrl = null;

    // 1. Fichier envoyé en multipart
    if (req.file && req.file.buffer) {
      try {
        videoUrl = await uploadVideoBuffer(req.file.buffer, 'biens_videos');
      } catch (vErr) {
        console.error('[UPLOAD_VIDEO_CLOUDINARY_ERR]', vErr.message);
      }
    }

    // 2. Vidéo transmise en URL externe (YouTube, TikTok, Reel, Matterport, MP4) ou base64
    const candidate = req.body && (req.body.video || req.body.url || req.body.videoUrl);
    if (!videoUrl && candidate && typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        videoUrl = trimmed;
      } else if (trimmed.startsWith('data:video/')) {
        try {
          const base64Data = trimmed.replace(/^data:video\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          videoUrl = await uploadVideoBuffer(buffer, 'biens_videos');
        } catch (bErr) {
          console.error('[UPLOAD_BASE64_VIDEO_ERR]', bErr.message);
        }
      }
    }

    if (!videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Aucune vidéo ou lien vidéo valide reçu (fournissez un fichier MP4/MOV ou un lien YouTube/TikTok/Reel).'
      });
    }

    res.json({
      success: true,
      url: videoUrl
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/upload-video]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors du traitement de la vidéo' });
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

function toParamNumber(val) {
  if (val === undefined) return null;
  if (val === null || val === '' || val === 'null') return 'null';
  const n = Number(val);
  return Number.isNaN(n) ? 'null' : String(n);
}

function toParamInt(val) {
  if (val === undefined) return null;
  if (val === null || val === '' || val === 'null') return 'null';
  const n = parseInt(val, 10);
  return Number.isNaN(n) ? 'null' : String(n);
}

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
        surface_m2 = CASE WHEN $8 = 'null' THEN NULL WHEN $8 IS NOT NULL THEN $8::numeric ELSE surface_m2 END,
        nb_pieces = CASE WHEN $9 = 'null' THEN NULL WHEN $9 IS NOT NULL THEN $9::integer ELSE nb_pieces END,
        nb_chambres = CASE WHEN $10 = 'null' THEN NULL WHEN $10 IS NOT NULL THEN $10::integer ELSE nb_chambres END,
        nb_sdb = CASE WHEN $11 = 'null' THEN NULL WHEN $11 IS NOT NULL THEN $11::integer ELSE nb_sdb END,
        statut_occupation = COALESCE($12, statut_occupation),
        prix_location = CASE WHEN $13 = 'null' THEN NULL WHEN $13 IS NOT NULL THEN $13::numeric ELSE prix_location END,
        prix_vente = CASE WHEN $14 = 'null' THEN NULL WHEN $14 IS NOT NULL THEN $14::numeric ELSE prix_vente END,
        charges = CASE WHEN $15 = 'null' THEN NULL WHEN $15 IS NOT NULL THEN $15::numeric ELSE charges END,
        depot_garantie = CASE WHEN $16 = 'null' THEN NULL WHEN $16 IS NOT NULL THEN $16::numeric ELSE depot_garantie END,
        photos = CASE WHEN $17::text IS NOT NULL THEN $17::jsonb ELSE photos END,
        videos = CASE WHEN $18::text IS NOT NULL THEN $18::jsonb ELSE videos END,
        meuble = COALESCE($19, meuble),
        statut = COALESCE($20, statut),
        notes_internes = COALESCE($21, notes_internes),
        proprietaire_id = CASE WHEN $22 = 'null' THEN NULL WHEN $22 IS NOT NULL THEN $22::uuid ELSE proprietaire_id END,
        agent_id = CASE WHEN $23 = 'null' THEN NULL WHEN $23 IS NOT NULL THEN $23::uuid ELSE agent_id END,
        ascenseur = COALESCE($24, ascenseur),
        parking = COALESCE($25, parking),
        gardien = COALESCE($26, gardien),
        piscine = COALESCE($27, piscine),
        terrasse = COALESCE($28, terrasse),
        balcon = COALESCE($29, balcon),
        climatisation = COALESCE($30, climatisation),
        etage = CASE WHEN $31 = 'null' THEN NULL WHEN $31 IS NOT NULL THEN $31::integer ELSE etage END,
        equipements = COALESCE($32::jsonb, equipements),
        updated_at = NOW()
       WHERE id = $33 AND agence_id = $34
       RETURNING *`,
      [
        data.titre ? data.titre.trim() : null,
        data.description !== undefined ? data.description : null,
        data.type_bien || null,
        data.sous_type || null,
        data.adresse !== undefined ? data.adresse : null,
        data.quartier !== undefined ? data.quartier : null,
        data.ville || null,
        toParamNumber(data.surface_m2),
        toParamInt(data.nb_pieces),
        toParamInt(data.nb_chambres),
        toParamInt(data.nb_sdb),
        data.statut_occupation || null,
        toParamNumber(data.prix_location),
        toParamNumber(data.prix_vente),
        toParamNumber(data.charges),
        toParamNumber(data.depot_garantie),
        data.photos !== undefined ? JSON.stringify(Array.isArray(data.photos) ? data.photos : []) : null,
        data.videos !== undefined ? JSON.stringify(Array.isArray(data.videos) ? data.videos : []) : null,
        data.meuble !== undefined ? !!data.meuble : null,
        data.statut || null,
        data.notes_internes !== undefined ? data.notes_internes : null,
        data.proprietaire_id !== undefined ? (data.proprietaire_id || 'null') : null,
        data.agent_id !== undefined ? (data.agent_id || 'null') : null,
        data.ascenseur !== undefined ? !!data.ascenseur : null,
        data.parking !== undefined ? !!data.parking : null,
        data.gardien !== undefined ? !!data.gardien : null,
        data.piscine !== undefined ? !!data.piscine : null,
        data.terrasse !== undefined ? !!data.terrasse : null,
        data.balcon !== undefined ? !!data.balcon : null,
        data.climatisation !== undefined ? !!data.climatisation : null,
        toParamInt(data.etage),
        data.equipements ? JSON.stringify(Array.isArray(data.equipements) ? data.equipements : []) : null,
        bienId,
        agenceId
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Bien introuvable dans cette agence.' });
    }

    const updatedBien = rows[0];

    // Synchronisation automatique de l'annonce si elle existe
    try {
      const isLocation = !!updatedBien.prix_location;
      const prix = isLocation ? updatedBien.prix_location : (updatedBien.prix_vente || 0);
      const transaction = isLocation ? 'location' : 'vente';

      await pool.query(
        `UPDATE annonces_immo SET
          titre = $1,
          description = $2,
          type_bien = $3,
          transaction = $4,
          prix = $5,
          surface_m2 = $6,
          nb_pieces = $7,
          nb_chambres = $8,
          ville = $9,
          quartier = $10,
          meuble = $11,
          photos = COALESCE($12::jsonb, photos),
          updated_at = NOW()
         WHERE bien_id = $13 AND agence_id = $14`,
        [
          updatedBien.titre,
          updatedBien.description,
          updatedBien.type_bien,
          transaction,
          prix,
          updatedBien.surface_m2 ? Math.round(updatedBien.surface_m2) : null,
          updatedBien.nb_pieces,
          updatedBien.nb_chambres,
          updatedBien.ville,
          updatedBien.quartier,
          updatedBien.meuble,
          updatedBien.photos ? JSON.stringify(updatedBien.photos) : null,
          bienId,
          agenceId
        ]
      );
    } catch (eSync) {
      console.warn('[SYNC_ANNONCE_WARN]', eSync.message);
    }

    res.json({
      success: true,
      message: 'Bien mis à jour avec succès',
      bien: updatedBien
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

// ── DELETE /api/biens/agence/:slugOrId/:bienId — Supprimer ou archiver un bien ──
router.delete('/agence/:slugOrId/:bienId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const { rows: bienRows } = await pool.query(
      `SELECT * FROM biens_immo WHERE id = $1 AND agence_id = $2`,
      [bienId, agenceId]
    );
    if (!bienRows[0]) {
      return res.status(404).json({ success: false, error: 'Bien introuvable ou non autorisé.' });
    }

    // Vérifier les baux actifs rattachés
    const { rows: bauxActifs } = await pool.query(
      `SELECT count(*) FROM baux_immo WHERE bien_id = $1 AND statut = 'actif'`,
      [bienId]
    );
    const hasActiveBail = parseInt(bauxActifs[0]?.count || 0, 10) > 0;

    // Dépublier toute annonce marketplace rattachée
    await pool.query(
      `UPDATE annonces_immo SET actif = false, supprimee = true WHERE bien_id = $1`,
      [bienId]
    );

    if (hasActiveBail) {
      // Archivage sécurisé pour préserver l'historique comptable et locatif
      await pool.query(
        `UPDATE biens_immo SET statut = 'archive', updated_at = NOW() WHERE id = $1`,
        [bienId]
      );
      return res.json({
        success: true,
        message: 'Le bien comporte un bail en cours. Il a été archivé et retiré de la vente/location.',
        mode: 'archive'
      });
    }

    // Tentative de suppression définitive si aucun lien étranger bloquant
    try {
      await pool.query(`DELETE FROM biens_immo WHERE id = $1 AND agence_id = $2`, [bienId, agenceId]);
      res.json({ success: true, message: 'Bien supprimé avec succès.', mode: 'delete' });
    } catch (fkErr) {
      await pool.query(
        `UPDATE biens_immo SET statut = 'archive', updated_at = NOW() WHERE id = $1`,
        [bienId]
      );
      res.json({
        success: true,
        message: 'Bien archivé avec succès (conservé pour historique).',
        mode: 'archive'
      });
    }
  } catch (err) {
    console.error('[DELETE /api/biens/agence/:slugOrId/:bienId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du bien' });
  }
});

// ── POST /api/biens/agence/:slugOrId/:bienId/archiver — Basculer l'état archive/actif ──
router.post('/agence/:slugOrId/:bienId/archiver', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const { rows: bienRows } = await pool.query(
      `SELECT id, statut FROM biens_immo WHERE id = $1 AND agence_id = $2`,
      [bienId, agenceId]
    );
    if (!bienRows[0]) {
      return res.status(404).json({ success: false, error: 'Bien introuvable.' });
    }

    const newStatut = bienRows[0].statut === 'archive' ? 'actif' : 'archive';
    await pool.query(`UPDATE biens_immo SET statut = $1, updated_at = NOW() WHERE id = $2`, [newStatut, bienId]);

    // Si archivé, dépublier l'annonce
    if (newStatut === 'archive') {
      await pool.query(`UPDATE annonces_immo SET actif = false, supprimee = true WHERE bien_id = $1`, [bienId]);
    }

    res.json({
      success: true,
      statut: newStatut,
      message: newStatut === 'archive' ? 'Bien archivé.' : 'Bien réactivé.'
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/:bienId/archiver]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de l'archivage du bien" });
  }
});

// ── POST /api/biens/agence/:slugOrId/:bienId/dupliquer — Dupliquer un bien existant ──
router.post('/agence/:slugOrId/:bienId/dupliquer', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { bienId } = req.params;

    const { rows: bRows } = await pool.query(
      `SELECT * FROM biens_immo WHERE id = $1 AND agence_id = $2`,
      [bienId, agenceId]
    );
    if (!bRows[0]) {
      return res.status(404).json({ success: false, error: 'Bien source introuvable.' });
    }

    const b = bRows[0];
    const newRef = `REF-${Math.floor(1000 + Math.random() * 9000)}-CP`;
    const newTitre = `${b.titre} (Copie)`;

    const { rows: dupRows } = await pool.query(
      `INSERT INTO biens_immo (
        agence_id, proprietaire_id, agent_id, reference, type_bien, sous_type,
        titre, description, adresse, quartier, ville, region, pays,
        surface_m2, surface_terrain, nb_pieces, nb_chambres, nb_sdb, nb_salons,
        etage, nb_etages, ascenseur, parking, gardien, piscine, terrasse, balcon,
        climatisation, meuble, equipements, etat, annee_construction,
        prix_location, prix_vente, charges, depot_garantie, photos, videos,
        statut_occupation, statut, notes_internes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19,
        $20, $21, $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34, $35, $36, $37, $38,
        'disponible', 'actif', $39
      ) RETURNING *`,
      [
        agenceId, b.proprietaire_id, b.agent_id, newRef, b.type_bien, b.sous_type,
        newTitre, b.description, b.adresse, b.quartier, b.ville, b.region, b.pays,
        b.surface_m2, b.surface_terrain, b.nb_pieces, b.nb_chambres, b.nb_sdb, b.nb_salons,
        b.etage, b.nb_etages, b.ascenseur, b.parking, b.gardien, b.piscine, b.terrasse, b.balcon,
        b.climatisation, b.meuble, JSON.stringify(b.equipements || []), b.etat, b.annee_construction,
        b.prix_location, b.prix_vente, b.charges, b.depot_garantie, JSON.stringify(b.photos || []), JSON.stringify(b.videos || []),
        b.notes_internes
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Bien dupliqué avec succès.',
      bien: dupRows[0]
    });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/:bienId/dupliquer]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la duplication du bien' });
  }
});

// ── POST /api/biens/agence/:slugOrId/batch — Actions par lot sur biens immobiliers ──
router.post('/agence/:slugOrId/batch', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { action, bienIds } = req.body;

    if (!Array.isArray(bienIds) || bienIds.length === 0) {
      return res.status(400).json({ success: false, error: 'Aucun bien sélectionné.' });
    }

    if (action === 'archiver') {
      await pool.query(
        `UPDATE biens_immo SET statut = 'archive', updated_at = NOW()
         WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
        [bienIds, agenceId]
      );
      // Désactiver également les annonces associées
      await pool.query(
        `UPDATE annonces_immo SET actif = false, updated_at = NOW()
         WHERE bien_id = ANY($1::uuid[])`,
        [bienIds]
      );
      return res.json({ success: true, message: `${bienIds.length} bien(s) archivé(s) avec succès.` });
    }

    if (action === 'desarchiver') {
      await pool.query(
        `UPDATE biens_immo SET statut = 'actif', updated_at = NOW()
         WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
        [bienIds, agenceId]
      );
      return res.json({ success: true, message: `${bienIds.length} bien(s) réactivé(s) avec succès.` });
    }

    if (action === 'publier') {
      // Activer les annonces pour les biens sélectionnés
      for (const bienId of bienIds) {
        const { rows: bRows } = await pool.query(
          `SELECT * FROM biens_immo WHERE id = $1 AND agence_id = $2`,
          [bienId, agenceId]
        );
        if (bRows.length > 0) {
          const b = bRows[0];
          const prix = b.prix_location || b.prix_vente || 0;
          const typeTx = b.prix_vente && !b.prix_location ? 'vente' : 'location';

          const { rows: exist } = await pool.query(
            `SELECT id FROM annonces_immo WHERE bien_id = $1`,
            [bienId]
          );

          if (exist.length > 0) {
            await pool.query(
              `UPDATE annonces_immo SET actif = true, supprimee = false, updated_at = NOW()
               WHERE bien_id = $1`,
              [bienId]
            );
          } else {
            await pool.query(
              `INSERT INTO annonces_immo (
                agence_id, bien_id, titre, type_bien, transaction, prix, charges,
                ville, quartier, surface_m2, nb_pieces, nb_chambres, nb_sdb, meuble,
                photos, actif, reference
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16)`,
              [
                agenceId, bienId, b.titre, b.type_bien, typeTx, prix, b.charges || 0,
                b.ville, b.quartier, b.surface_m2, b.nb_pieces, b.nb_chambres, b.nb_sdb, b.meuble,
                JSON.stringify(b.photos || []), b.reference
              ]
            );
          }
        }
      }
      return res.json({ success: true, message: `${bienIds.length} annonce(s) publiée(s) sur la marketplace.` });
    }

    if (action === 'supprimer') {
      await pool.query(
        `UPDATE annonces_immo SET supprimee = true, actif = false, updated_at = NOW()
         WHERE bien_id = ANY($1::uuid[])`,
        [bienIds]
      );
      await pool.query(
        `DELETE FROM biens_immo WHERE id = ANY($1::uuid[]) AND agence_id = $2`,
        [bienIds, agenceId]
      );
      return res.json({ success: true, message: `${bienIds.length} bien(s) supprimé(s).` });
    }

    res.status(400).json({ success: false, error: 'Action par lot inconnue.' });
  } catch (err) {
    console.error('[POST /api/biens/agence/:slugOrId/batch]', err.message);
    res.status(500).json({ success: false, error: 'Erreur traitement action par lot' });
  }
});

module.exports = router;

