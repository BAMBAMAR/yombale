// backend/routes/settings.js — Configuration dynamique (prix, promo, WhatsApp, paiement)
const router = require('express').Router();
const { adminSecretOnly } = require('../middlewares/auth');
const s = require('../lib/settingsCache');

const { adminAccess } = require('../middlewares/admin-rbac');
// AUD-029 : les clés sensibles ne sont jamais renvoyées en clair, quel que soit le rôle admin.
// Le masque conserve les 4 derniers caractères pour reconnaître la valeur sans la divulguer.
const SENSITIVE_KEY_RE = /(token|secret|api_key|apikey|password|passwd|signing|private_key)/i;
const MASK_PREFIX = '****';

function maskValue(value) {
  const str = value == null ? '' : String(value);
  if (!str) return '';
  return str.length > 8 ? MASK_PREFIX + str.slice(-4) : MASK_PREFIX;
}

function maskSettings(all) {
  const out = {};
  for (const [k, v] of Object.entries(all)) {
    out[k] = SENSITIVE_KEY_RE.test(k) ? maskValue(v) : v;
  }
  return out;
}

// Une valeur renvoyée telle quelle par le masque (formulaire admin qui ré-enregistre) ne doit pas écraser le secret.
function isMaskedValue(key, value) {
  return SENSITIVE_KEY_RE.test(key) && typeof value === 'string' && value.startsWith(MASK_PREFIX);
}

// GET /api/settings — toutes les configs (admin seulement, secrets masqués)
router.get('/', ...adminAccess('settings'), async (req, res) => {
  try {
    const all = await s.getAll();
    res.json(maskSettings(all));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings — mettre à jour une ou plusieurs clés (admin seulement)
router.put('/', ...adminAccess('settings'), async (req, res) => {
  try {
    const allowed = Object.keys(s.DEFAULTS);
    const updates = {};
    for (const [k, v] of Object.entries(req.body)) {
      if (allowed.includes(k) && !isMaskedValue(k, v)) updates[k] = v;
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
                  'plan_decouverte_prix','plan_pro_prix','plan_business_prix',
                  'plan_decouverte_label','plan_pro_label','plan_business_label',
                  'abonnement_essai_jours',
                  'reduc_3_mois','reduc_6_mois','reduc_12_mois',
                  'promo_active','promo_reduction',
                  'paiement_wave','paiement_orange','paiement_manuel_actif',
                  'paiement_manuel_numero_wave','paiement_manuel_numero_om',
                  'apporteur_taux_commission', 'commission_business',
                  'max_boutiques_par_compte', 'max_boutiques_par_telephone',
                  'max_agences_par_compte', 'max_agences_par_telephone',
                  'tarif_agence_supplementaire', 'immo_multi_agence_label', 'prix_sponsoring_agence',
                  'alertes_abonnement_jours_avant', 'alertes_abonnement_whatsapp', 'alertes_abonnement_email',
                  'kalpe_prix_mensuel', 'kalpe_essai_jours', 'kalpe_gratuit_boutiques',
                  'contrat_vendeur_requis', 'contrat_vendeur_texte', 'nopalou_social_links'];
    const result = {};
    for (const k of keys) result[k] = await s.get(k);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
