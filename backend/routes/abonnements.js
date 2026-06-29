const router = require('express').Router();
const axios  = require('axios');
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { limiterEcriture, limiterGeneral } = require('../middlewares/rateLimit');

const PLANS = {
  pro:      { prix: 15000, label: 'Boutique Pro' },
  business: { prix: 35000, label: 'Boutique Business' },
};

// GET /api/abonnements/mon-plan — plan actif de l'utilisateur connecté
router.get('/mon-plan', verifierToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, plan, statut, prix_mensuel, debut, fin
       FROM abonnements
       WHERE utilisateur_id = $1 AND statut = 'actif' AND fin > NOW()
       ORDER BY fin DESC LIMIT 1`,
      [req.user.userId]
    );
    res.json({ abonnement: rows[0] || null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/abonnements/initier — lancer le paiement Wave pour un abonnement
router.post('/initier', verifierToken, limiterEcriture, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { plan } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Plan invalide (pro ou business)' });

    // Vérifier qu'il n'y a pas déjà un abonnement actif
    const existing = await pool.query(
      `SELECT id FROM abonnements WHERE utilisateur_id=$1 AND statut='actif' AND fin > NOW()`,
      [userId]
    );
    if (existing.rows[0]) return res.status(409).json({ error: 'Abonnement actif existant' });

    const { prix, label } = PLANS[plan];
    const clientRef = `abmt_${userId}_${plan}`;

    const session = await axios.post(
      'https://api.wave.com/v1/checkout/sessions',
      {
        amount:           prix,
        currency:         'XOF',
        success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${plan}&type=abonnement`,
        error_url:        `${process.env.FRONTEND_URL}/paiement/erreur`,
        client_reference: clientRef,
      },
      { headers: { Authorization: `Bearer ${process.env.WAVE_API_KEY}` } }
    );
    res.json({ wave_url: session.data.wave_launch_url, session_id: session.data.id, plan, label, prix });
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Erreur Wave';
    console.error('[ABONNEMENTS INITIER]', msg);
    res.status(500).json({ error: `Impossible d'initier le paiement : ${msg}` });
  }
});

// GET /api/abonnements/admin — liste tous les abonnements (admin)
router.get('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.plan, a.statut, a.prix_mensuel, a.debut, a.fin, a.commande_ref, a.created_at,
             u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      ORDER BY a.created_at DESC
      LIMIT 200
    `);
    res.json({ abonnements: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/abonnements/admin/stats — stats abonnements (admin)
router.get('/admin/stats', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE statut='actif' AND fin > NOW())       AS actifs,
        COUNT(*) FILTER (WHERE plan='pro' AND statut='actif' AND fin > NOW())   AS pro_actifs,
        COUNT(*) FILTER (WHERE plan='business' AND statut='actif' AND fin > NOW()) AS business_actifs,
        COALESCE(SUM(prix_mensuel) FILTER (WHERE statut='actif' AND fin > NOW()), 0) AS mrr,
        COUNT(*) FILTER (WHERE statut='expire')                       AS expires,
        COUNT(*) FILTER (WHERE created_at >= DATE_TRUNC('month', NOW())) AS nouveaux_ce_mois
      FROM abonnements
    `);
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/abonnements/admin/activer — activer un plan directement (test/admin)
router.post('/admin/activer', adminSecretOnly, async (req, res) => {
  try {
    const { email, plan, jours = 30 } = req.body;
    if (!PLANS[plan]) return res.status(400).json({ error: 'Plan invalide (pro ou business)' });
    if (!email) return res.status(400).json({ error: 'Email requis' });

    const user = await pool.query('SELECT id FROM utilisateurs WHERE email=$1', [email]);
    if (!user.rows[0]) return res.status(404).json({ error: 'Utilisateur introuvable' });

    const userId = user.rows[0].id;
    const fin = new Date(Date.now() + Number(jours) * 24 * 60 * 60 * 1000).toISOString();

    // Annuler l'abonnement actif existant s'il y en a un
    await pool.query(
      `UPDATE abonnements SET statut='annule' WHERE utilisateur_id=$1 AND statut='actif'`,
      [userId]
    );

    const { rows } = await pool.query(
      `INSERT INTO abonnements (utilisateur_id, plan, statut, prix_mensuel, fin, commande_ref)
       VALUES ($1,$2,'actif',$3,$4,'admin_test') RETURNING id, plan, fin`,
      [userId, plan, PLANS[plan].prix, fin]
    );
    res.json({ success: true, abonnement: rows[0] });
  } catch (err) {
    console.error('[ABONNEMENTS ADMIN ACTIVER]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/abonnements/admin/:id/annuler — annuler un abonnement (admin)
router.put('/admin/:id/annuler', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `UPDATE abonnements SET statut='annule' WHERE id=$1 RETURNING id, plan, statut`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' });
    res.json({ abonnement: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
