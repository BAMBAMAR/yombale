// backend/lib/immoTexte.js : AUD-188. Déduit transaction et type de bien d'une annonce immobilière en texte libre
// (titre + description d'une publication Facebook). Avant : « vente » n'était cherché qu'en sous-chaîne littérale, donc
// « Terrain à vendre » et « Villa a vendre » devenaient des locations ; le type était toujours « appartement ».
// Le titre prime sur la description ; en cas de signaux contradictoires dans le même texte, rien n'est deviné : location
// (valeur par défaut historique) et le type reste « appartement ».

const normaliser = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

const VENTE = /\b(?:vend(?:re|s|ons)?|vente|a vendre)\b/;
const LOCATION = /\b(?:louer|location|loue|louable|bail)\b/;

function signal(texte) {
  const t = normaliser(texte);
  const v = VENTE.test(t); const l = LOCATION.test(t);
  if (v && !l) return 'vente';
  if (l && !v) return 'location';
  return null; // aucun signal, ou signaux contradictoires
}

function deduireTransaction(titre, description) {
  return signal(titre) || signal(description) || 'location';
}

const TYPES = [
  ['appartement', /\b(?:appartements?|appart|f[1-9]|t[1-9])\b/],
  ['villa', /\bvillas?\b/],
  ['maison', /\b(?:maisons?|immeubles?|duplex)\b/],
  ['terrain', /\b(?:terrains?|parcelles?|titre foncier|lotissement)\b/],
  ['studio', /\bstudios?\b/],
  ['chambre', /\bchambres?\b/],
  ['bureau', /\b(?:bureaux?|local|locaux|magasins?|boutiques?|entrepots?)\b/],
];

function typeDepuis(texte) {
  const t = normaliser(texte);
  for (const [type, re] of TYPES) if (re.test(t)) return type;
  return null;
}

function deduireTypeBien(titre, description) {
  return typeDepuis(titre) || typeDepuis(description) || 'appartement';
}

module.exports = { deduireTransaction, deduireTypeBien };
