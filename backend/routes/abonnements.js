const router = require('express').Router();
const { pool } = require('../models/db');
const { verifierToken, adminSecretOnly } = require('../middlewares/auth');
const { limiterEcriture, limiterGeneral } = require('../middlewares/rateLimit');
const cfg = require('../lib/settingsCache');
const wave = require('../services/wave');

async function getPlans() {
  return {
    decouverte: { prix: await cfg.getNum('plan_decouverte_prix') || 2500,  label: await cfg.get('plan_decouverte_label') || 'Boutique Taf Taf' },
    pro:        { prix: await cfg.getNum('plan_pro_prix')        || 5000, label: await cfg.get('plan_pro_label')        || 'Boutique Pro' },
    business:   { prix: await cfg.getNum('plan_business_prix')   || 10000, label: await cfg.get('plan_business_label')   || 'Boutique Business' },
  };
}

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
    const { plan: rawPlan, duree_mois = 1 } = req.body;
    const plan = rawPlan === 'taf_taf' ? 'decouverte' : rawPlan;
    const duree = [1, 3, 6, 12].includes(Number(duree_mois)) ? Number(duree_mois) : 1;
    const PLANS = await getPlans();
    if (!PLANS[plan]) return res.status(400).json({ error: 'Plan invalide (decouverte, pro ou business)' });

    const { prix: prixMensuel, label } = PLANS[plan];

    const [reduc3, reduc6, reduc12] = await Promise.all([
      cfg.getNum('reduc_3_mois'),
      cfg.getNum('reduc_6_mois'),
      cfg.getNum('reduc_12_mois'),
    ]);

    let remise = 0;
    if (duree === 3) remise = (reduc3 || 10) / 100;
    else if (duree === 6) remise = (reduc6 || 15) / 100;
    else if (duree === 12) remise = (reduc12 || 25) / 100;

    const prixTotal = Math.round((prixMensuel * duree) * (1 - remise));
    const clientRef = `abmt_${userId}_${plan}_${duree}_${Date.now()}`;

    const session = await wave.createCheckoutSession({
      amount:           prixTotal,
      currency:         'XOF',
      success_url:      `${process.env.FRONTEND_URL}/paiement/succes?ref=${plan}&type=abonnement`,
      error_url:        `${process.env.FRONTEND_URL}/paiement/erreur?ref=${clientRef}&type=abonnement`,
      client_reference: clientRef,
    });
    res.json({ wave_url: session.wave_url, session_id: session.session_id, plan, label, prix: prixTotal, duree });
  } catch (err) {
    const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Erreur Wave';
    console.error('[ABONNEMENTS INITIER]', msg);
    const userId = req.user?.userId;
    const { plan = 'pro', duree_mois = 1 } = req.body || {};
    const ref = `abmt_${userId}_${plan}_${duree_mois}`;
    res.json({ fallback_manuel: true, error: msg, numero_depot: '777202086', reference: ref, plan, duree: duree_mois });
  }
});

// GET /api/abonnements/admin — liste tous les abonnements (admin)
router.get('/admin', adminSecretOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT a.id, a.plan, a.statut, a.prix_mensuel, a.debut, a.fin, a.commande_ref, a.created_at,
             u.nom AS utilisateur_nom, u.email AS utilisateur_email, u.telephone,
             b.id AS boutique_id, b.nom AS boutique_nom, b.slug AS boutique_slug
      FROM abonnements a
      JOIN utilisateurs u ON u.id = a.utilisateur_id
      LEFT JOIN boutiques b ON b.utilisateur_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 300
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
        COUNT(*) FILTER (WHERE plan='decouverte' AND statut='actif' AND fin > NOW()) AS decouverte_actifs,
        COALESCE(SUM(prix_mensuel) FILTER (WHERE statut='actif' AND fin > NOW()), 0) AS mrr,
        COUNT(*) FILTER (WHERE statut='expire' OR (statut='actif' AND fin <= NOW())) AS expires,
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
    const PLANS = await getPlans();
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
       VALUES ($1,$2,'actif',$3,$4,$5) RETURNING id, plan, fin`,
      [userId, plan, PLANS[plan].prix, fin, `admin_test_${userId}_${Date.now()}`]
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

// PUT /api/abonnements/admin/:id/prolonger — prolonger un abonnement (admin)
router.put('/admin/:id/prolonger', adminSecretOnly, async (req, res) => {
  try {
    const jours = Math.max(1, Math.min(365, parseInt(req.body.jours) || 30));
    const { rows } = await pool.query(
      `UPDATE abonnements
       SET fin = GREATEST(fin, NOW()) + ($2 || ' days')::INTERVAL,
           statut = 'actif'
       WHERE id=$1
       RETURNING id, plan, statut, fin`,
      [req.params.id, jours]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Abonnement introuvable' });
    res.json({ abonnement: rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
