// backend/lib/featureFlags.js
// Gestionnaire centralisé et performant des Feature Flags Nopalou (avec cache mémoire)

const { pool } = require('../models/db');

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes
let cache = new Map();
let lastLoaded = 0;

const DEFAULT_FLAGS = {
  POS_ENABLED: { enabled: true, scope: 'global', label: 'Caisse POS tactile en magasin', categorie: 'pos' },
  WHATSAPP_CHATBOT: { enabled: true, scope: 'global', label: 'Assistant & Commerce WhatsApp', categorie: 'whatsapp' },
  STOCK_MANAGEMENT: { enabled: true, scope: 'global', label: 'Gestion avancée des stocks & alertes', categorie: 'stock' },
  DEBT_LEDGER: { enabled: true, scope: 'global', label: 'Carnet de dettes client & créances', categorie: 'commerce' },
  AI_MAGIC_IMPORT: { enabled: true, scope: 'global', label: 'Import magique de produits par IA', categorie: 'ia' },
  OFFLINE_POS: { enabled: true, scope: 'global', label: 'Mode Hors-Ligne Caisse POS', categorie: 'pos' },
  PRICE_ALERTS: { enabled: true, scope: 'global', label: 'Alertes de baisse de prix', categorie: 'marketing' },
  LOYALTY_PROGRAM: { enabled: true, scope: 'global', label: 'Programme fidélité & cashback', categorie: 'marketing' },
  COMMISSIONS_APPORTEURS: { enabled: true, scope: 'global', label: 'Programme Apporteurs d\'Affaires', categorie: 'finance' },
  DEVELOPER_PORTAL: { enabled: true, scope: 'global', label: 'Portail Développeur API & Webhooks', categorie: 'tech' },
};

async function loadFlags() {
  try {
    const { rows } = await pool.query('SELECT key, label, description, categorie, enabled, scope, meta, updated_at FROM feature_flags');
    cache.clear();
    for (const r of rows) {
      cache.set(r.key, {
        key: r.key,
        label: r.label,
        description: r.description,
        categorie: r.categorie,
        enabled: Boolean(r.enabled),
        scope: r.scope || 'global',
        meta: r.meta || {},
        updated_at: r.updated_at,
      });
    }
  } catch (err) {
    // Si la table n'existe pas encore ou DB occupée, fallback sur DEFAULT_FLAGS
    cache.clear();
    for (const [k, v] of Object.entries(DEFAULT_FLAGS)) {
      cache.set(k, { key: k, ...v, meta: {} });
    }
  }
  lastLoaded = Date.now();
}

async function ensureFresh() {
  if (Date.now() - lastLoaded > CACHE_TTL || cache.size === 0) {
    await loadFlags();
  }
}

/**
 * Vérifie si une fonctionnalité est activée pour un contexte donné (boutique, plan, etc.)
 */
async function isEnabled(flagKey, context = {}) {
  await ensureFresh();
  const flag = cache.get(flagKey) || DEFAULT_FLAGS[flagKey];
  if (!flag) return true; // Si drapeau inconnu, ne pas bloquer par défaut

  if (!flag.enabled) return false;
  if (flag.scope === 'global') return true;

  // Scope: plan (ex: ['pro', 'business'])
  if (flag.scope === 'plan' && context.plan) {
    const allowedPlans = flag.meta?.plans || ['business'];
    return allowedPlans.includes(context.plan);
  }

  // Scope: boutique spécifique
  if (flag.scope === 'boutique' && context.boutiqueId) {
    const allowedBoutiques = flag.meta?.boutiqueIds || [];
    return allowedBoutiques.includes(context.boutiqueId);
  }

  return flag.enabled;
}

/**
 * Récupère tous les feature flags (avec métadonnées complètes pour l'Admin)
 */
async function getAllFlags() {
  await ensureFresh();
  return Array.from(cache.values());
}

/**
 * Récupère un dictionnaire simplifié des flags actifs pour le Frontend public
 */
async function getPublicFlags() {
  await ensureFresh();
  const result = {};
  for (const [k, v] of cache.entries()) {
    result[k] = v.enabled;
  }
  return result;
}

/**
 * Met à jour un feature flag (ou le crée s'il n'existe pas)
 */
async function setFlag(key, { enabled, label, description, categorie, scope, meta }) {
  const current = cache.get(key) || {};
  const newEnabled = enabled !== undefined ? Boolean(enabled) : (current.enabled !== undefined ? current.enabled : true);
  const newLabel = label || current.label || key;
  const newDesc = description !== undefined ? description : (current.description || '');
  const newCat = categorie || current.categorie || 'general';
  const newScope = scope || current.scope || 'global';
  const newMeta = meta !== undefined ? meta : (current.meta || {});

  await pool.query(
    `INSERT INTO feature_flags (key, label, description, categorie, enabled, scope, meta, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     ON CONFLICT (key) DO UPDATE SET
       label = $2,
       description = $3,
       categorie = $4,
       enabled = $5,
       scope = $6,
       meta = $7,
       updated_at = NOW()`,
    [key, newLabel, newDesc, newCat, newEnabled, newScope, JSON.stringify(newMeta)]
  );

  invalidate();
  await ensureFresh();
  return cache.get(key);
}

/**
 * Supprime un feature flag personnalisé
 */
async function deleteFlag(key) {
  await pool.query('DELETE FROM feature_flags WHERE key = $1', [key]);
  invalidate();
}

function invalidate() {
  lastLoaded = 0;
}

module.exports = {
  isEnabled,
  getAllFlags,
  getPublicFlags,
  setFlag,
  deleteFlag,
  invalidate,
  DEFAULT_FLAGS,
};
