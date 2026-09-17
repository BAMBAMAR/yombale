// backend/routes/agences.js
// Gestion des agences immobilières Nopalou, membres et statistiques

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');
const multer = require('multer');
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});
const { uploadBuffer } = require('../services/cloudinary');

function multerAgenceFields(req, res, next) {
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      console.error('[AGENCES PUT MULTER]', err.code, err.message);
      return res.status(400).json({ success: false, error: err.message || 'Erreur upload fichier' });
    }
    next();
  });
}

const cfg = require('../lib/settingsCache');

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function checkAgenceQuota(userId, telephoneInput = '', emailInput = '') {
  const maxCompte = (await cfg.getNum('max_agences_par_compte')) || 1;
  const maxTel = (await cfg.getNum('max_agences_par_telephone')) || 1;
  const tarifMulti = (await cfg.getNum('tarif_agence_supplementaire')) || 15000;
  const labelMulti = (await cfg.get('immo_multi_agence_label')) || 'Option Réseau Multi-Agences';

  let userLimit = maxCompte;
  try {
    const userOverrideRes = await pool.query(
      `SELECT max_agences_override FROM agences_immo WHERE utilisateur_id = $1 AND max_agences_override IS NOT NULL ORDER BY max_agences_override DESC LIMIT 1`,
      [userId]
    );
    if (userOverrideRes.rows[0]?.max_agences_override != null) {
      userLimit = Math.max(userLimit, parseInt(userOverrideRes.rows[0].max_agences_override, 10));
    }
  } catch (_) {}

  try {
    const aboRes = await pool.query(
      `SELECT plan FROM abonnements WHERE utilisateur_id = $1 AND statut = 'actif' AND fin > NOW() AND plan IN ('business', 'multi_agence', 'reseau') LIMIT 1`,
      [userId]
    );
    if (aboRes.rows.length > 0) {
      userLimit = 10;
    }
  } catch (_) {}

  const cntCompte = await pool.query(
    `SELECT COUNT(*) FROM agences_immo WHERE utilisateur_id = $1`,
    [userId]
  );
  const totalCreees = parseInt(cntCompte.rows[0].count, 10);

  if (totalCreees >= userLimit) {
    return {
      allowed: false,
      quotaMax: userLimit,
      quotaUtilise: totalCreees,
      tarifMulti,
      labelMulti,
      error: `Limite de ${userLimit} agence(s) atteinte pour votre compte. La création d'une agence supplémentaire requiert l'${labelMulti} (${tarifMulti.toLocaleString('fr-FR')} FCFA/mois). Veuillez contacter l'administration ou activer l'option multi-agences.`
    };
  }

  const inputTelRaw = telephoneInput?.trim() || '';
  const cleanTel = inputTelRaw.replace(/\D/g, '').slice(-9);
  const userEmailRaw = (emailInput || '').trim().toLowerCase();

  if (cleanTel || userEmailRaw) {
    try {
      const cntTel = await pool.query(
        `SELECT COUNT(DISTINCT a.id)
         FROM agences_immo a
         JOIN utilisateurs u ON a.utilisateur_id = u.id
         WHERE (
           ($1::text != '' AND (
             RIGHT(REGEXP_REPLACE(COALESCE(u.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
             OR
             RIGHT(REGEXP_REPLACE(COALESCE(a.telephone, ''), '[^0-9]', '', 'g'), 9) = $1
           ))
           OR
           ($2::text != '' AND LOWER(COALESCE(u.email, '')) = $2)
         )`,
        [cleanTel, userEmailRaw]
      );
      const totalTrouvees = parseInt(cntTel.rows[0].count, 10);
      if (totalTrouvees >= maxTel && userLimit <= maxCompte) {
        return {
          allowed: false,
          quotaMax: userLimit,
          quotaUtilise: totalTrouvees,
          tarifMulti,
          labelMulti,
          error: `Limite atteinte : ${totalTrouvees} agence(s) sont déjà enregistrées avec ce numéro de téléphone ou e-mail. La création d'une nouvelle agence requiert l'${labelMulti} (${tarifMulti.toLocaleString('fr-FR')} FCFA/mois).`
        };
      }
    } catch (_) {}
  }

  return {
    allowed: true,
    quotaMax: userLimit,
    quotaUtilise: totalCreees,
    tarifMulti,
    labelMulti
  };
}

