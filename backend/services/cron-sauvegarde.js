/**
 * NOPALOU COMMERCE OS & IMMOBILIER
 * Service Planifié de Sauvegarde Automatique Quotidienne (Cron 02h00 GMT)
 *
 * Fonctionnalités :
 * 1. Planification quotidienne automatique à 02h00 GMT via node-cron.
 * 2. Encadrement SRE par executerTacheCron() avec journalisation dans 'cron_executions'.
 * 3. Alerte critique multicanal automatique (Telegram + Email) en cas d'anomalie.
 * 4. Déclenchement de la sauvegarde complète (114 tables, gzip, SHA-256, S3/R2 optionnel).
 */

const path = require('path');
const { pathToFileURL } = require('url');
const { executerTacheCron } = require('../lib/cronLogger');

let cronModule;
try {
  cronModule = require('node-cron');
} catch (e) {
  cronModule = null;
}

/**
 * Exécute la sauvegarde complète de la base de données
 */
async function lancerSauvegardeAutomatique(label = 'cron-daily') {
  try {
    const backupScriptPath = path.resolve(__dirname, '../../scripts/backup-database.mjs');
    // Import dynamique du module ES. SRG-A5-010 : sous Windows, import() refuse un chemin absolu (« Received
    // protocol 'c:' ») ; l'adresse file:// est acceptée sur tous les systèmes.
    const { executerSauvegarde } = await import(pathToFileURL(backupScriptPath).href);
    const report = await executerSauvegarde({ label });

    // SRG-A5-010 : un stockage distant est configuré et l'envoi a échoué : la tâche est en erreur, et l'alerte part.
    // Une archive restée sur le disque de l'hébergeur ne survit pas au déploiement suivant.
    if (report.s3 && report.s3.uploaded === false && report.s3.reason !== 'not_configured') {
      throw new Error(`Archive produite mais non envoyée au stockage distant : ${String(report.s3.error || 'erreur inconnue').slice(0, 200)}`);
    }

    return {
      succes: true,
      tablesArchivées: report.tablesCount,
      totalLignes: report.totalRows,
      tailleMo: (report.gzSizeBytes / 1024 / 1024).toFixed(2),
      dureeSec: (report.durationMs / 1000).toFixed(2),
      sha256: report.sha256,
      s3Status: report.s3?.uploaded ? 'uploaded' : 'local_only'
    };
  } catch (err) {
    console.error('❌ [CRON SAUVEGARDE FAIL] Erreur critique lors de la sauvegarde :', err.message);
    throw err;
  }
}

// Initialisation du cron en environnement d'exécution (hors tests Jest)
if (process.env.NODE_ENV !== 'test' && cronModule) {
  // Planification quotidienne à 02:00 GMT (heure creuse au Sénégal)
  // Format cron : '0 2 * * *' (Minute 0, Heure 2, Tous les jours)
  const CRON_EXPRESSION = process.env.CRON_BACKUP_EXPRESSION || '0 2 * * *';

  cronModule.schedule(CRON_EXPRESSION, () => {
    console.log(`⏰ [CRON SAUVEGARDE] Déclenchement automatique de 02h00 GMT (${CRON_EXPRESSION})...`);
    executerTacheCron('sauvegarde_quotidienne', () => lancerSauvegardeAutomatique('daily')).catch((err) => {
      console.error('[CRON SAUVEGARDE] Exception interceptée par le logger :', err.message);
    });
  });

  console.log(`🛡️ [CRON SAUVEGARDE] Tâche planifiée activée (Quotidienne à ${CRON_EXPRESSION} GMT)`);
}

module.exports = {
  lancerSauvegardeAutomatique
};
