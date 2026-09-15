// backend/routes/agences.js
// Gestion des agences immobilières Nopalou, membres et statistiques

const express = require('express');
const router = express.Router();
const { pool } = require('../models/db');
const { verifierToken } = require('../middlewares/auth');
const { requireAgenceAccess } = require('../middlewares/tenantSecurityImmo');

function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── GET /api/agences/mine — Liste des agences de l'utilisateur connecté ──
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { rows } = await pool.query(
      `SELECT a.*, 
              COALESCE(am.role, 'admin_agence') AS mon_role,
              (a.utilisateur_id = $1) AS is_owner,
              (SELECT COUNT(*) FROM biens_immo b WHERE b.agence_id = a.id AND b.statut = 'actif') AS nb_biens,
              (SELECT COUNT(*) FROM contacts_immo c WHERE c.agence_id = a.id AND c.type_contact = 'prospect' AND c.statut_crm NOT IN ('gagne', 'perdu')) AS nb_prospects_actifs
       FROM agences_immo a
       LEFT JOIN agence_membres am ON a.id = am.agence_id AND am.utilisateur_id = $1 AND am.actif = true
       WHERE a.utilisateur_id = $1 OR am.id IS NOT NULL
       ORDER BY a.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      agences: rows
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
router.put('/:slugOrId', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const {
      nom,
      description,
      logo_url,
      adresse,
      ville,
      quartier,
      telephone,
      whatsapp,
      email_contact,
      site_web,
      numero_agrement,
      parametres
    } = req.body;

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

// ── GET /api/agences/:slugOrId/stats — KPIs exécutifs temps réel ──
router.get('/:slugOrId/stats', verifierToken, requireAgenceAccess(), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'

    // 1. Biens & Annonces
    const { rows: biensStats } = await pool.query(
      `SELECT 
        COUNT(*) FILTER (WHERE statut = 'actif') AS nb_biens_actifs,
        COUNT(*) FILTER (WHERE statut_occupation = 'disponible') AS nb_biens_disponibles,
        COUNT(*) FILTER (WHERE statut_occupation = 'loue') AS nb_biens_loues,
        COUNT(*) FILTER (WHERE statut_occupation = 'vendu') AS nb_biens_vendus
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
      `SELECT am.*, u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone AS utilisateur_tel
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

// ── POST /api/agences/:slugOrId/membres — Ajouter un membre ──
router.post('/:slugOrId/membres', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { emailOrPhone, role = 'agent', permissions = {} } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ success: false, error: "Email ou numéro de téléphone requis." });
    }

    // Trouver l'utilisateur
    const { rows: userRows } = await pool.query(
      `SELECT id, nom, email, telephone FROM utilisateurs 
       WHERE LOWER(email) = LOWER($1) OR telephone = $1 OR whatsapp = $1`,
      [emailOrPhone.trim()]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Aucun compte Nopalou trouvé avec cet email ou téléphone. Invitez l'utilisateur à créer un compte."
      });
    }

    const targetUser = userRows[0];

    const { rows: newMembre } = await pool.query(
      `INSERT INTO agence_membres (agence_id, utilisateur_id, role, permissions, actif)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (agence_id, utilisateur_id) 
       DO UPDATE SET role = EXCLUDED.role, permissions = EXCLUDED.permissions, actif = true
       RETURNING *`,
      [agenceId, targetUser.id, role, JSON.stringify(permissions)]
    );

    res.status(201).json({
      success: true,
      message: 'Collaborateur ajouté à l’agence avec succès',
      membre: {
        ...newMembre[0],
        utilisateur_nom: targetUser.nom,
        utilisateur_email: targetUser.email,
        utilisateur_tel: targetUser.telephone
      }
    });
  } catch (err) {
    console.error('[POST /api/agences/:slugOrId/membres]', err.message);
    res.status(500).json({ success: false, error: "Erreur lors de l'ajout du membre" });
  }
});

// ── DELETE /api/agences/:slugOrId/membres/:membreId — Retirer un membre ──
router.delete('/:slugOrId/membres/:membreId', verifierToken, requireAgenceAccess('admin_agence'), async (req, res) => {
  try {
    const agenceId = req.agence.id;
    const { membreId } = req.params;

    const { rows } = await pool.query(
      `DELETE FROM agence_membres WHERE id = $1 AND agence_id = $2 RETURNING *`,
      [membreId, agenceId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Membre introuvable dans cette agence.' });
    }

    res.json({
      success: true,
      message: 'Membre retiré de l’agence avec succès'
    });
  } catch (err) {
    console.error('[DELETE /api/agences/:slugOrId/membres/:membreId]', err.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la suppression du membre' });
  }
});

module.exports = router;
