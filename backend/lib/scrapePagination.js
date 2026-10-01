// backend/lib/scrapePagination.js : AUD-174. Plafonds de pagination réglables (garde-fou, pas critère d'arrêt).
// Le vrai critère d'arrêt reste : page vide, 404, ou deux erreurs HTTP dans la même catégorie.
// Retour arrière sur l'ancien comportement : SCRAPE_MAX_PAGES=4 (produits), SCRAPE_MAX_PAGES_IMMO=5, SCRAPE_MAX_PAGES_WOO=8.
const entier = (v, defaut) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : defaut;
};

// Produits (HTML) : plafond de sécurité par catégorie (l'ancien plafond fixe était 4).
const plafondPages = (defaut = 25) => entier(process.env.SCRAPE_MAX_PAGES, defaut);
// Immobilier (l'ancien plafond fixe était 5 par section).
const plafondPagesImmo = (defaut = 25) => entier(process.env.SCRAPE_MAX_PAGES_IMMO, defaut);
// API WooCommerce Store, 100 articles par page (l'ancien plafond fixe était 8, soit 800 articles par site).
const plafondPagesWoo = (defaut = 100) => entier(process.env.SCRAPE_MAX_PAGES_WOO, defaut);

module.exports = { plafondPages, plafondPagesImmo, plafondPagesWoo };