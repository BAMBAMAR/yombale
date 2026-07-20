// backend/routes/settings.js — Configuration dynamique (prix, promo, WhatsApp, paiement)
const router = require('express').Router();
const { adminSecretOnly } = require('../middlewares/auth');
const s = require('../lib/settingsCache');

// GET /api/settings — toutes les configs (admin seulement)
router.get('/', adminSecretOnly, async (req, res) => {
  try {
    const all = await s.getAll();
    res.json(all);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings — mettre à jour une ou plusieurs clés (admin seulement)
router.put('/', adminSecretOnly, async (req, res) => {
  try {
    const allowed = Object.keys(s.DEFAULTS);
    const updates = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (allowed.includes(k)) updates[k] = v;
    }
    if (!Object.keys(updates).length) {
      return res.status(400).json({ error: 'Aucune clé valide fournie' });
    }
    await s.setMany(updates);
    s.invalidate();
    res.json({ updated: updates });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/settings/public — sous-ensemble public (prix affichés sur le site)
router.get('/public', async (req, res) => {
  try {
    const keys = ['prix_annonce','prix_sponsoring','prix_boost','boost_duree_jours',
                  'plan_pro_prix','plan_business_prix','plan_pro_label','plan_business_label',
                  'promo_active','promo_reduction',
                  'paiement_wave','paiement_orange','paiement_manuel_actif',
                  'paiement_manuel_numero_wave','paiement_manuel_numero_om',
                  'apporteur_taux_commission'];
    const result = {};
    for (const k of keys) result[k] = await s.get(k);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