// ── GET /api/agences/mine — Liste des agences de l'utilisateur connecté ──
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const quotaInfo = await checkAgenceQuota(userId);
    const { rows } = await pool.query(
      `SELECT a.*, 
              COALESCE(am.role, 'admin_agence') AS mon_role,
              (a.utilisateur_id = $1) AS is_owner,
              (a.sponsorise = true AND (a.sponsor_jusqu_au IS NULL OR a.sponsor_jusqu_au > NOW())) AS est_sponsorise_actif,
              (SELECT COUNT(*) FROM biens_immo b WHERE b.agence_id = a.id AND b.statut = 'actif') AS nb_biens,
              (SELECT COUNT(*) FROM contacts_immo c WHERE c.agence_id = a.id AND c.type_contact = 'prospect' AND c.statut_crm NOT IN ('gagne', 'perdu')) AS nb_prospects_actifs
       FROM agences_immo a
       LEFT JOIN agence_membres am ON a.id = am.agence_id AND am.utilisateur_id = $1 AND am.actif = true
       WHERE a.utilisateur_id = $1 OR am.id IS NOT NULL
       ORDER BY (a.sponsorise = true AND (a.sponsor_jusqu_au IS NULL OR a.sponsor_jusqu_au > NOW())) DESC, a.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      agences: rows,
      quotas: {
        max_agences: quotaInfo.quotaMax,
        agences_creees: quotaInfo.quotaUtilise,
        peut_creer: quotaInfo.allowed,
        tarif_multi_agence: quotaInfo.tarifMulti,
        label_multi_agence: quotaInfo.labelMulti
      }
    });
  } catch (err) {
    console.error('[GET /api/agences/mine]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des agences' });
  }
});

// ── POST /api/agences — Créer une nouvelle agence ──
router.post('/', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      nom,
      description,
      logo_url,
      adresse,
      ville = 'Dakar',
      quartier,
      telephone,
      whatsapp,
      email_contact,
      site_web,
      numero_agrement,
      parametres = {}
    } = req.body;

    if (!nom || nom.trim().length < 2) {
      return res.status(400).json({ success: false, error: "Le nom de l'agence est requis (min 2 caractères)." });
    }

    // Contrôle strict des quotas (1 agence max par défaut)
    const userRes = await pool.query('SELECT email, telephone FROM utilisateurs WHERE id=$1', [userId]);
    const currentUser = userRes.rows[0] || {};
    const inputTelRaw = telephone?.trim() || currentUser.telephone?.trim() || '';
    const userEmailRaw = (email_contact || currentUser.email || '').trim().toLowerCase();

    const quotaCheck = await checkAgenceQuota(userId, inputTelRaw, userEmailRaw);
    if (!quotaCheck.allowed) {
      return res.status(400).json({ success: false, error: quotaCheck.error, quotas: quotaCheck });
    }

    let baseSlug = slugify(nom);
    if (!baseSlug) baseSlug = 'agence-' + Date.now().toString(36);
    let slug = baseSlug;
    let count = 1;

    // Assurer l'unicité du slug
    while (true) {
      const { rows } = await pool.query(`SELECT id FROM agences_immo WHERE slug = $1`, [slug]);
      if (rows.length === 0) break;
      slug = `${baseSlug}-${count++}`;
    }

    const { rows: agenceRows } = await pool.query(
      `INSERT INTO agences_immo (
        utilisateur_id, nom, slug, description, logo_url, adresse, ville, quartier,
        telephone, whatsapp, email_contact, site_web, numero_agrement, parametres
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        userId,
        nom.trim(),
        slug,
        description || null,
        logo_url || null,
        adresse || null,
        ville.trim(),
        quartier || null,
        telephone || null,
        whatsapp || null,
        email_contact || null,
        site_web || null,
        numero_agrement || null,
        JSON.stringify(parametres)
      ]
    );

    const agence = agenceRows[0];

    // Créer le membre admin_agence fondateur
    await pool.query(
      `INSERT INTO agence_membres (agence_id, utilisateur_id, role, permissions, actif)
       VALUES ($1, $2, 'admin_agence', '{"all": true}'::jsonb, true)
       ON CONFLICT (agence_id, utilisateur_id) DO NOTHING`,
      [agence.id, userId]
    );

    res.status(201).json({
      success: true,
      message: 'Agence créée avec succès',
      agence
    });
  } catch (err) {
    console.error('[POST /api/agences]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de la création de l'agence" });
  }
});

