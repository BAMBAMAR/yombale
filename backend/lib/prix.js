// backend/lib/prix.js : AUD-187. Un seul parseur de prix (FCFA, entiers) pour tous les scrapers.
// Avant : six parseurs aux comportements différents (`150 000,50` devenait 15 000 050 en immo, `CFA 155,000` était rejeté
// par les nouveaux sites, `1,5M` n'était lu par aucun). Règles :
//  - séparateurs de milliers : espace, espace insécable, `.` ou `,` suivis d'exactement 3 chiffres ;
//  - décimales (1 ou 2 chiffres après le dernier séparateur) : ignorées (le FCFA n'a pas de centimes) ;
//  - unités explicites seulement : `k` (mille), `m`, `million(s)` ; jamais d'unité devinée ;
//  - mots de devise (FCFA, XOF, CFA, F, francs) et suffixes de période (`/mois`) ignorés ;
//  - fourchette `a - b` : `parsePrix` renvoie la borne basse, `parsePrixPlage` les deux ; rien n'est tranché en silence.
// Les seuils (`min`, `max`) sont ceux de l'appelant : le parseur lit, l'appelant décide de ce qui est plausible.

const MOTS_DEVISE = /\b(?:fcfa|f\s*cfa|xof|cfa|francs?|frs?)\b|\bf\b/gi;
const SUFFIXE_PERIODE = /[/]\s*(?:mois|jour|nuit|semaine|an|ans|m2|m²)\b.*$/i;
const NOMBRE = /\d[\d\s .,]*/;

// Convertit un jeton numérique (« 1.500.000 », « 150 000,50 », « 1,5 », « 25000.00 ») en nombre, décimales comprises.
function jetonEnNombre(jeton) {
  const s = jeton.replace(/[\s ]/g, '');
  if (!s) return null;
  // dernier séparateur suivi de 1 ou 2 chiffres : décimale ; suivi de 3 chiffres : milliers
  const m = s.match(/^(.*?)[.,](\d{1,2})$/);
  if (m) {
    const entier = m[1].replace(/[.,]/g, '');
    return entier === '' ? null : parseFloat(`${entier}.${m[2]}`);
  }
  const chiffres = s.replace(/[.,]/g, '');
  return /^\d+$/.test(chiffres) ? parseInt(chiffres, 10) : null;
}

// Un nombre suivi d'une unité (k, m, million) : « 1,5M », « 12 millions », « 35 k ».
function avecUnite(texte) {
  const m = texte.match(/(\d+(?:[.,]\d+)?)\s*(millions?|m|k)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(',', '.'));
  if (!Number.isFinite(n)) return null;
  const u = m[2].toLowerCase();
  return Math.round(n * (u === 'k' ? 1e3 : 1e6));
}

function borner(v, { min, max }) {
  // décimales ignorées (pas de centimes en FCFA)
  return Number.isFinite(v) && v >= min && v <= max ? Math.floor(v) : null;
}

/**
 * Valeur entière en FCFA, ou null. Pour une fourchette, la borne basse.
 * @param {string|number} brut
 * @param {{min?: number, max?: number}} [opts] seuils de plausibilité de l'appelant
 */
function parsePrix(brut, { min = 100, max = 2e9 } = {}) {
  if (brut === null || brut === undefined) return null;
  if (typeof brut === 'number') return borner(brut, { min, max });
  let t = String(brut).replace(/ /g, ' ').replace(SUFFIXE_PERIODE, '').trim();
  if (!t) return null;
  const u = avecUnite(t);
  if (u !== null) return borner(u, { min, max });
  t = t.replace(MOTS_DEVISE, ' ');
  const m = t.match(NOMBRE);
  if (!m) return null;
  return borner(jetonEnNombre(m[0]), { min, max });
}

/** Fourchette `85 000 - 95 000 FCFA` : { min, max, brut }, ou null si ce n'est pas une fourchette. */
function parsePrixPlage(brut, opts = {}) {
  if (typeof brut !== 'string') return null;
  const m = brut.replace(/ /g, ' ').match(/^(.*?\d[^\d\-–—]*?)\s*(?:-|–|—|à)\s*(\d.*)$/i);
  if (!m) return null;
  const bas = parsePrix(m[1], opts);
  const haut = parsePrix(m[2], opts);
  if (bas === null || haut === null || haut < bas) return null;
  return { min: bas, max: haut, brut };
}

// Numéro mobile sénégalais (9 chiffres, 70/75/76/77/78) : jamais un prix
const EST_MOBILE = (chiffres) => /^7[05678]\d{7}$/.test(chiffres);

/**
 * Prix dans un texte libre (annonce, publication). Le premier candidat accepté par `valider` (par défaut : dans les seuils).
 * Ordre : montants suivis d'une devise (ou /mois), montant + unité (m, million, k), « prix : 25000 ».
 */
function extrairePrixTexte(texte, { min = 500, max = 5e8, valider } = {}) {
  if (!texte) return null;
  const t = String(texte).replace(/ /g, ' ').replace(/\s+/g, ' ');
  const accepte = (v) => v !== null && Number.isFinite(v) && (valider ? valider(Math.floor(v)) : v >= min && v <= max);

  // tous les montants suivis d'une devise, dans l'ordre du texte : le premier que l'appelant juge plausible l'emporte
  for (const c of t.matchAll(/(\d[\d\s.,]{0,14}\d|\d)\s*(?:fcfa|f\s*cfa|xof|cfa|f\b|fr\b|[/]\s*(?:mois|jour))/gi)) {
    const v = parsePrix(c[1], { min: 0, max: Infinity });
    if (accepte(v)) return Math.floor(v);
  }

  const u = avecUnite(t);
  if (u !== null && accepte(u)) return u;

  const m = t.match(/(?:prix|à|a)\s*[:=-]?\s*(\d{4,9})\b/i);
  if (m && !EST_MOBILE(m[1])) {
    const v = parseInt(m[1], 10);
    if (accepte(v) && (valider || v >= Math.max(min, 1000))) return v;
  }
  return null;
}

module.exports = { parsePrix, parsePrixPlage, extrairePrixTexte };
