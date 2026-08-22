// backend/lib/searchLogger.js — Enregistrement et calcul automatique des tendances de recherche
const { pool } = require('../models/db');

const FALLBACK_TENDANCES = [
  { label: 'iPhone 15', q: 'iphone' },
  { label: 'Climatiseurs', q: 'climatiseur' },
  { label: 'Samsung S24', q: 'samsung' },
  { label: 'Smart TV 4K', q: 'tv' },
  { label: 'PlayStation 5', q: 'ps5' },
  { label: 'MacBook Pro', q: 'macbook' },
];

/**
 * Nettoie et normalise une requête de recherche
 */
function cleanQuery(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (trimmed.length < 2 || trimmed.length > 60) return null;

  // Ignorer les requêtes suspectes ou purement numériques de 1-2 chiffres
  if (/^https?:\/\//i.test(trimmed)) return null;
  if (/^[0-9]{1,2}$/.test(trimmed)) return null;
  if (/[<>{}[\]\\]/.test(trimmed)) return null;

  return trimmed;
}

/**
 * Enregistre une recherche utilisateur de manière asynchrone et non bloquante
 */
async function recordSearch(rawQuery) {
  const query = cleanQuery(rawQuery);
  if (!query) return;

  const normalized = query.toLowerCase();

  try {
    await pool.query(
      `INSERT INTO recherches_logs (query, normalized_query, count, last_searched_at)
       VALUES ($1, $2, 1, NOW())
       ON CONFLICT (normalized_query)
       DO UPDATE SET
         count = recherches_logs.count + 1,
         last_searched_at = NOW(),
         query = CASE 
           WHEN length(EXCLUDED.query) >= length(recherches_logs.query) THEN EXCLUDED.query 
           ELSE recherches_logs.query 
         END`,
      [query, normalized]
    );
  } catch (err) {
    // Non bloquant : ne pas interrompre l'expérience utilisateur si la table est en maintenance
    if (process.env.NODE_ENV === 'development') {
      console.warn('[SEARCH_LOGGER] Erreur log:', err.message);
    }
  }
}

/**
 * Récupère les tendances de recherche actuelles
 */
async function getTopTendances(limit = 5) {
  try {
    const { rows } = await pool.query(
      `SELECT query, normalized_query, count
       FROM recherches_logs
       WHERE length(query) >= 2
       ORDER BY count DESC, last_searched_at DESC
       LIMIT $1`,
      [limit]
    );

    if (rows && rows.length > 0) {
      const items = rows.map(r => ({
        label: r.query,
        q: r.normalized_query
      }));

      // Si on a moins d'éléments que la limite, compléter avec les fallbacks
      if (items.length < limit) {
        for (const fb of FALLBACK_TENDANCES) {
          if (!items.some(it => it.q === fb.q || it.label.toLowerCase() === fb.label.toLowerCase())) {
            items.push(fb);
            if (items.length >= limit) break;
          }
        }
      }
      return items.slice(0, limit);
    }
  } catch (err) {
    console.warn('[SEARCH_LOGGER] Fallback tendances suite à erreur:', err.message);
  }

  return FALLBACK_TENDANCES.slice(0, limit);
}

module.exports = {
  recordSearch,
  getTopTendances,
  FALLBACK_TENDANCES
};