// ── GET /api/agences/public — Annuaire public des agences immobilières ──
router.get('/public', async (req, res) => {
  try {
    const { ville, recherche } = req.query;
    let query = `
      SELECT a.id, a.nom, a.slug, a.description, a.logo_url, a.adresse, a.ville, a.quartier,
             a.telephone, a.whatsapp, a.email_contact, a.site_web, a.numero_agrement,
             a.parametres, a.statut, a.created_at,
             a.sponsorise, a.sponsor_jusqu_au,
             (a.sponsorise = true AND (a.sponsor_jusqu_au IS NULL OR a.sponsor_jusqu_au > NOW())) AS est_sponsorise_actif,
             (SELECT COUNT(*) FROM biens_immo b WHERE b.agence_id = a.id AND b.statut = 'actif' AND b.statut_occupation = 'disponible') AS nb_biens_disponibles
      FROM agences_immo a
      WHERE a.statut = 'actif'
    `;
    const params = [];
    let pIdx = 1;

    if (ville) {
      query += ` AND a.ville ILIKE $${pIdx++}`;
      params.push(`%${ville}%`);
    }
    if (recherche) {
      query += ` AND (a.nom ILIKE $${pIdx} OR a.description ILIKE $${pIdx} OR a.quartier ILIKE $${pIdx})`;
      params.push(`%${recherche}%`);
      pIdx++;
    }

    query += ` ORDER BY (a.sponsorise = true AND (a.sponsor_jusqu_au IS NULL OR a.sponsor_jusqu_au > NOW())) DESC, nb_biens_disponibles DESC, a.created_at DESC`;

    const { rows } = await pool.query(query, params);

    res.json({
      success: true,
      agences: rows
    });
  } catch (err) {
    console.error('[GET /api/agences/public]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement annuaire agences' });
  }
});

// ── GET /api/agences/public/:slugOrId — Récupérer la vitrine publique d'une agence (Accessible à tous) ──
router.get('/public/:slugOrId', async (req, res) => {
  try {
    const { slugOrId } = req.params;
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    const query = isUUID
      ? `SELECT id, nom, slug, description, logo_url, adresse, ville, quartier, telephone, whatsapp, email_contact, site_web, numero_agrement, parametres, statut FROM agences_immo WHERE id = $1`
      : `SELECT id, nom, slug, description, logo_url, adresse, ville, quartier, telephone, whatsapp, email_contact, site_web, numero_agrement, parametres, statut FROM agences_immo WHERE slug = $1`;

    const { rows } = await pool.query(query, [slugOrId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Agence introuvable' });
    }

    res.json({
      success: true,
      agence: rows[0]
    });
  } catch (err) {
    console.error('[GET /api/agences/public/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement vitrine agence' });
  }
});

// ── GET /api/agences/:slugOrId — Récupérer le profil d'une agence ──
router.get('/:slugOrId', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    res.json({
      success: true,
      agence: req.agence,
      mon_acces: req.agenceMembre
    });
  } catch (err) {
    console.error('[GET /api/agences/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement profil agence' });
  }
});

