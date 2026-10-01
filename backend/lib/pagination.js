// AUD-135 : pagination bornée pour toutes les listes publiques.
// Un client anonyme ne peut plus demander « tout le catalogue » en une requête (limit=100000) ni faire échouer
// la requête SQL avec une valeur non numérique (limit=abc → 500) : les valeurs invalides retombent sur le défaut.
// Le rendu serveur du site (jeton X-SSR-Token) garde un plafond plus haut pour le sitemap et les pages de catégorie.
const { isSsrRequest } = require('../middlewares/rateLimit');

function entierPositif(valeur) {
  const n = parseInt(valeur, 10);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

/**
 * @param {import('express').Request} req
 * @param {{ def?: number, max?: number, maxSsr?: number }} opts
 * @returns {{ limit: number, page: number, offset: number }}
 */
function clampPagination(req, { def = 24, max = 50, maxSsr = max } = {}) {
  const plafond = isSsrRequest(req) ? maxSsr : max;
  const limit = Math.min(entierPositif(req.query.limit) || def, plafond);
  const page = Math.min(entierPositif(req.query.page) || 1, 100000);
  return { limit, page, offset: (page - 1) * limit };
}

module.exports = { clampPagination };
