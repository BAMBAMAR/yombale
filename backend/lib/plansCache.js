// backend/lib/plansCache.js
// Gestionnaire centralisé des forfaits & plans tarifaires Nopalou (avec cache mémoire)

const { pool } = require('../models/db');

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
let cache = new Map();
let lastLoaded = 0;

const DEFAULT_PLANS = [
  {
    slug: 'gratuit',
    label: 'Boutique Gratuite',
    prix_mensuel: 0,
    badge: 'Départ',
    couleur: '#64748b',
    avantages: ['Page boutique vitrine visible sur Nopalou', 'Coordonnées et contact WhatsApp direct', 'Jusqu\'à 2 annonces classées incluses'],
    limites: { max_produits: 10, max_caissiers: 1, pos: false, whatsapp_chatbot: false },
    ordre: 0,
    actif: true,
  },
  {
    slug: 'decouverte',
    label: 'Boutique Taf Taf',
    prix_mensuel: 2500,
    badge: 'Populaire',
    couleur: '#10b981',
    avantages: ['Carnet de dettes client & relances WhatsApp', 'Catalogue connecté avec commandes WhatsApp', 'Encaissement direct Wave & Orange Money', 'Import IA magique de produits', '0% de commission', '1er mois 100% OFFERT'],
    limites: { max_produits: 50, max_caissiers: 1, pos: false, whatsapp_chatbot: true },
    ordre: 1,
    actif: true,
  },
  {
    slug: 'pro',
    label: 'Boutique Pro',
    prix_mensuel: 5000,
    badge: 'Recommandé',
    couleur: '#f59e0b',
    avantages: ['Tout le contenu Taf Taf', 'Caisse POS tactile magasin & tickets', 'Saisie express & scanner code-barres', 'Référencement prioritaire & Badge Certifié', '5 annonces classées incluses / mois', 'Analytics avancés', '1er mois 100% OFFERT'],
    limites: { max_produits: 300, max_caissiers: 3, pos: true, whatsapp_chatbot: true },
    ordre: 2,
    actif: true,
  },
  {
    slug: 'business',
    label: 'Boutique Business VIP',
    prix_mensuel: 10000,
    badge: '👑 VIP',
    couleur: '#6366f1',
    avantages: ['Tout le contenu Pro', 'Relances automatiques WhatsApp des dettes & paniers', 'Multi-caissiers avec codes PIN & clôtures Z', 'Multi-magasins & transferts de stock', 'Portail Développeur API & Webhooks', 'Comptabilité fournisseurs & Bons de commande', 'Bannière sponsorisée en tête de catégorie', '15 annonces classées incluses', 'Account Manager VIP 7j/7', '1er mois 100% OFFERT'],
    limites: { max_produits: 2000, max_caissiers: 10, pos: true, whatsapp_chatbot: true, api_access: true },
    ordre: 3,
    actif: true,
  },
];

async function loadPlans() {
  try {
    const { rows } = await pool.query(`
      SELECT id, slug, label, prix_mensuel, badge, couleur, avantages, limites, ordre, actif, visibilite, description, created_at, updated_at
      FROM plans
      ORDER BY ordre ASC, created_at ASC
    `);

    cache.clear();
    if (rows && rows.length > 0) {
      for (const r of rows) {
        cache.set(r.slug, {
          id: r.id,
          slug: r.slug,
          label: r.label,
          prix_mensuel: Number(r.prix_mensuel) || 0,
          badge: r.badge,
          couleur: r.couleur || '#0284c7',
          avantages: Array.isArray(r.avantages) ? r.avantages : [],
          limites: typeof r.limites === 'object' && r.limites !== null ? r.limites : {},
          ordre: parseInt(r.ordre) || 0,
          actif: Boolean(r.actif),
          visibilite: r.visibilite || 'public',
          description: r.description || '',
          created_at: r.created_at,
          updated_at: r.updated_at,
        });
      }
    } else {
      for (const p of DEFAULT_PLANS) {
        cache.set(p.slug, { ...p });
      }
    }
  } catch (err) {
    cache.clear();
    for (const p of DEFAULT_PLANS) {
      cache.set(p.slug, { ...p });
    }
  }
  lastLoaded = Date.now();
}

async function ensureFresh() {
  if (Date.now() - lastLoaded > CACHE_TTL || cache.size === 0) {
    await loadPlans();
  }
}

async function getPlan(slug) {
  await ensureFresh();
  const normalized = slug === 'taf_taf' ? 'decouverte' : slug;
  return cache.get(normalized) || cache.get('gratuit') || DEFAULT_PLANS[0];
}

async function getAllPlans(onlyActive = false) {
  await ensureFresh();
  let list = Array.from(cache.values());
  if (onlyActive) {
    list = list.filter(p => p.actif !== false);
  }
  return list.sort((a, b) => a.ordre - b.ordre);
}

function invalidate() {
  lastLoaded = 0;
}

module.exports = {
  getPlan,
  getAllPlans,
  invalidate,
  DEFAULT_PLANS,
};
