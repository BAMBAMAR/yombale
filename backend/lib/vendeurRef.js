// backend/lib/vendeurRef.js : AUD-182. Clé de vendeur d'une offre, décision du propriétaire : une offre par vendeur.
// Sur une place de marché (CoinAfrique, Jiji, Expat-Dakar), plusieurs vendeurs proposent le même modèle ; avec l'unicité
// (produit, marchand) toutes les annonces se disputaient une seule ligne et le prix affiché était celui du dernier vendeur lu.
// Les pages de liste n'exposent pas de nom de vendeur : une annonce = un vendeur, la clé est donc l'adresse de l'annonce
// (sans paramètres ni fragment). Un scraper qui connaît le vendeur peut fournir `item.vendeur_ref`, qui prime.
// Hors place de marché la clé est vide : une seule offre par (produit, marchand), comme avant.

const PLACES_DE_MARCHE = new Set(['coinafrique', 'jiji', 'expat-dakar', 'expat dakar']);

function nettoyerCle(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 200);
}

function estPlaceDeMarche(marchandNom) {
  return PLACES_DE_MARCHE.has(String(marchandNom || '').trim().toLowerCase());
}

function vendeurRefOffre(marchandNom, item, urlPropre) {
  const fournie = nettoyerCle(item && item.vendeur_ref);
  if (fournie) return fournie;
  if (!estPlaceDeMarche(marchandNom) || !urlPropre) return '';
  try {
    const u = new URL(urlPropre);
    return nettoyerCle('ad:' + u.hostname + u.pathname.replace(/\/+$/, ''));
  } catch (_) {
    return '';
  }
}

module.exports = { vendeurRefOffre, estPlaceDeMarche, PLACES_DE_MARCHE };
