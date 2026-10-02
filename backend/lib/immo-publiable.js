// AUD-222 : règle UNIQUE de publication d'une annonce immobilière, utilisée par le catalogue du site (routes/immo.js),
// la recherche globale, l'assistant du site et le bot WhatsApp. Avant, les assistants servaient des biens sans prix
// (« Prix : N/C ») que le site masque, avec un titre fait de 250 caractères de description.
const PRIX_MIN_IMMO = 10000; // FCFA : en dessous, prix saisi par erreur ou tarif à la nuit (même seuil que routes/immo.js)

/** Fragment SQL (sans paramètre) ; `alias` vide pour une requête sans alias de table. */
function conditionImmoPubliable(alias = 'ai') {
  const a = alias ? `${alias}.` : '';
  return `${a}actif = true
        AND (${a}supprimee IS NULL OR ${a}supprimee = false)
        AND (${a}rejete IS NULL OR ${a}rejete = false)
        AND ${a}prix IS NOT NULL AND ${a}prix >= ${PRIX_MIN_IMMO}`;
}

/** Titre court pour un message (les descriptions importées peuvent faire plusieurs centaines de caractères). */
function titreCourt(titre, max = 80) {
  const t = String(titre || '').replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}

module.exports = { PRIX_MIN_IMMO, conditionImmoPubliable, titreCourt };
