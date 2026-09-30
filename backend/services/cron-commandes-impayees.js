// backend/services/cron-commandes-impayees.js
// AUD-010 : annule les commandes en ligne à paiement numérique (Wave, Orange Money, carte) restées impayées
// et restitue leur stock, afin qu'un visiteur ne puisse pas immobiliser l'inventaire d'une boutique sans payer.
// Délai configurable : COMMANDE_IMPAYEE_DELAI_HEURES (défaut 2 h, plus long que l'expiration d'une session Wave).

const { annulerCommandesImpayeesExpirees } = require('./commande-service');

const DELAI_HEURES = Math.max(1, parseInt(process.env.COMMANDE_IMPAYEE_DELAI_HEURES, 10) || 2);
const INTERVALLE_MS = 15 * 60 * 1000;

async function traiterCommandesImpayees() {
  const annulees = await annulerCommandesImpayeesExpirees({ delaiHeures: DELAI_HEURES });
  if (annulees > 0) console.log(`[CRON COMMANDES IMPAYEES] ${annulees} commande(s) annulée(s), stock restitué`);
  return { annulees };
}

if (process.env.NODE_ENV !== 'test') {
  const { executerTacheCron } = require('../lib/cronLogger');
  setTimeout(() => {
    executerTacheCron('commandes_impayees', () => traiterCommandesImpayees()).catch(() => {});
    setInterval(() => {
      executerTacheCron('commandes_impayees', () => traiterCommandesImpayees()).catch(() => {});
    }, INTERVALLE_MS);
  }, 60 * 1000);
}

module.exports = { traiterCommandesImpayees, DELAI_HEURES };
