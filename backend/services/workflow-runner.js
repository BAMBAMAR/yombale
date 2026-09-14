// backend/services/workflow-runner.js
// Moteur d'exécution des workflows marketing séquentiels multi-étapes (WhatsApp & SMS)

const { pool } = require('../models/db');
const { sendWhatsAppNotification } = require('./whatsapp');
const { envoyerSMSNotification } = require('./sms');

/**
 * Exécute un tour de traitement des étapes en attente dans les workflows
 */
async function processWorkflowQueue() {
  try {
    // Récupérer les logs d'exécution dont la prochaine étape est due
    const { rows: pendingLogs } = await pool.query(
      `SELECT l.id AS log_id, l.workflow_id, l.boutique_id, l.client_tel, l.etape_index,
              w.nom AS workflow_nom, w.etapes, w.actif,
              b.nom AS boutique_nom, b.whatsapp AS boutique_tel
       FROM marketing_workflow_logs l
       JOIN marketing_workflows w ON w.id = l.workflow_id
       JOIN boutiques b ON b.id = l.boutique_id
       WHERE l.statut = 'en_cours' AND l.prochaine_at <= NOW() AND w.actif = true
       LIMIT 50`
    );

    if (pendingLogs.length === 0) return { processed: 0 };

    let processedCount = 0;

    for (const item of pendingLogs) {
      const etapes = Array.isArray(item.etapes) ? item.etapes : [];
      const currentEtape = etapes[item.etape_index];

      if (!currentEtape) {
        // Aucune étape restante : marquer comme terminé
        await pool.query(`UPDATE marketing_workflow_logs SET statut = 'termine' WHERE id = $1`, [item.log_id]);
        continue;
      }

      // Exécution de l'action selon le canal (WhatsApp ou SMS)
      let success = false;
      const clientTel = item.client_tel;
      const messageText = currentEtape.message || `Bonjour ! Retrouvez les nouveautés de ${item.boutique_nom} sur notre boutique.`;

      if (currentEtape.canal === 'sms') {
        const smsRes = await envoyerSMSNotification(clientTel, messageText);
        success = smsRes.success;
      } else {
        // WhatsApp par défaut
        try {
          await sendWhatsAppNotification({
            phone: clientTel,
            templateName: currentEtape.template || 'panier_relance_nopalou',
            parameters: [item.boutique_nom, messageText],
            textMessage: messageText,
            fallbackSMS: true
          });
          success = true;
        } catch (waErr) {
          console.warn(`[WORKFLOW EXEC ERR] (${clientTel}):`, waErr.message);
          success = false;
        }
      }

      const nextIndex = item.etape_index + 1;
      const hasNextStep = nextIndex < etapes.length;
      const nextStep = etapes[nextIndex];

      if (success && hasNextStep) {
        // Préparer la prochaine étape avec le délai spécifié (en minutes ou heures)
        const delayMinutes = nextStep.delai_minutes || (nextStep.delai_heures ? nextStep.delai_heures * 60 : 60);
        await pool.query(
          `UPDATE marketing_workflow_logs
           SET etape_index = $1, prochaine_at = NOW() + ($2 || ' minutes')::INTERVAL
           WHERE id = $3`,
          [nextIndex, delayMinutes, item.log_id]
        );
      } else {
        // Marquer comme terminé ou échoué
        const finalStatus = success ? 'termine' : 'echoue';
        await pool.query(`UPDATE marketing_workflow_logs SET statut = $1 WHERE id = $2`, [finalStatus, item.log_id]);
      }

      processedCount++;
    }

    return { processed: processedCount };
  } catch (err) {
    console.error('[WORKFLOW ENGINE CRITICAL ERR]:', err.message);
    return { error: err.message };
  }
}

module.exports = {
  processWorkflowQueue
};
