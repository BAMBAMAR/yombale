// backend/services/cron-envois-sans-accuse.js
// Repli e-mail pour les notifications WhatsApp (commandes vendeur) acceptées par Meta mais jamais accusées
// « delivered » dans le délai (NOTIF_DELAI_SANS_ACCUSE_MIN, défaut 5 min) : téléphone éteint, refus tardif perdu...

const { traiterEnvoisSansAccuse } = require('./notification-envois');

const INTERVALLE_MS = 2 * 60 * 1000;

async function traiter() {
  const { traites } = await traiterEnvoisSansAccuse();
  if (traites > 0) console.log(`[CRON ENVOIS SANS ACCUSE] ${traites} notification(s) relayée(s) par e-mail`);
  return { traites };
}

if (process.env.NODE_ENV !== 'test') {
  const { executerTacheCron } = require('../lib/cronLogger');
  setTimeout(() => {
    executerTacheCron('envois_sans_accuse', () => traiter()).catch(() => {});
    setInterval(() => {
      executerTacheCron('envois_sans_accuse', () => traiter()).catch(() => {});
    }, INTERVALLE_MS);
  }, 90 * 1000);
}

module.exports = { traiter };
