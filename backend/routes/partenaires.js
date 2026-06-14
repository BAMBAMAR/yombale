// backend/routes/partenaires.js — Demandes "Devenir partenaire"
const router = require('express').Router();
const { pool } = require('../models/db');
const { adminSecretOnly, verifierToken } = require('../middlewares/auth');
const { envoyerEmail } = require('../services/email');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// POST /api/partenaires — déposer une demande (utilisateur connecté)
router.post('/', verifierToken, async (req, res) => {
  try {
    const { nom_entreprise, secteur, contact_nom, contact_tel, email, description } = req.body;

    if (!nom_entreprise || !email) {
      return res.status(400).json({ error: 'nom_entreprise et email requis' });
    }

    const { rows } = await pool.query(`
      INSERT INTO demandes_partenaires
        (utilisateur_id, nom_entreprise, secteur, contact_nom, contact_tel, email, description)
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      RETURNING id`,
      [req.user.userId, nom_entreprise, secteur || null, contact_nom || null,
       contact_tel || null, email, description || null]
    );

    res.status(201).json({
      success: true,
      id: rows[0].id,
      message: 'Demande envoyée — notre équipe va l\'examiner.',
    });

    if (ADMIN_EMAIL) {
      envoyerEmail({
        to: ADMIN_EMAIL,
        subject: `Nouvelle demande partenaire : ${nom_entreprise}`,
        html: `<p>Nouvelle demande de partenariat reçue sur Yombale :</p>
               <ul>
                 <li><b>Entreprise :</b> ${nom_entreprise}</li>
                 <li><b>Secteur :</b> ${secteur || '-'}</li>
                 <li><b>Contact :</b> ${contact_nom || '-'} — ${contact_tel || '-'}</li>
                 <li><b>Email :</b> ${email}</li>
                 <li><b>Description :</b> ${description || '-'}</li>
               </ul>`,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[POST /api/partenaires]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/partenaires/mine — mes demandes
router.get('/mine', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM demandes_partenaires WHERE utilisateur_id = $1 ORDER BY created_at DESC`,
      [req.user.userId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/partenaires/admin/en-attente — demandes à traiter (admin)
router.get('/admin/en-attente', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM demandes_partenaires WHERE statut = 'en_attente' ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/partenaires/:id — approuver / rejeter (admin)
router.put('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { statut } = req.body;
    if (!['approuve', 'rejete', 'en_attente'].includes(statut)) {
      return res.status(400).json({ error: 'statut invalide' });
    }

    const { rows } = await pool.query(
      `UPDATE demandes_partenaires SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [statut, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Demande introuvable' });

    res.json(rows[0]);

    if (statut === 'approuve') {
      envoyerEmail({
        to: rows[0].email,
        subject: 'Votre demande de partenariat Yombale est approuvée 🎉',
        html: `<p>Bonjour ${rows[0].contact_nom || ''},</p>
               <p>Bonne nouvelle ! Votre demande de partenariat pour <b>${rows[0].nom_entreprise}</b> a été approuvée.</p>
               <p>Notre équipe va vous contacter prochainement pour la suite.</p>
               <p>À bientôt sur Yombale 👋</p>`,
      }).catch(() => {});
    }
  } catch (err) {
    console.error('[PUT /api/partenaires/:id]', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
