// backend/services/cron-relances-prospects.js — Relances automatiques intelligentes des prospects (J+3, J+7, J+14)
const cron = require('node-cron');
const { traiterRelancesProspectsAutomatiques, reconcilierAgencesEtBoutiquesExistantes } = require('./prospection');
const { pool } = require('../models/db');

let isRunning = false;

async function logCronExecution(nomCron, stats, erreur = null) {
  try {
    await pool.query(
      `INSERT INTO cron_executions (nom_cron, ended_at, statut, stats, erreur)
       VALUES ($1, NOW(), $2, $3::jsonb, $4)
       ON CONFLICT DO NOTHING`,
      [nomCron, erreur ? 'erreur' : 'succes', JSON.stringify(stats || {}), erreur || null]
    );
  } catch (_) {}
}

async function executerRelancesProspects() {
  if (isRunning) {
    console.log('[CRON PROSPECTS] Déjà en cours d\'exécution, saut du tour...');
    return null;
  }

  isRunning = true;
  console.log('⏰ [CRON PROSPECTS] Démarrage de la vague de relances automatiques...');
  try {
    // 1. Réconciliation préalable des comptes actifs
    await reconcilierAgencesEtBoutiquesExistantes().catch((e) => {
      console.warn('[CRON PROSPECTS] Warning réconciliation préalable:', e.message);
    });

    // 2. Traitement des relances J+3, J+7 et clôtures J+14
    const res = await traiterRelancesProspectsAutomatiques({ limite: 25, simulation: false });
    console.log('✅ [CRON PROSPECTS] Terminé avec succès :', res);
    // A-05 FIX : Logger l'exécution dans cron_executions
    await logCronExecution('relances_prospects', res);
    return res;
  } catch (err) {
    console.error('❌ [CRON PROSPECTS ERR]:', err.message);
    await logCronExecution('relances_prospects', {}, err.message);
    return { error: err.message };
  } finally {
    isRunning = false;
  }
}

// Planification automatique : Chaque jour ouvrable à 11h00 (Heure de Dakar, pic d'engagement WhatsApp B2B)
if (process.env.NODE_ENV !== 'test') {
  cron.schedule('0 11 * * 1-6', () => {
    executerRelancesProspects().catch(() => {});
  });
  console.log('📅 [CRON PROSPECTS] Planifié : Lun-Sam à 11h00 (Dakar)');
}

module.exports = {
  executerRelancesProspects,
  traiterRelancesProspectsAutomatiques,
};
