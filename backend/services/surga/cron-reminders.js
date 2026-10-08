// backend/services/surga/cron-reminders.js
// Worker d'ordonnancement en arrière-plan pour les rappels Surga
// Idempotence stricte, heure locale Dakar (UTC), Web Push VAPID, fallback WhatsApp, retries

const { pool } = require('../../models/db');
const { sendWebPushNotification } = require('../../lib/vapidHelper');
const { sendWhatsAppText, normalisePhone } = require('../whatsapp');

let intervalId = null;
let isProcessing = false;

/**
 * Calcule la prochaine date pour un rappel récurrent
 * @param {string} dateStr Format YYYY-MM-DD
 * @param {string} repetition 'QUOTIDIEN' | 'HEBDOMADAIRE' | 'MENSUEL'
 * @returns {string} Format YYYY-MM-DD
 */
function calculerProchaineDate(dateStr, repetition) {
  const d = new Date(dateStr + 'T00:00:00Z');
  if (repetition === 'QUOTIDIEN') {
    d.setUTCDate(d.getUTCDate() + 1);
  } else if (repetition === 'HEBDOMADAIRE') {
    d.setUTCDate(d.getUTCDate() + 7);
  } else if (repetition === 'MENSUEL') {
    // SRG-A5-003 : le 31 janvier donnait le 3 mars (le mois suivant était sauté). Le jour est ramené au dernier
    // jour du mois quand il n'existe pas. Limite : le jour d'origine n'est pas conservé (31 janvier, 28 février, 28 mars).
    const jour = d.getUTCDate();
    d.setUTCDate(1);
    d.setUTCMonth(d.getUTCMonth() + 1);
    const dernierJour = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
    d.setUTCDate(Math.min(jour, dernierJour));
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Première occurrence strictement postérieure à aujourd'hui (UTC, heure de Dakar).
 * SRG-A5-002 : un rappel récurrent en retard de plusieurs jours n'avançait que d'un pas, restait échu et repartait à
 * chaque passage : un message par minute jusqu'au rattrapage.
 */
function calculerProchaineOccurrence(dateStr, repetition, heure = null, maintenant = new Date()) {
  const aujourdhui = maintenant.toISOString().slice(0, 10);
  const heureCourante = maintenant.toISOString().slice(11, 16);
  const heureRappel = String(heure || '08:00').padStart(5, '0');
  // Une occurrence est « à venir » si sa date est future, ou si elle tombe aujourd'hui à une heure non encore atteinte.
  const passee = (d) => d < aujourdhui || (d === aujourdhui && heureRappel <= heureCourante);
  let prochaine = calculerProchaineDate(dateStr, repetition);
  for (let i = 0; passee(prochaine) && i < 4000; i++) {
    const suivante = calculerProchaineDate(prochaine, repetition);
    if (suivante === prochaine) break;
    prochaine = suivante;
  }
  return prochaine;
}

const MAX_TENTATIVES_ENVOI = 3;

/**
 * Traite les rappels arrivés à échéance (exécutable manuellement pour les tests)
 * @param {Object} options
 * @param {string} [options.dateCible] Format YYYY-MM-DD (défaut: CURRENT_DATE Dakar)
 * @param {string} [options.heureCible] Format HH:mm (défaut: heure courante UTC)
 * @returns {Promise<{ traites: number, succes: number, echecs: number, details: Array }>}
 */
async function traiterRappelsEchus(options = {}) {
  const stats = {
    traites: 0,
    succes: 0,
    echecs: 0,
    details: [],
  };

  try {
    // Fuseau horaire Dakar : UTC+0 toute l'année
    const dateCible = options.dateCible || null;
    const heureCible = options.heureCible || null;

    let sql = `
      SELECT a.*, u.telephone AS user_phone, u.prenom AS user_prenom
      FROM surga_agenda a
      LEFT JOIN utilisateurs u ON u.id = a.user_id
      WHERE a.est_rappel = TRUE
        AND a.termine = FALSE
        AND a.notification_envoyee = FALSE
    `;
    const params = [];

    if (dateCible) {
      params.push(dateCible);
      sql += ` AND a.date_evenement = $${params.length}`;
    } else {
      sql += ` AND a.date_evenement <= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE`;
    }

    if (heureCible) {
      params.push(heureCible);
      sql += ` AND (a.heure_evenement IS NULL OR a.heure_evenement <= $${params.length})`;
    } else {
      // SRG-A5-005 : un rappel sans heure était dû à minuit ; il l'est désormais à 08:00. Une heure écrite « 8:00 »
      // est comparée comme « 08:00 » (elle n'était due que le lendemain).
      sql += ` AND (
        a.date_evenement < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC')::DATE
        OR LPAD(COALESCE(a.heure_evenement, '08:00'), 5, '0') <= TO_CHAR(CURRENT_TIMESTAMP AT TIME ZONE 'UTC', 'HH24:MI')
      )`;
    }

    sql += ` ORDER BY a.date_evenement ASC, a.heure_evenement ASC NULLS FIRST LIMIT 50`;

    const { rows: rappels } = await pool.query(sql, params);
    if (!rappels || rappels.length === 0) {
      return stats;
    }

    for (const rappel of rappels) {
      // 1. Verrou d'idempotence atomique : marquer notification_envoyee = TRUE
      const { rowCount } = await pool.query(
        `UPDATE surga_agenda
         SET notification_envoyee = TRUE, updated_at = NOW()
         WHERE id = $1 AND notification_envoyee = FALSE`,
        [rappel.id]
      );

      // Si une autre instance a déjà marqué ce rappel, ignorer pour éviter tout doublon
      if (rowCount === 0) {
        continue;
      }

      stats.traites++;
      let canalUtilise = null;
      let envoiReussi = false;
      let erreurEnvoi = null;

      // 2. Tenter d'abord Web Push si l'utilisateur a des abonnements enregistrés
      let subscriptions = [];
      if (rappel.user_id) {
        const subRes = await pool.query(
          `SELECT endpoint, p256dh, auth
           FROM surga_push_subscriptions
           WHERE user_id = $1`,
          [rappel.user_id]
        );
        subscriptions = subRes.rows;
      }

      const pushPayload = {
        title: `Rappel Surga : ${rappel.titre}`,
        body: rappel.description || (rappel.heure_evenement ? `Prévu à ${rappel.heure_evenement}` : 'Rappel du jour'),
        icon: '/surga/icon-192.png',
        badge: '/surga/icon-192.png',
        url: '/surga/agenda',
        tag: `surga-rappel-${rappel.id}`,
        data: {
          rappelId: rappel.id,
          date: rappel.date_evenement,
          heure: rappel.heure_evenement,
        },
      };

      if (subscriptions.length > 0) {
        canalUtilise = 'webpush';
        let nbSuccess = 0;
        for (const sub of subscriptions) {
          const res = await sendWebPushNotification(sub, pushPayload);
          if (res.success) {
            nbSuccess++;
          } else {
            erreurEnvoi = res.error;
          }
        }
        if (nbSuccess > 0) {
          envoiReussi = true;
        }
      }

      // 3. Fallback WhatsApp si Web Push non configuré ou échoué
      if (!envoiReussi) {
        // SRG-A5-004 : seul le numéro du compte propriétaire du rappel peut être prévenu. L'ancien repli prenait le
        // dernier numéro ayant écrit à Surga, sans lien avec le rappel.
        const phone = rappel.user_phone;

        if (phone) {
          const norm = normalisePhone ? normalisePhone(phone) : phone;
          const msgWa = `Surga Rappel : ${rappel.titre}\n` +
            (rappel.heure_evenement ? `Heure prévue : ${rappel.heure_evenement}\n` : '') +
            (rappel.description ? `Note : ${rappel.description}\n` : '') +
            `Pour ouvrir votre agenda : https://surga.nopalou.com/agenda`;

          // SRG-A1-025 : le canal est noté avant l'appel. Une exception du fournisseur était journalisée
          // « in_app succes » alors que rien n'était parti.
          canalUtilise = 'whatsapp';
          try {
            const waRes = await sendWhatsAppText(norm, msgWa);
            envoiReussi = !!(waRes && (waRes.success !== false));
            if (!envoiReussi) erreurEnvoi = (waRes && waRes.error) || erreurEnvoi || 'Refus du fournisseur';
          } catch (waErr) {
            envoiReussi = false;
            erreurEnvoi = waErr.message;
          }
        }
      }

      // Aucun canal : ni abonnement push ni numéro. Le rappel reste visible dans l'application, mais rien n'est parti :
      // ce n'est pas un succès d'envoi.
      const aucunCanal = !canalUtilise;
      if (aucunCanal) {
        canalUtilise = 'in_app';
        envoiReussi = false;
        erreurEnvoi = 'Aucun canal de notification pour ce compte';
      }

      // SRG-A1-025 : un envoi en échec est retenté aux passages suivants, trois fois au plus. Le rappel n'est plus
      // tenu pour envoyé après un premier refus.
      let aRetenter = false;
      if (!envoiReussi && !aucunCanal) {
        try {
          const { rows: essais } = await pool.query(
            `SELECT COUNT(*)::int AS n FROM surga_notifications_logs WHERE rappel_id = $1 AND statut = 'echec' AND created_at > NOW() - INTERVAL '1 day'`,
            [rappel.id]
          );
          aRetenter = essais[0].n + 1 < MAX_TENTATIVES_ENVOI;
        } catch { aRetenter = false; }
      }

      // 4. Enregistrer dans les logs de notifications
      try {
        await pool.query(
          `INSERT INTO surga_notifications_logs (rappel_id, user_id, canal, statut, erreur, details)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            rappel.id,
            rappel.user_id || null,
            canalUtilise,
            envoiReussi ? 'succes' : 'echec',
            envoiReussi ? null : (erreurEnvoi || 'Canal indisponible'),
            JSON.stringify({ titre: rappel.titre, heure: rappel.heure_evenement, canal: canalUtilise }),
          ]
        );
      } catch (logErr) {
        console.warn('[SURGA NOTIF LOG ERR]:', logErr.message);
      }

      // 5. Envoi en échec à retenter : le rappel redevient « non envoyé », sans toucher à sa date.
      if (aRetenter) {
        await pool.query(
          `UPDATE surga_agenda SET notification_envoyee = FALSE, updated_at = NOW() WHERE id = $1`,
          [rappel.id]
        );
      } else if (rappel.repetition && rappel.repetition !== 'AUCUNE') {
        // 6. Récurrence (quotidien, hebdomadaire, mensuel) : première occurrence à venir
        const prochaineDate = calculerProchaineOccurrence(
          rappel.date_evenement.toISOString ? rappel.date_evenement.toISOString().slice(0, 10) : String(rappel.date_evenement).slice(0, 10),
          rappel.repetition,
          rappel.heure_evenement
        );

        await pool.query(
          `UPDATE surga_agenda
           SET date_evenement = $1, notification_envoyee = FALSE, updated_at = NOW()
           WHERE id = $2`,
          [prochaineDate, rappel.id]
        );
      }

      if (envoiReussi) {
        stats.succes++;
      } else {
        stats.echecs++;
      }

      stats.details.push({
        id: rappel.id,
        titre: rappel.titre,
        canal: canalUtilise,
        reussi: envoiReussi,
        repetition: rappel.repetition,
      });
    }

    return stats;
  } catch (err) {
    console.error('[SURGA CRON REMINDERS ERROR]:', err);
    throw err;
  }
}

/**
 * Lance la boucle de surveillance des rappels
 */
function demarrerCronRappels() {
  if (intervalId) return;

  console.log('[SURGA CRON]: Démarrage du worker de rappels (intervalle 60s)');
  
  // Exécution immédiate au démarrage
  setTimeout(() => {
    traiterRappelsEchus().catch(() => {});
  }, 2000);

  intervalId = setInterval(async () => {
    if (isProcessing) return;
    isProcessing = true;
    try {
      await traiterRappelsEchus();
    } catch (err) {
      console.warn('[SURGA CRON TICK ERR]:', err.message);
    } finally {
      isProcessing = false;
    }
  }, 60000);
}

/**
 * Arrête le worker
 */
function arreterCronRappels() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[SURGA CRON]: Arrêt du worker de rappels');
  }
}

module.exports = {
  traiterRappelsEchus,
  calculerProchaineDate,
  calculerProchaineOccurrence,
  demarrerCronRappels,
  arreterCronRappels,
};
