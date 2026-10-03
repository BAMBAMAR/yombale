// AUD-221 : briques d'interprétation de l'assistant du site (fonctions pures, sans base de données).
// Elles corrigent des échecs constatés : « créer » (accent) ignoré par la FAQ, « salam » transformé en « saly »,
// référence de commande jamais lue, budget (« moins de 200000 ») ignoré, entités HTML affichées telles quelles.

/** Minuscules sans accents : « Créer » et « creer » doivent se valoir. */
function normaliser(texte) {
  return String(texte == null ? '' : texte)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

const MOTS_SALUTATION = new Set([
  'salam', 'salamaleykoum', 'salamalekoum', 'assalamou', 'salut', 'bonjour', 'bonsoir', 'hello', 'hi', 'hey',
  'coucou', 'yo', 'nanga', 'nangadef', 'bsr', 'bjr',
]);

/** Message de pure politesse : à saluer, jamais à chercher (ni à « corriger » en nom de ville). */
function estSalutation(texte) {
  const mots = normaliser(texte).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  return mots.length > 0 && mots.length <= 4 && MOTS_SALUTATION.has(mots[0]);
}

const MOTS_REMERCIEMENT = new Set(['merci', 'thanks', 'thx', 'jerejef', 'jerejeff', 'barkelou', 'baarkelu', 'super', 'parfait', 'nickel', 'genial']);

/** Simple remerciement (« merci », « merci beaucoup », « ok super merci ») : à remercier, jamais à chercher. */
function estRemerciement(texte) {
  const mots = normaliser(texte).replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  if (mots.length === 0 || mots.length > 4) return false;
  const filler = new Set(['ok', 'okay', 'oui', 'beaucoup', 'bien', 'vraiment', 'infiniment', 'a', 'vous', 'toi', 'tres', 'bcp', 'd', 'accord']);
  return mots.some((m) => MOTS_REMERCIEMENT.has(m)) && mots.every((m) => MOTS_REMERCIEMENT.has(m) || filler.has(m));
}

const DEBUT_QUESTION = /^(comment|pourquoi|ou|quand|quel|quelle|quels|quelles|est ce|puis je|peut on|combien|qui|que|qu|c est quoi|je voudrais savoir|j aimerais savoir|besoin d aide)\b/;

/** Message formulé comme une question d'aide (« comment… », « puis-je… », se termine par « ? ») plutôt qu'un nom de produit. */
function estQuestion(texte) {
  const brut = String(texte || '').trim();
  if (!brut) return false;
  const n = normaliser(brut).replace(/['’-]/g, ' ').replace(/\s+/g, ' ');
  return brut.endsWith('?') || DEBUT_QUESTION.test(n);
}

/** Référence de commande présente dans le message (CMD-…, C-…, PAY-…, V-…), en majuscules, ou null. */
function extraireReferenceCommande(texte) {
  const m = String(texte || '').match(/\b((?:CMD|PAY|V|C)-[A-Z0-9-]{3,60})\b/i);
  return m ? m[1].toUpperCase() : null;
}

/**
 * Budget maximum annoncé : « moins de 200000 », « max 150k », « budget 200 mille », « jusqu'à 80 000 F ».
 * Renvoie le texte sans la partie budget (pour la recherche) et le plafond en FCFA, ou null.
 */
function extraireBudget(texte) {
  const brut = String(texte || '');
  const re = /(?:moins\s+de|maximum|max|budget(?:\s+(?:de|max))?|jusqu['’]?\s*a|au\s+plus)\s*:?\s*(\d[\d\s.,]*)\s*(k|mille|milles|fcfa|cfa|francs?|f)?\b/i;
  const m = normaliser(brut).match(re);
  if (!m) return { texte: brut.trim(), prixMax: null };
  let nombre = Number(m[1].replace(/[\s.,]/g, ''));
  if (!Number.isFinite(nombre) || nombre <= 0) return { texte: brut.trim(), prixMax: null };
  const unite = (m[2] || '').toLowerCase();
  if ((unite === 'k' || unite.startsWith('mille')) && nombre < 1000) nombre *= 1000;
  // La normalisation conserve la longueur (accents retirés caractère à caractère), les indices restent valables
  const sans = (brut.slice(0, m.index) + ' ' + brut.slice(m.index + m[0].length)).replace(/\s+/g, ' ').trim();
  return { texte: sans || brut.trim(), prixMax: nombre };
}

const ENTITES_NOMMEES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', euml: 'ë',
  agrave: 'à', acirc: 'â', ocirc: 'ô', ucirc: 'û', ugrave: 'ù', icirc: 'î', iuml: 'ï', ccedil: 'ç',
  Eacute: 'É', Egrave: 'È', Agrave: 'À', Ccedil: 'Ç',
  ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', hellip: '…',
  Prime: '″', prime: '′', deg: '°', euro: '€',
};

/** Décode les entités HTML (&#8211; &eacute; &Prime; …) laissées par certains imports de catalogue. */
function decoderEntites(texte) {
  if (texte == null) return texte;
  return String(texte).replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);/gi, (tout, code) => {
    if (code[0] === '#') {
      const n = code[1].toLowerCase() === 'x' ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : tout;
    }
    return Object.prototype.hasOwnProperty.call(ENTITES_NOMMEES, code) ? ENTITES_NOMMEES[code] : tout;
  });
}

module.exports = { normaliser, estSalutation, estRemerciement, estQuestion, extraireReferenceCommande, extraireBudget, decoderEntites };
