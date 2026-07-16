const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { pool } = require('../models/db');
const { adminSecretOnly } = require('../middlewares/auth');
const { envoyerEmail } = require('../services/email');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:8080';

// GET /api/admin/utilisateurs — liste paginée, recherche, filtres
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const { q, statut, type, tri = 'recent', page = 1 } = req.query;
    const limit = 30;
    const offset = (Math.max(1, parseInt(page)) - 1) * limit;

    const conditions = [];
    const values = [];
    let i = 1;

    if (q) {
      conditions.push(`(nom ILIKE $${i} OR email ILIKE $${i} OR telephone ILIKE $${i})`);
      values.push(`%${q}%`);
      i++;
    }
    if (statut === 'verifie')   conditions.push('email_verifie = TRUE');
    if (statut === 'non_verifie') conditions.push('email_verifie = FALSE');
    if (statut === 'suspendu') conditions.push('suspendu = TRUE');
    if (statut === 'en_grace') conditions.push('supprime_le IS NOT NULL');
    if (type === 'apporteur')  conditions.push('est_apporteur = TRUE');
    if (type === 'boutique')   conditions.push('EXISTS (SELECT 1 FROM boutiques b WHERE b.utilisateur_id = utilisateurs.id)');

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = tri === 'ancien' ? 'ORDER BY created_at ASC' : 'ORDER BY created_at DESC';

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM utilisateurs ${whereClause}`,
      values
    );
    const total = parseInt(countRes.rows[0].count);

    const listRes = await pool.query(
      `SELECT id, nom, email, telephone, email_verifie, suspendu, supprime_le, created_at
       FROM utilisateurs ${whereClause} ${orderClause}
       LIMIT $${i} OFFSET $${i + 1}`,
      [...values, limit, offset]
    );

    res.json({ utilisateurs: listRes.rows, total, page: parseInt(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/admin/utilisateurs/:id — fiche détail
router.get('/:id', adminSecretOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const userRes = await pool.query(
      `SELECT id, nom, email, telephone, ville, email_verifie, suspendu, supprime_le, anonymise_le, est_apporteur, code_apporteur, created_at
       FROM utilisateurs WHERE id = $1`,
      [id]
    );
    if (!userRes.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const activiteRes = await pool.query(
      `SELECT
        (SELECT COUNT(*) FROM annonces_classifiees WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_annonces,
        (SELECT COUNT(*) FROM annonces_immo        WHERE utilisateur_id=$1 AND supprimee=FALSE) AS nb_immo,
        EXISTS(SELECT 1 FROM boutiques WHERE utilisateur_id=$1) AS a_boutique`,
      [id]
    );

    const abonnementRes = await pool.query(
      `SELECT plan, fin FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW() ORDER BY fin DESC LIMIT 1`,
      [id]
    );

    res.json({
      utilisateur: userRes.rows[0],
      activite: {
        nb_annonces: parseInt(activiteRes.rows[0].nb_annonces),
        nb_immo: parseInt(activiteRes.rows[0].nb_immo),
        a_boutique: activiteRes.rows[0].a_boutique,
        est_apporteur: userRes.rows[0].est_apporteur,
      },
      abonnement: abonnementRes.rows[0] || null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/verifier-email — force email_verifie=true
router.put('/:id/verifier-email', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET email_verifie=true WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/renvoyer-verification
router.post('/:id/renvoyer-verification', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT nom, email, email_verifie FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    if (rows[0].email_verifie) return res.status(400).json({ error: 'Email déjà vérifié' });

    const verifToken = jwt.sign({ userId: req.params.id, type: 'verify' }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const lien = `${FRONTEND_URL}/api/auth/verifier-email?token=${verifToken}`;
    await envoyerEmail({
      to: rows[0].email,
      subject: 'Nopalou — vérifiez votre email',
      html: `<p>Bonjour ${rows[0].nom},</p>
             <p><a href="${lien}">Cliquez ici pour vérifier votre adresse email</a> (lien valide 24h).</p>`,
    });
    res.json({ success: true, message: 'Email de vérification renvoyé.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/admin/utilisateurs/:id/lien-reset — génère le lien sans l'envoyer
router.post('/:id/lien-reset', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id FROM utilisateurs WHERE id=$1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const resetToken = jwt.sign({ userId: req.params.id, type: 'reset' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const lien = `${FRONTEND_URL}/mot-de-passe-oublie?token=${resetToken}`;
    res.json({ lien });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/suspendre
router.put('/:id/suspendre', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=true WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/admin/utilisateurs/:id/reactiver
router.put('/:id/reactiver', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE utilisateurs SET suspendu=false WHERE id=$1 RETURNING id',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