// ── PUT /api/agences/:slugOrId — Mettre à jour les paramètres de l'agence ──
router.put('/:slugOrId', verifierToken, requireAgenceAccess('admin_agence'), multerAgenceFields, async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      nom,
      description,
      adresse,
      ville,
      quartier,
      telephone,
      whatsapp,
      email_contact,
      site_web,
      numero_agrement,
    } = req.body;

    let logo_url = req.body.logo_url;
    if (req.files?.logo?.[0]) {
      try {
        logo_url = await uploadBuffer(req.files.logo[0].buffer, 'agences_logo');
      } catch (err) {
        console.error('[UPLOAD_LOGO_ERR]', err.message);
      }
    }

    let parametres = req.body.parametres;
    if (typeof parametres === 'string') {
      try {
        parametres = JSON.parse(parametres);
      } catch (e) {
        parametres = null;
      }
    }

    let cover_url = req.body.cover_url;
    if (req.files?.cover?.[0]) {
      try {
        cover_url = await uploadBuffer(req.files.cover[0].buffer, 'agences_cover');
      } catch (err) {
        console.error('[UPLOAD_COVER_ERR]', err.message);
      }
    }

    if (parametres) {
      if (!parametres.studio) parametres.studio = {};
      if (cover_url) parametres.studio.cover_url = cover_url;
      if (logo_url) parametres.studio.logo_url = logo_url;
    }

    const { rows } = await pool.query(
      `UPDATE agences_immo SET
        nom = COALESCE($1, nom),
        description = COALESCE($2, description),
        logo_url = COALESCE($3, logo_url),
        adresse = COALESCE($4, adresse),
        ville = COALESCE($5, ville),
        quartier = COALESCE($6, quartier),
        telephone = COALESCE($7, telephone),
        whatsapp = COALESCE($8, whatsapp),
        email_contact = COALESCE($9, email_contact),
        site_web = COALESCE($10, site_web),
        numero_agrement = COALESCE($11, numero_agrement),
        parametres = COALESCE($12::jsonb, parametres),
        updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [
        nom ? nom.trim() : null,
        description !== undefined ? description : null,
        logo_url !== undefined ? logo_url : null,
        adresse !== undefined ? adresse : null,
        ville ? ville.trim() : null,
        quartier !== undefined ? quartier : null,
        telephone !== undefined ? telephone : null,
        whatsapp !== undefined ? whatsapp : null,
        email_contact !== undefined ? email_contact : null,
        site_web !== undefined ? site_web : null,
        numero_agrement !== undefined ? numero_agrement : null,
        parametres ? JSON.stringify(parametres) : null,
        agenceId
      ]
    );

    res.json({
      success: true,
      message: 'Agence mise à jour avec succès',
      agence: rows[0]
    });
  } catch (err) {
    console.error('[PUT /api/agences/:slugOrId]', err.message);
    res.status(500).json({ success: false, error: "Erreur mise à jour de l'agence" });
  }
});

// ── POST /api/agences/:slugOrId/sponsoring — Initier la mise en avant (Sponsoring Wave 30 jours) ──
router.post('/:slugOrId/sponsoring', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const wave = require('../services/wave');
    const montant = (await cfg.getNum('prix_sponsoring_agence')) || (await cfg.getNum('prix_sponsoring')) || 5000;
    const clientRef = `spimmo_${agenceId}_${Date.now()}`;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';

    const session = await wave.createCheckoutSession({
      amount: montant,
      currency: 'XOF',
      success_url: `${frontendUrl}/agence/${req.agence.slug}/abonnement?sponsoring=success`,
      error_url: `${frontendUrl}/agence/${req.agence.slug}/abonnement?sponsoring=error`,
      client_reference: clientRef,
    });

    res.json({
      success: true,
      wave_url: session.wave_url,
      session_id: session.session_id,
      montant,
      duree_jours: 30
    });
  } catch (err) {
    console.error('[SPONSORING_AGENCE_ERR]', err.message);
    res.json({
      success: false,
      fallback_manuel: true,
      error: err.message || "Erreur initialisation Wave",
      numero_depot: '777202086',
      reference: `spimmo_${req.agence.id}`,
      montant: 5000
    });
  }
});

// ── POST /api/agences/:slugOrId/activer-sponsoring-direct — Activation directe sponsoring (30 jours) ──
router.post('/:slugOrId/activer-sponsoring-direct', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const { duree_jours = 30 } = req.body;
    const agenceId = req.agence.id;
    const until = new Date(Date.now() + Number(duree_jours) * 24 * 60 * 60 * 1000).toISOString();

    const { rows } = await pool.query(
      `UPDATE agences_immo SET sponsorise = true, sponsor_jusqu_au = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [until, agenceId]
    );

    res.json({
      success: true,
      message: 'Mise en avant activée avec succès',
      agence: rows[0]
    });
  } catch (err) {
    console.error('[ACTIVER_SPONSORING_DIRECT_ERR]', err.message);
    res.status(500).json({ success: false, error: 'Erreur activation du sponsoring' });
  }
});

