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
    // Import dynamique du module ES
    const { executerSauvegarde } = await import(backupScriptPath);
    const report = await executerSauvegarde({ label });

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
