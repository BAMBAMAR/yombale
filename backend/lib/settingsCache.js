// Cache mémoire pour la table settings — évite une requête DB à chaque paiement
const { pool } = require('../models/db');

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
let cache = {};
let lastLoaded = 0;

// Valeurs par défaut si la table settings est vide
const DEFAULTS = {
  quota_annonces_gratuit: '2',
  prix_annonce:        '1500',
  prix_sponsoring:     '5000',
  prix_boost:          '500',
  boost_duree_jours:   '7',
  plan_pro_prix:       '5000',
  plan_business_prix:  '10000',
  plan_pro_label:      'Boutique Pro',
  plan_business_label: 'Boutique Business',
  commission_business: '2.0',
  paiement_wave:       'true',
  paiement_orange:     'true',
  paiement_manuel_actif:      'true',
  paiement_manuel_numero_wave: '',
  paiement_manuel_numero_om:   '',
  promo_active:        'false',
  promo_code:          '',
  promo_reduction:     '0',      // pourcentage de réduction
  promo_expiry:        '',
  whatsapp_enabled:    'true',
  whatsapp_chatbot:    'true',
  apporteur_actif:            'true',
  apporteur_taux_commission:  '10',
  apporteur_seuil_paiement:   '3000',
  apporteur_cookie_jours:     '30',
};

async function loadSettings() {
  const { rows } = await pool.query('SELECT key, value FROM settings');
  cache = { ...DEFAULTS };
  for (const row of rows) cache[row.key] = row.value;
  lastLoaded = Date.now();
}

async function get(key) {
  if (Date.now() - lastLoaded > CACHE_TTL) await loadSettings();
  return cache[key] ?? DEFAULTS[key] ?? null;
}

async function getAll() {
  if (Date.now() - lastLoaded > CACHE_TTL) await loadSettings();
  return { ...cache };
}

async function set(key, value) {
  await pool.query(
    `INSERT INTO settings (key, value, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT (key) DO UPDATE SET value=$2, updated_at=NOW()`,
    [key, String(value)]
  );
  cache[key] = String(value);
}

async function setMany(obj) {
  for (const [key, value] of Object.entries(obj)) {
    await set(key, value);
  }
}

// Invalider le cache (après une mise à jour admin)
function invalidate() { lastLoaded = 0; }

// Helpers typés
async function getNum(key) { return parseFloat(await get(key)) || 0; }
async function getBool(key) { return (await get(key)) === 'true'; }

module.exports = { get, getAll, set, setMany, getNum, getBool, invalidate, DEFAULTS };