// ── GET /api/agences/:slugOrId/stats — KPIs exécutifs temps réel ──
router.get('/:slugOrId/stats', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    // 1. Biens & Annonces
    const { rows: biensStats } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE statut = 'actif') AS nb_biens_actifs,
        COUNT(*) FILTER (WHERE statut = 'actif' AND statut_occupation = 'disponible') AS nb_biens_disponibles,
        COUNT(*) FILTER (WHERE statut = 'actif' AND statut_occupation = 'loue') AS nb_biens_loues,
        COUNT(*) FILTER (WHERE statut = 'actif' AND statut_occupation = 'vendu') AS nb_biens_vendus
       FROM biens_immo 
       WHERE agence_id = $1`,
      [agenceId]
    );

    const { rows: annoncesStats } = await pool.query(
      `SELECT COUNT(*) AS nb_annonces_publiees
       FROM annonces_immo
       WHERE agence_id = $1 AND actif = true AND supprimee = false`,
      [agenceId]
    );

    // 2. Visites du jour & à venir
    const { rows: visitesStats } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE date_visite::date = CURRENT_DATE AND statut NOT IN ('annulee')) AS visites_aujourdhui,
        COUNT(*) FILTER (WHERE date_visite >= NOW() AND statut NOT IN ('annulee', 'realisee')) AS visites_a_venir
       FROM visites_immo
       WHERE agence_id = $1`,
      [agenceId]
    );

    // 3. CRM & Prospects
    const { rows: prospectsStats } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE statut_crm NOT IN ('gagne', 'perdu')) AS prospects_actifs,
        COUNT(*) FILTER (WHERE statut_crm = 'nouveau') AS prospects_nouveaux,
        COUNT(*) FILTER (WHERE statut_crm = 'visite_programmee') AS prospects_en_visite,
        COUNT(*) FILTER (WHERE statut_crm = 'offre') AS prospects_offre
       FROM contacts_immo
       WHERE agence_id = $1 AND type_contact = 'prospect'`,
      [agenceId]
    );

    // 4. Loyers & Impayés
    const { rows: loyersStats } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE statut IN ('retard', 'impaye')) AS nb_impayes,
        COALESCE(SUM(montant_restant) FILTER (WHERE statut IN ('retard', 'impaye')), 0) AS montant_impayes,
        COALESCE(SUM(montant_du) FILTER (WHERE periode = $2), 0) AS loyers_attendus_mois,
        COALESCE(SUM(montant_paye) FILTER (WHERE periode = $2), 0) AS loyers_encaisses_mois
       FROM loyers_echeances
       WHERE agence_id = $1`,
      [agenceId, currentMonth]
    );

    // 5. Baux actifs
    const { rows: bauxStats } = await pool.query(
      `SELECT COUNT(*) AS nb_baux_actifs
       FROM baux_immo
       WHERE agence_id = $1 AND statut = 'actif'`,
      [agenceId]
    );

    res.json({
      success: true,
      stats: {
        biens: {
          actifs: Number(biensStats[0]?.nb_biens_actifs || 0),
          disponibles: Number(biensStats[0]?.nb_biens_disponibles || 0),
          loues: Number(biensStats[0]?.nb_biens_loues || 0),
          vendus: Number(biensStats[0]?.nb_biens_vendus || 0),
          annonces_publiees: Number(annoncesStats[0]?.nb_annonces_publiees || 0)
        },
        visites: {
          aujourdhui: Number(visitesStats[0]?.visites_aujourdhui || 0),
          a_venir: Number(visitesStats[0]?.visites_a_venir || 0)
        },
        crm: {
          prospects_actifs: Number(prospectsStats[0]?.prospects_actifs || 0),
          nouveaux: Number(prospectsStats[0]?.prospects_nouveaux || 0),
          en_visite: Number(prospectsStats[0]?.prospects_en_visite || 0),
          offre: Number(prospectsStats[0]?.prospects_offre || 0)
        },
        locatif: {
          baux_actifs: Number(bauxStats[0]?.nb_baux_actifs || 0),
          nb_impayes: Number(loyersStats[0]?.nb_impayes || 0),
          montant_impayes: Number(loyersStats[0]?.montant_impayes || 0),
          loyers_attendus_mois: Number(loyersStats[0]?.loyers_attendus_mois || 0),
          loyers_encaisses_mois: Number(loyersStats[0]?.loyers_encaisses_mois || 0)
        }
      }
    });
  } catch (err) {
    console.error('[GET /api/agences/:slugOrId/stats]', err.message);
    res.status(500).json({ success: false, error: 'Erreur calcul statistiques agence' });
  }
});

