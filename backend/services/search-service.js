// backend/services/search-service.js
// Service de Recherche Unifié Nopalou (PostgreSQL pg_trgm + Meilisearch Adapter + Phonétique Sénégal)

const { pool } = require('../models/db');
const axios = require('axios');

// Normalisation des accents et caractères spéciaux
function normaliserTexte(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`-]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Synonymes sénégalais usuels (Wolof, argot et équivalents commerciaux)
const SYNONYMES_SENEGAL = {
  thieb: ['riz', 'ceeb', 'tieb', 'thieboudienne'],
  ceeb: ['riz', 'thieb', 'tieb'],
  dall: ['chaussure', 'sandale', 'tapette', 'basket'],
  chaussure: ['dall', 'sandale', 'tapette', 'basket'],
  yeure: ['boubou', 'habit', 'vetement', 'robe'],
  boubou: ['yeure', 'bazin', 'tenue', 'couture'],
  portable: ['telephone', 'smartphone', 'mobile'],
  telephone: ['portable', 'smartphone', 'mobile', 'iphone', 'samsung'],
  parfum: ['thiouraye', 'encens', 'oud', 'musc'],
  thiouraye: ['parfum', 'encens', 'gowe'],
  ataya: ['the', 'menthe'],
  the: ['ataya', 'kinkeliba'],
  dibi: ['viande', 'mouton', 'grillade'],
  pain: ['mburu', 'tapalapa'],
  tiaktiak: ['livraison', 'coursier', 'moto'],
  'tiak-tiak': ['livraison', 'coursier', 'moto'],
};

function expandQuery(query) {
  const norm = normaliserTexte(query);
  const words = norm.split(' ').filter(Boolean);
  const terms = new Set([norm, ...words]);

  for (const w of words) {
    if (SYNONYMES_SENEGAL[w]) {
      SYNONYMES_SENEGAL[w].forEach(s => terms.add(s));
    }
  }

  return Array.from(terms);
}

// Meilisearch Client Helper (Résilience si offline ou non configuré)
const MEILI_URL = process.env.MEILISEARCH_URL;
const MEILI_KEY = process.env.MEILISEARCH_KEY;

async function searchMeilisearch(indexName, query, options = {}) {
  if (!MEILI_URL || !MEILI_KEY) return null;
  try {
    const res = await axios.post(
      `${MEILI_URL}/indexes/${indexName}/search`,
      { q: query, limit: options.limit || 20, filter: options.filter },
      {
        headers: { Authorization: `Bearer ${MEILI_KEY}` },
        timeout: 1500, // 1.5s max pour ne jamais ralentir le client
      }
    );
    return res.data?.hits || null;
  } catch (err) {
    console.warn(`[SEARCH SERVICE] Meilisearch offline (${indexName}) — fallback Postgres:`, err.message);
    return null;
  }
}

/**
 * Recherche avancée de produits avec filtres, trigrammes et synonymes
 */
async function rechercherProduits({
  q = '',
  categorie = null,
  prixMin = null,
  prixMax = null,
  enStock = true,
  tri = 'pertinence',
  limit = 20,
  page = 1,
} = {}) {
  const cleanQ = (q || '').trim();
  const offset = (Math.max(1, parseInt(page)) - 1) * Math.min(50, parseInt(limit));
  const safeLimit = Math.min(50, parseInt(limit));

  // 1. Tentative Meilisearch si actif
  if (cleanQ) {
    const meiliHits = await searchMeilisearch('produits', cleanQ, { limit: safeLimit });
    if (meiliHits && meiliHits.length > 0) {
      return {
        source: 'meilisearch',
        q: cleanQ,
        total: meiliHits.length,
        produits: meiliHits,
      };
    }
  }

  // 2. Recherche PostgreSQL Trigrammes + Synonymes
  const terms = cleanQ ? expandQuery(cleanQ) : [];
  const conds = [];
  const params = [];

  if (terms.length > 0) {
    const ilikeClauses = terms.map(t => {
      params.push(`%${t}%`);
      const idx = params.length;
      return `(p.nom ILIKE $${idx} OR p.description ILIKE $${idx} OR p.marque ILIKE $${idx})`;
    });
    conds.push(`(${ilikeClauses.join(' OR ')})`);
  }

  if (categorie) {
    params.push(`%${categorie.trim()}%`);
    const idx = params.length;
    conds.push(`(c.nom ILIKE $${idx} OR c.slug ILIKE $${idx})`);
  }

  if (prixMin !== null && !isNaN(Number(prixMin))) {
    params.push(Number(prixMin));
    conds.push(`p.prix_min >= $${params.length}`);
  }

  if (prixMax !== null && !isNaN(Number(prixMax))) {
    params.push(Number(prixMax));
    conds.push(`p.prix_min <= $${params.length}`);
  }

  const whereClause = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

  let orderClause = 'ORDER BY p.created_at DESC';
  if (tri === 'prix_asc') orderClause = 'ORDER BY p.prix_min ASC NULLS LAST';
  else if (tri === 'prix_desc') orderClause = 'ORDER BY p.prix_min DESC NULLS LAST';
  else if (cleanQ) {
    params.push(`${cleanQ}%`);
    const prefixIdx = params.length;
    orderClause = `ORDER BY CASE WHEN p.nom ILIKE $${prefixIdx} THEN 0 ELSE 1 END, p.nb_offres DESC, p.created_at DESC`;
  }

  params.push(safeLimit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    SELECT p.id, p.nom, p.marque, p.prix_min AS prix, p.image_url AS image, p.nb_offres,
           c.nom AS categorie_nom, c.slug AS categorie_slug
    FROM produits p
    LEFT JOIN categories c ON c.id = p.categorie_id
    ${whereClause}
    ${orderClause}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const { rows } = await pool.query(sql, params);

  return {
    source: 'postgresql',
    q: cleanQ,
    total: rows.length,
    produits: rows,
  };
}

module.exports = {
  normaliserTexte,
  expandQuery,
  rechercherProduits,
  searchMeilisearch,
};
