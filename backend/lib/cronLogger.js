// backend/lib/cronLogger.js
// Observabilité et journalisation des tâches planifiées (Crons) dans la table cron_executions

const { pool } = require('../models/db');

/**
 * Journalise et encapsule l'exécution d'une tâche cron.
 * @param {string} nomCron Nom unique du cron (ex: 'prospection_dorking', 'relance_paniers')
 * @param {Function} asyncFn Fonction asynchrone exécutant le travail
 * @returns {Promise<any>} Résultat de la fonction
 */
async function executerTacheCron(nomCron, asyncFn) {
  let executionId = null;
  const startedAt = new Date();

  try {
    const { rows } = await pool.query(
      `INSERT INTO cron_executions (nom_cron, started_at, statut, stats)
       VALUES ($1, $2, 'en_cours', '{}'::jsonb)
       RETURNING id`,
      [nomCron, startedAt]
    );
    executionId = rows[0]?.id;
  } catch (err) {
    console.warn(`[CRON LOGGER] Impossible d'initier la tâche ${nomCron}:`, err.message);
  }

  try {
    const resultat = await asyncFn();
    const stats = (resultat && typeof resultat === 'object') ? resultat : { resultat };

    if (executionId) {
      await pool.query(
        `UPDATE cron_executions 
         SET ended_at = NOW(), statut = 'succes', stats = $1
         WHERE id = $2`,
        [JSON.stringify(stats), executionId]
      ).catch(() => {});
    }

    return resultat;
  } catch (err) {
    console.error(`[CRON LOGGER ERR] Échec tâche ${nomCron}:`, err);
    if (executionId) {
      await pool.query(
        `UPDATE cron_executions 
         SET ended_at = NOW(), statut = 'erreur', erreur = $1
         WHERE id = $2`,
        [err.message || String(err), executionId]
      ).catch(() => {});
    }
    throw err;
  }
}

module.exports = { executerTacheCron };