// ── GET /api/agences/:slugOrId/membres — Liste des membres de l'équipe ──
router.get('/:slugOrId/membres', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { rows } = await pool.query(
      `SELECT am.*, u.nom AS utilisateur_nom, u.prenom AS utilisateur_prenom, u.email AS utilisateur_email, u.telephone AS utilisateur_tel
       FROM agence_membres am
       JOIN utilisateurs u ON am.utilisateur_id = u.id
       WHERE am.agence_id = $1
       ORDER BY am.created_at ASC`,
      [agenceId]
    );

    res.json({
      success: true,
      membres: rows
    });
  } catch (err) {
    console.error('[GET /api/agences/:slugOrId/membres]', err.message);
    res.status(500).json({ success: false, error: 'Erreur chargement des membres' });
  }
});

// ── POST /api/agences/:slugOrId/membres — Ajouter un collaborateur ou courtier partenaire ──
router.post('/:slugOrId/membres', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      utilisateur_id,
      emailOrPhone,
      email,
      telephone,
      nom,
      prenom,
      role = 'courtier',
      permissions = {},
      cabinet,
      specialite,
      partage_taux_commission,
      commission_taux,
    } = req.body;

    let targetUser = null;
    if (utilisateur_id) {
      const { rows: uRows } = await pool.query(
        `SELECT id, nom, prenom, email, telephone FROM utilisateurs WHERE id = $1`,
        [utilisateur_id]
      );
      if (uRows.length > 0) {
        targetUser = uRows[0];
      }
    }

    const identifier = (email || telephone || emailOrPhone || targetUser?.email || targetUser?.telephone || '').trim();
    if (!targetUser && !identifier && !nom) {
      return res.status(400).json({ success: false, error: "Identifiant (email, téléphone ou nom) requis." });
    }

    const searchEmail = (email || (identifier.includes('@') ? identifier : (targetUser?.email || ''))).trim();
    const searchTel = (telephone || (!identifier.includes('@') ? identifier : (targetUser?.telephone || ''))).trim();

    // 1. Chercher si l'utilisateur existe déjà
    if (!targetUser && (searchEmail || searchTel)) {
      const { rows: userRows } = await pool.query(
        `SELECT id, nom, prenom, email, telephone FROM utilisateurs 
         WHERE (LOWER(email) = LOWER($1) AND $1 <> '') OR (telephone = $2 AND $2 <> '')`,
        [searchEmail, searchTel]
      );
      if (userRows.length > 0) {
        targetUser = userRows[0];
      }
    }

    // 2. Si non trouvé, créer le compte automatiquement (invitation directe)
    if (!targetUser) {
      const userNom = (nom || (searchEmail ? searchEmail.split('@')[0] : 'Partenaire')).trim();
      const userPrenom = (prenom || '').trim();
      const finalEmail = searchEmail || `contact_${Date.now()}@agence.nopalou.sn`;
      const finalTel = searchTel || null;

      const randomPass = crypto.randomBytes(16).toString('hex');
      const hash = await bcrypt.hash(randomPass, 10);

      const { rows: newUserRows } = await pool.query(
        `INSERT INTO utilisateurs (nom, prenom, email, telephone, mot_de_passe_hash, est_apporteur, email_verifie)
         VALUES ($1, $2, $3, $4, $5, $6, true)
         RETURNING id, nom, prenom, email, telephone`,
        [userNom, userPrenom, finalEmail, finalTel, hash, role === 'courtier']
      );
      targetUser = newUserRows[0];
    } else if (nom || prenom) {
      // Optionnel : enrichir nom/prenom si manquants
      await pool.query(
        `UPDATE utilisateurs SET 
          nom = COALESCE($1, nom),
          prenom = COALESCE($2, prenom)
         WHERE id = $3 AND (prenom IS NULL OR prenom = '')`,
        [nom ? nom.trim() : null, prenom ? prenom.trim() : null, targetUser.id]
      );
    }

    const mergedPerms = {
      ...permissions,
      cabinet: cabinet || permissions.cabinet || '',
      specialite: specialite || permissions.specialite || '',
      partage_taux_commission: Number(commission_taux ?? partage_taux_commission ?? permissions.partage_taux_commission ?? (role === 'courtier' ? 15 : 0)),
      telephone: searchTel || targetUser.telephone || '',
      email: searchEmail || targetUser.email || '',
    };

    const { rows: newMembre } = await pool.query(
      `INSERT INTO agence_membres (agence_id, utilisateur_id, role, permissions, actif)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (agence_id, utilisateur_id) 
       DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, actif = true
       RETURNING *`,
      [agenceId, targetUser.id, role, JSON.stringify(mergedPerms)]
    );

    res.status(201).json({
      success: true,
      message: role === 'courtier' ? 'Courtier partenaire enregistré avec succès' : 'Collaborateur ajouté avec succès',
      membre: {
        ...newMembre[0],
        utilisateur_nom: targetUser.nom,
        utilisateur_prenom: targetUser.prenom,
        utilisateur_email: targetUser.email,
        utilisateur_tel: targetUser.telephone
      }
    });
  } catch (err) {
    console.error('[POST /api/agences/:slugOrId/membres]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de l'enregistrement du collaborateur ou courtier" });
  }
});

