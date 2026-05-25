function normaliser(texte) {
  return texte.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function similariteJaccard(a, b) {
  const setA = new Set(normaliser(a).split(' ').filter(w => w.length > 2));
  const setB = new Set(normaliser(b).split(' ').filter(w => w.length > 2));
  const inter = [...setA].filter(w => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

function extraireModele(titre) {
  const m = titre.match(/[A-Z][0-9]{2,4}[A-Z]?|[0-9]{2,4}[A-Z]{1,3}/g);
  return m ? m[0] : null;
}

function sontIdentiques(titreA, titreB) {
  const score = similariteJaccard(titreA, titreB);
  if (score >= 0.7) return { match: true, score, methode: 'jaccard' };
  const mA = extraireModele(titreA), mB = extraireModele(titreB);
  if (mA && mA === mB && score >= 0.4) return { match: true, score, methode: 'modele' };
  return { match: false, score };
}

module.exports = { sontIdentiques, similariteJaccard };