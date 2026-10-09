// backend/services/cron-surga-rss.js
// Collecte périodique (toutes les 30 min) des flux RSS d'actualité pour Surga
// Enregistre les métriques dans cron_executions via executerTacheCron

const { collecterTousLesFlux } = require('./surga/rss-collector');
const { synchroniserTousLesFlux } = require('./surga/video-service');

const INTERVALLE_MS = 30 * 60 * 1000; // 30 minutes

async function executerCollecteSurga() {
  const [rssResult, videosResult] = await Promise.allSettled([
    collecterTousLesFlux(),
    synchroniserTousLesFlux(),
  ]);

  return {
    rss: rssResult.status === 'fulfilled' ? rssResult.value : { erreur: rssResult.reason?.message },
    videos: videosResult.status === 'fulfilled' ? videosResult.value : { erreur: videosResult.reason?.message },
  };
}

if (process.env.NODE_ENV !== 'test') {
  const { executerTacheCron } = require('../lib/cronLogger');

  // Premier déclenchement après 1 minute, puis toutes les 30 minutes
  setTimeout(() => {
    executerTacheCron('surga_rss_collection', () => executerCollecteSurga()).catch((err) => {
      console.warn('[CRON SURGA RSS] Échec tâche initiale:', err.message);
    });

    setInterval(() => {
      executerTacheCron('surga_rss_collection', () => executerCollecteSurga()).catch((err) => {
        console.warn('[CRON SURGA RSS] Échec tâche récurrente:', err.message);
      });
    }, INTERVALLE_MS);
  }, 60 * 1000);
}

module.exports = { executerCollecteSurga };