// ── PUT /api/agences/:slugOrId/membres/:membreId — Mettre à jour un collaborateur ou courtier ──
router.put('/:slugOrId/membres/:membreId', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { membreId } = req.params;
    const {
      role,
      nom,
      prenom,
      telephone,
      email,
      cabinet,
      specialite,
      partage_taux_commission,
      commission_taux,
      permissions = {},
      actif
    } = req.body;

    const { rows: existingRows } = await pool.query(
      `SELECT am.*, u.id AS uid, u.nom, u.prenom, u.email, u.telephone
       FROM agence_membres am
       JOIN utilisateurs u ON am.utilisateur_id = u.id
       WHERE am.id = $1 AND am.agence_id = $2`,
      [membreId, agenceId]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Membre introuvable' });
    }

    const current = existingRows[0];
    const currentPerms = current.permissions || {};

    const updatedPerms = {
      ...currentPerms,
      ...permissions,
      ...(cabinet !== undefined ? { cabinet } : {}),
      ...(specialite !== undefined ? { specialite } : {}),
      ...(commission_taux !== undefined || partage_taux_commission !== undefined
        ? { partage_taux_commission: Number(commission_taux ?? partage_taux_commission) }
        : {}),
    };

    const { rows: updatedMembre } = await pool.query(
      `UPDATE agence_membres SET
        role = COALESCE($1, role),
        permissions = $2,
        actif = COALESCE($3, actif)
       WHERE id = $4 AND agence_id = $5
       RETURNING *`,
      [role || null, JSON.stringify(updatedPerms), actif !== undefined ? actif : null, membreId, agenceId]
    );

    if (nom || prenom || telephone) {
      await pool.query(
        `UPDATE utilisateurs SET
          nom = COALESCE($1, nom),
          prenom = COALESCE($2, prenom),
          telephone = COALESCE($3, telephone)
         WHERE id = $4`,
        [nom ? nom.trim() : null, prenom ? prenom.trim() : null, telephone ? telephone.trim() : null, current.uid]
      );
    }

    res.json({
      success: true,
      message: 'Collaborateur / courtier mis à jour avec succès',
      membre: updatedMembre[0]
    });
  } catch (err) {
    console.error('[PUT /api/agences/:slugOrId/membres/:membreId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur mise à jour membre' });
  }
});

// ── DELETE /api/agences/:slugOrId/membres/:membreId — Retirer un membre ──
router.delete('/:slugOrId/membres/:membreId', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { membreId } = req.params;

    // Vérifier que le membre n'est pas le créateur/fondateur de l'agence
    const { rows: targetMembre } = await pool.query(
      `SELECT am.*, a.utilisateur_id AS fondateur_id 
       FROM agence_membres am 
       JOIN agences_immo a ON am.agence_id = a.id 
       WHERE am.id = $1 AND am.agence_id = $2`,
      [membreId, agenceId]
    );

    if (targetMembre.length === 0) {
      return res.status(404).json({ success: false, error: 'Membre introuvable dans cette agence.' });
    }

    if (targetMembre[0].utilisateur_id === targetMembre[0].fondateur_id) {
      return res.status(403).json({ success: false, error: 'Impossible de retirer le fondateur ou propriétaire de l\'agence.' });
    }

    await pool.query(
      `DELETE FROM agence_membres WHERE id = $1 AND agence_id = $2`,
      [membreId, agenceId]
    );

    res.json({
      success: true,
      message: 'Membre retiré de l\'agence avec succès'
    });
  } catch (err) {
    console.error('[DELETE /api/agences/:slugOrId/membres/:membreId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du membre' });
  }
});

module.exports = router;
