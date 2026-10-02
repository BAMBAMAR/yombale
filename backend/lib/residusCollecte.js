// backend/lib/residusCollecte.js : AUD-193. Résidus de données non traités par les scripts d'assainissement des 28-29/09.
// Rejeu sur la copie de production du 24/09/2026 : `assainir-donnees-scraping.js` remet bien à NULL les 825 numéros
// « Voir sur Facebook » des annonces classifiées, mais laisse les 27 de `annonces_immo` ; et 345 offres gardent une URL d'achat
// polluée par des paramètres de suivi (avant la normalisation à l'insertion, AUD-193).
// Lecture seule par défaut (`execute: false`).
const { normaliserUrlAchat } = require('./urlAchat');

async function nettoyerResidus(pool, { execute = false } = {}) {
  const bilan = { placeholdersImmo: 0, urlsNormalisees: 0, urlsEnConflit: 0 };

  const { rows: ph } = await pool.query(`SELECT count(*)::int AS n FROM annonces_immo WHERE contact_tel = 'Voir sur Facebook'`);
  bilan.placeholdersImmo = ph[0].n;
  if (execute && bilan.placeholdersImmo) await pool.query(`UPDATE annonces_immo SET contact_tel = NULL WHERE contact_tel = 'Voir sur Facebook'`);

  const { rows: offres } = await pool.query(`SELECT id, marchand_id, url_achat FROM offres WHERE url_achat ~ '[?#]'`);
  for (const o of offres) {
    const propre = normaliserUrlAchat(o.url_achat);
    if (!propre || propre === o.url_achat) continue;
    // une autre offre du même marchand porte déjà l'URL propre : on ne crée pas de doublon d'URL, on le signale
    const { rows: deja } = await pool.query('SELECT 1 FROM offres WHERE marchand_id = $1 AND url_achat = $2 AND id <> $3 LIMIT 1', [o.marchand_id, propre, o.id]);
    if (deja.length) { bilan.urlsEnConflit++; continue; }
    bilan.urlsNormalisees++;
    if (execute) await pool.query('UPDATE offres SET url_achat = $1 WHERE id = $2', [propre, o.id]);
  }
  return bilan;
}

module.exports = { nettoyerResidus };
