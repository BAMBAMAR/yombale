// backend/services/cron-verification-boutiques.js
// AUD-140 : recalcule chaque heure le badge « Vendeur Vérifié » (critères réels, voir lib/verificationBoutique.js).
const { recalculerVerification } = require('../lib/verificationBoutique');

const INTERVALLE_MS = 60 * 60 * 1000;

async function traiterVerifications() {
  const changes = await recalculerVerification(null);
  if (changes.length > 0) console.log(`[CRON VERIFICATION] ${changes.length} boutique(s) mise(s) à jour`);
  return { changees: changes.length };
}

if (process.env.NODE_ENV !== 'test') {
  const { executerTacheCron } = require('../lib/cronLogger');
  setTimeout(() => {
    executerTacheCron('verification_boutiques', () => traiterVerifications()).catch(() => {});
    setInterval(() => {
      executerTacheCron('verification_boutiques', () => traiterVerifications()).catch(() => {});
    }, INTERVALLE_MS);
  }, 2 * 60 * 1000);
}

module.exports = { traiterVerifications };
